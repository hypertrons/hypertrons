// Copyright 2019 - present Xlab
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { Application } from 'egg';
import { customizerMerge, customizerMergeWithType, getNanoTimeStamp } from '../../Utils';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { PushEvent } from '../../../plugin/event-manager/events';
import {
  HostingClientConfigInitedEvent, HostingClientSyncConfigEvent, HostingClientOnConfigFileChangedEvent,
} from '../event';
import { HostingClientBase } from '../HostingClientBase';
import { HostingConfigBase } from '../HostingConfigBase';
import { ClientServiceBase } from './ClientServiceBase';
import { cloneDeep } from 'lodash';

export class ConfigService<TConfig extends HostingConfigBase, TRawClient>
                          extends ClientServiceBase<TConfig, TRawClient> {

  private config: any;
  private luaScript: any;
  private rawData: RawData;
  private version: number;

  constructor(app: Application, client: HostingClientBase<TConfig, TRawClient>) {
    super(app, client, 'configService');
    this.config = {};
    this.luaScript = {};
    this.rawData = {
      config: { file: {}, mysql: {}, remote: {} },
      luaScript: { remote: {} },
    };
    this.version = 0;
  }

  public async onStart(): Promise<any> {
    // On remote config or lua script changed
    this.client.eventService.subscribeAll(PushEvent, async e => {
      const hostingConfig = this.client.getHostingBase().getConfig();
      const filePath = hostingConfig.config.remote.filePath;

      // On remote config changed
      if (e.push.commits.some(c => c.modified.includes(filePath) || // update remote config
                                   c.added.includes(filePath))) {
        this.client.eventService.publish('all', HostingClientConfigInitedEvent, {
          installationId: this.client.getHostId(),
          fullName: this.client.getFullName(),
          rawData: {
            config: {
              remote: await this.loadConfigFromRemote(),
            },
          } as any,
          version: getNanoTimeStamp(),
        });
      } else if (e.push.commits.some(c => c.removed.includes(filePath))) { // delete remote config
        this.client.eventService.publish('all', HostingClientConfigInitedEvent, {
          installationId: this.client.getHostId(),
          fullName: this.client.getFullName(),
          rawData: {
            config: {
              remote: {},
            },
          } as any,
          version: getNanoTimeStamp(),
        });
      }

      // On remote lua script changed
      if (hostingConfig.component.enableRepoLua) {
        // Update remote user defined lua script
        const luaFilePath = hostingConfig.config.remote.luaScriptPath;
        if (e.push.commits.some(c => c.added.find(f => f.startsWith(luaFilePath)) ||
                                     c.modified.find(f => f.startsWith(luaFilePath)) ||
                                     c.removed.find(f => f.startsWith(luaFilePath)))) {
          this.client.eventService.publish('all', HostingClientConfigInitedEvent, {
            installationId: this.client.getHostId(),
            fullName: this.client.getFullName(),
            rawData: {
              luaScript: {
                remote: await this.loadLuaScriptFromRemote(),
              },
            } as any,
            version: getNanoTimeStamp(),
          });
        }
      }
    });

    // On file config changed
    this.client.eventService.subscribeOne(HostingClientOnConfigFileChangedEvent, async fileEvent => {
      this.logger.info('On file config changed');
      const e: HostingClientConfigInitedEvent = {
        installationId: this.client.getHostId(),
        fullName: this.client.getFullName(),
        rawData: {
          config: {
            file: {},
          },
        } as any,
        version: getNanoTimeStamp(),
      };
      if (fileEvent.option === 'update') {
        e.rawData.config.file = await this.loadConfigFromFile();
      }
      this.client.eventService.publish('all', HostingClientConfigInitedEvent, e);
    });

    /*
     * Update process local configuration after receiving synchronization event
     * In order to prevent the old configuration overwriting the new configuration,
     * version information is added here, and the update operation will only be performed if
     * the current version is empty or the current version number is less than the new configuration version number.
     * The version is represented by a timestamp in string format
     */
    this.client.eventService.subscribeAll(HostingClientConfigInitedEvent, async e => {
      this.logger.info('Hosting client config inited, update local config');
      if (this.version < e.version) {
        this.version = e.version;
        if (e.rawData.config) {
          Object.keys(e.rawData.config).forEach(key => {
            this.rawData.config[key] = e.rawData.config[key];
          });
          await this.mergeConfig();
        }
        if (e.rawData.luaScript) {
          Object.keys(e.rawData.luaScript).forEach(key => {
            this.rawData.luaScript[key] = e.rawData.luaScript[key];
          });
        }
        await this.mergeLuaScript();
        this.client.onConfigLoaded();
      }
    });

    // Only one work load config, and then publish to all.
    this.client.eventService.subscribeOne(HostingClientSyncConfigEvent, () => this.syncData());
  }

  public async onDispose(): Promise<any> { }

  public async onConfigLoaded(): Promise<any> { }

  public async syncData(): Promise<void> {
    // load config
    this.rawData.config.file = await this.loadConfigFromFile();
    this.rawData.config.mysql = await this.loadConfigFromMysql();
    this.rawData.config.remote = await this.loadConfigFromRemote();
    await this.mergeConfig();

    // load user defined lua script if enableRepoLua=true
    const hostingConfig = this.client.getHostingBase().getConfig();
    if (hostingConfig.component.enableRepoLua) {
      this.rawData.luaScript.remote = await this.loadLuaScriptFromRemote();
    }

    // publish to all to sync config
    this.client.eventService.publish('all', HostingClientConfigInitedEvent, {
      installationId: this.client.getHostId(),
      fullName: this.client.getFullName(),
      rawData: this.rawData,
      version: getNanoTimeStamp(),
    });
  }

  /**************************** config ****************************/
  private async mergeConfig() {
    const mergeConfig = customizerMerge(this.rawData.config.file, this.rawData.config.mysql, this.rawData.config.remote);
    const defaultConfig = await this.client.getHostingBase().compService.getDefaultConfig(mergeConfig);
    this.config = customizerMergeWithType(defaultConfig, mergeConfig);
  }

  private async loadConfigFromFile(): Promise<any> {
    try {
      const hostingConfig = this.client.getHostingConfig();
      if (hostingConfig.config.private.file) {
        const fileFullPath = this.genRepoConfigFilePath(hostingConfig.config.private.file.rootPath);
        if (existsSync(fileFullPath)) return JSON.parse(readFileSync(fileFullPath).toString());
      }
    } catch (error) {
      this.logger.error(error);
    }
    return {};
  }

  private async loadConfigFromMysql(): Promise<any> {
    // TODO implement load config from mysql
    return {};
  }

  private async loadConfigFromRemote(): Promise<any> {
    try {
      const hostingConfig = this.client.getHostingConfig();
      // load config from remote
      const remoteConfig = await this.client.getFileContent(hostingConfig.config.remote.filePath);
      if (remoteConfig) return JSON.parse(remoteConfig.content);
    } catch (error) {
      this.logger.error(error);
    }
    return {};
  }

  // rootPath/owner/repoName.json
  private genRepoConfigFilePath(rootPath: string): string {
    return join(rootPath, this.client.getFullName() + '.json');
  }

  public getConfig(): any {
    return this.config;
  }

  public getCompConfig<TConfig>(comp: string): TConfig | undefined {
    if (this.config[comp]) {
      return this.config[comp] as TConfig;
    }
    return undefined;
  }

  /**************************** luaScript ****************************/
  private async mergeLuaScript(): Promise<void> {
    const defaultLuaComps = await this.client.getHostingBase().compService.getDefaultLuaScript(this.config);
    const mergedLuaScript = customizerMergeWithType(defaultLuaComps, this.rawData.luaScript.remote);
    if (mergedLuaScript) {
      this.luaScript = {};
      Object.keys(mergedLuaScript).forEach(compName => {
        if (this.config[compName] && mergedLuaScript[compName]) {
          this.luaScript[compName] = cloneDeep(mergedLuaScript[compName]);
        }
      });
    }
  }

  private async loadLuaScriptFromRemote(): Promise<any> {
    const repoLuaComps: any = {};
    try {
      const hostingConfig = this.client.getHostingConfig();
      if (!hostingConfig.component.enableRepoLua) return {};

      const compNames = Object.keys(this.config);
      for (const i in compNames) {
        const luaCompPath = this.genRepoLuaFilePath(hostingConfig.config.remote.luaScriptPath, compNames[i]);
        const file = await this.client.getFileContent(luaCompPath);
        if (file && file.content) repoLuaComps[compNames[i]] = file.content;
      }
    } catch (error) {
      this.logger.error(error);
    }
    return repoLuaComps;
  }

  // rootPath/componentName.lua
  private genRepoLuaFilePath(rootPath: string, componentName: string): string {
    return join(rootPath, componentName + '.lua');
  }

  public getLuaScript(): string {
    return this.getLuaScriptAndOffset().luaScript;
  }

  public getLuaScriptOffset(): Array<{ compName: string, offset: number }> {
    return this.getLuaScriptAndOffset().offset;
  }

  public getLuaScriptAndOffset(): { luaScript: string, offset: Array<{ compName: string, offset: number }> } {
    let luaScript = '';
    const luaScriptOffset: Array<{ compName: string, offset: number }> = [];
    Object.keys(this.luaScript).forEach(compName => {
      const head = `local ${compName} = function ()
  local compName = '${compName}'
  local compConfig = config.${compName}
`;
      const tail = `
end
${compName}()
`;
      const compScript = head + this.luaScript[compName] + tail;
      luaScript += compScript;
      luaScriptOffset.push({ compName, offset: compScript.split('\n').length - 1 });
    });
    return { luaScript, offset: luaScriptOffset };
  }
}

export interface RawData {
  config: {
    file: any;
    mysql: any;
    remote: any;
  };
  luaScript: {
    remote: any;
  };
}
