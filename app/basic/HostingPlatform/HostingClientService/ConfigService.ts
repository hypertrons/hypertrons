// Copyright 2019 Xlab
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
import { customizerMerge, customizerMergeWithType } from '../../Utils';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { PushEvent } from '../../../plugin/event-manager/events';
import { HostingClientConfigInitedEvent, HostingClientSyncConfigEvent } from '../event';
import { HostingClientBase } from '../HostingClientBase';
import { HostingConfigBase } from '../HostingConfigBase';
import { ClientServiceBase } from './ClientServiceBase';
import { cloneDeep } from 'lodash';
import { diff } from 'deep-diff';

export class ConfigService<TConfig extends HostingConfigBase, TRawClient>
                          extends ClientServiceBase<TConfig, TRawClient> {

  private config: any;
  private rawData: RawData;

  constructor(app: Application, client: HostingClientBase<TConfig, TRawClient>) {
    super(app, client, 'configService');
    this.config = {};
    this.rawData = {
      config: { file: {}, mysql: {}, remote: {} },
      luaScript: { remote: {} },
    };
  }

  public async onStart(): Promise<any> {
    this.client.eventService.subscribeAll(PushEvent, async e => {
      const hostingConfig = this.client.getHostingBase().getConfig();
      const filePath = hostingConfig.config.remote.filePath;
      if (e.push.commits.some(c => c.modified.includes(filePath) || c.added.includes(filePath))) {
        this.client.getHostingBase().updateConfigStatus(e.fullName, { config: { remote: 'updated' } } as any);
      } else if (e.push.commits.some(c => c.removed.includes(filePath))) {
        this.client.getHostingBase().updateConfigStatus(e.fullName, { config: { remote: 'deleted' } } as any);
      }

      if (hostingConfig.component.enableRepoLua) {
        const luaFilePath = hostingConfig.config.remote.luaScriptPath;
        if (e.push.commits.some(c => c.added.find(f => f.startsWith(luaFilePath)) ||
                                    c.modified.find(f => f.startsWith(luaFilePath)) ||
                                    c.removed.find(f => f.startsWith(luaFilePath)))) {
          this.client.getHostingBase().updateConfigStatus(e.fullName, { luaScript: { remote: 'updated' } } as any);
        }
      }
    });

    this.client.eventService.subscribeAll(HostingClientConfigInitedEvent, async e => {
      this.logger.info('Hosting client config inited, update local config');
      this.client.getHostingBase().getRepoConfigStatus().clear();
      if (e.status) this.client.getHostingBase().updateConfigStatus(e.fullName, e.status);
      let needUpdateConfig = false;
      if (e.rawData.config) {
        Object.keys(e.rawData.config).forEach(key => {
          if (e.rawData.config[key]) {
            needUpdateConfig = true;
            this.rawData.config[key] = e.rawData.config[key];
          }
        });
        if (needUpdateConfig) await this.mergeConfig();
      }
      let needUpdateLuaScript = false;
      if (e.rawData.luaScript) {
        Object.keys(e.rawData.luaScript).forEach(key => {
          if (e.rawData.luaScript[key]) {
            needUpdateLuaScript = true;
            this.rawData.luaScript[key] = e.rawData.luaScript[key];
          }
        });
        if (needUpdateLuaScript) await this.mergeLuaScript();
      }
      if (needUpdateConfig || needUpdateLuaScript) this.client.onConfigLoaded();
    });

    this.client.eventService.subscribeOne(HostingClientSyncConfigEvent, async e => this.syncData(e.status));
  }

  public async onDispose(): Promise<any> { }

  public async onConfigLoaded(): Promise<any> { }

  public async syncData(status= { config: { file: 'updated', mysql: 'updated', remote: 'init' },
                                  luaScript: { remote: 'updated' },
                                }): Promise<void> {
    this.logger.info('Start to load and sync config');

    // do not need update
    if (!Object.values(status.config).find(v => v !== 'clear') &&
        !Object.values(status.luaScript).find(v => v !== 'clear')) return;

    const event: HostingClientConfigInitedEvent = {
      installationId: this.client.getHostId(),
      fullName: this.client.getFullName(),
      rawData: {
        config: {  file: undefined, mysql: undefined, remote: undefined },
        luaScript: { remote: undefined },
      },
      status: undefined,
    };

    // config.file
    if (status.config.file === 'deleted') {
      this.rawData.config.file = {};
      event.rawData.config.file = this.rawData.config.file;
    } else if (status.config.file === 'updated') {
      this.rawData.config.file = await this.loadConfigFromFile();
      event.rawData.config.file = this.rawData.config.file;
    }
    // config.mysql
    if (status.config.mysql === 'deleted') {
      this.rawData.config.mysql = {};
      event.rawData.config.mysql = this.rawData.config.mysql;
    } else if (status.config.mysql === 'updated') {
      this.rawData.config.mysql = await this.loadConfigFromMysql();
      event.rawData.config.mysql = this.rawData.config.mysql;
    }
    // config.remote
    if (status.config.remote === 'deleted') {
      this.rawData.config.remote = {};
      event.rawData.config.remote = this.rawData.config.remote;
    } else if (status.config.remote === 'updated') {
      const remote = await this.loadConfigFromRemote();
      if (diff(remote, this.rawData.config.remote) === undefined) {
        event.status = { config: { remote: 'updated' } } as any;
      } else {
        this.rawData.config.remote = remote;
        event.rawData.config.remote = this.rawData.config.remote;
      }
    } else if (status.config.remote === 'init') {
      this.rawData.config.remote = await this.loadConfigFromRemote();
      event.rawData.config.remote = this.rawData.config.remote;
    }
    // luaScript.remote
    if (status.luaScript.remote === 'updated') {
      this.rawData.luaScript.remote = await this.loadLuaScriptFromRemote();
      event.rawData.luaScript.remote = this.rawData.luaScript.remote;
    }
    this.client.eventService.publish('all', HostingClientConfigInitedEvent, event);
  }

  private async mergeConfig() {
    const mergeConfig = customizerMerge(...Object.values(this.rawData.config).map(v => v));
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
      if (remoteConfig) return JSON.parse(remoteConfig);
    } catch (error) {
      this.logger.error(error);
    }
    return {};
  }

  private async mergeLuaScript(): Promise<void> {
    const defaultLuaComps = await this.client.getHostingBase().compService.getDefaultLuaScript(this.config);
    const mergedLuaScript = customizerMergeWithType(defaultLuaComps, this.rawData.luaScript.remote);
    if (mergedLuaScript) {
      Object.keys(mergedLuaScript).forEach(compName => {
        if (this.config[compName] && mergedLuaScript[compName]) {
          this.config[compName].luaScript = cloneDeep(mergedLuaScript[compName]);
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
        repoLuaComps[compNames[i]] = await this.client.getFileContent(luaCompPath);
      }
    } catch (error) {
      this.logger.error(error);
    }
    return repoLuaComps;
  }

  // rootPath/owner/repoName.json
  private genRepoConfigFilePath(rootPath: string): string {
    return join(rootPath, this.client.getFullName() + '.json') ;
  }

  // rootPath/componentName.lua
  private genRepoLuaFilePath(rootPath: string, componentName: string): string {
    return join(rootPath, componentName + '.lua');
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

  public getLuaScript(): string {
    return this.getLuaScriptAndOffset().luaScript;
  }

  public getLuaScriptOffset(): Array<{ compName: string, offset: number }> {
    return this.getLuaScriptAndOffset().offset;
  }

  public getLuaScriptAndOffset(): { luaScript: string,
                                    offset: Array<{ compName: string, offset: number }>} {
    let luaScript = '';
    const luaScriptOffset: Array<{ compName: string, offset: number }> = [];
    Object.keys(this.config).forEach(compName => {
      if (this.config[compName] && this.config[compName].luaScript) {
        const head = `local ${compName} = function ()
  local compName = '${compName}'
  local compConfig = config.${compName}
`;
        const tail = `
end
${compName}()
`;
        const compScript = head + this.config[compName].luaScript + tail;
        luaScript += compScript;
        luaScriptOffset.push({ compName, offset: compScript.split('\n').length - 1 });
      }
    });
    return { luaScript, offset: luaScriptOffset };
  }
}

export type Status = 'clear' | 'updated' | 'deleted';
export interface RawDataStatus {
  config: {
    file: Status;
    mysql: Status;
    remote: Status | 'init';
  };
  luaScript: {
    remote: Status;
  };
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
