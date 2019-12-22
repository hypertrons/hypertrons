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
import { parseRepoName, customizerMerge, customizerMergeWithType } from '../../Utils';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { PushEvent } from '../../../plugin/event-manager/events';
import { HostingClientConfigInitedEvent } from '../event';
import { HostingClientBase } from '../HostingClientBase';
import { HostingConfigBase } from '../HostingConfigBase';
import { ClientServiceBase } from './ClientServiceBase';

export class ConfigService<TConfig extends HostingConfigBase, TRawClient> extends ClientServiceBase<TConfig, TRawClient> {

  private config: any;
  private luaScript: string;

  constructor(app: Application, client: HostingClientBase<TConfig, TRawClient>) {
    super(app, client, 'config');
  }

  public async onStart(): Promise<any> {
    this.client.eventManager.subscribeOne(PushEvent, async e => {
      const hostingConfig = this.client.getHostingBase().getConfig();
      const filePath = hostingConfig.config.remote.filePath;
      if (e.push.commits.some(c =>
        c.modified.includes(filePath) || c.added.includes(filePath) || c.removed.includes(filePath))) {
        this.syncData();
      } else if (hostingConfig.enableRepoLua) {
        const luaFilePath = hostingConfig.config.remote.luaScriptPath;
        if (e.push.commits.some(c =>
          c.added.find(f => f.startsWith(luaFilePath)) ||
          c.modified.find(f => f.startsWith(luaFilePath)) ||
          c.removed.find(f => f.startsWith(luaFilePath)))) {
          this.syncData();
        }
      }
    });
    this.client.eventManager.subscribeAll(HostingClientConfigInitedEvent, async e => {
      this.config = e.config;
      this.luaScript = e.luaScript;
      this.client.onConfigLoaded();
    });
  }

  public async onDispose(): Promise<any> { }

  public async onConfigLoaded(): Promise<any> { }

  public async syncData(): Promise<void> {
    await this.loadConfig();
    this.client.eventManager.publish('all', HostingClientConfigInitedEvent, {
      id: this.client.getHostId(),
      fullName: this.client.getFullName(),
      config: this.config,
      luaScript: this.luaScript,
    });
  }

  public async loadConfig(): Promise<void> {
    const mysqlConfig = await this.loadConfigFromMysql();
    const fileConfig = await this.loadConfigFromFile();
    const remoteConfig = await this.loadConfigFromRemote();
    const mergeConfig = customizerMerge(mysqlConfig, fileConfig, remoteConfig.config);
    const defaultConfig = this.loadDefaultConfig(mergeConfig);

    this.config = customizerMergeWithType(defaultConfig.config, mergeConfig);
    const mergeLua = customizerMergeWithType(defaultConfig.lua, remoteConfig.luaScript);

    this.generateLuaContent(mergeLua);
  }

  private async loadConfigFromMysql(): Promise<any> {
    // TODO implement load config from mysql
    return { };
  }

  private async loadConfigFromFile(): Promise<any> {
    try {
      const hostingConfig = this.client.getHostingConfig();
      if (!hostingConfig || !hostingConfig.config || !hostingConfig.config.private ||
        !hostingConfig.config.private.file || hostingConfig.config.private.file.rootPath) return { };

      const fileFullPath = this.genRepoConfigFilePath(hostingConfig.config.private.file.rootPath);
      if (existsSync(fileFullPath)) {
        return JSON.parse(readFileSync(fileFullPath).toString());
      }
    } catch (error) {
      this.logger.error(error);
    }
    return { };
  }

  private async loadConfigFromRemote(): Promise<{ config: any, luaScript: any }> {
    let config: any = { };
    const luaScript: any = { };
    const hostingConfig = this.client.getHostingConfig();
    try {
      // load config from remote
      const remoteConfig = await this.client.getFileContent(hostingConfig.config.remote.filePath);
      if (remoteConfig) config = JSON.parse(remoteConfig);

      // load lua script from remote if enable
      if (hostingConfig.enableRepoLua) {
        Object.keys(config).forEach(async compName => {
          const luaCompPath = join(hostingConfig.config.remote.luaScriptPath, compName + '.lua');
          luaScript[compName] = await this.client.getFileContent(luaCompPath);
        });
      }
    } catch (error) {
      this.logger.error(error);
    }
    return { config, luaScript };
  }

  private loadDefaultConfig(mergeConfig: any): { config: any, lua: string } {
    const compKeys = Object.keys(mergeConfig).map(comp => {
      return { name: comp, version: mergeConfig[name].version };
    });
    return this.client.getHostingBase().compService.getDefaultConfig(compKeys);
  }

  // rootPath/number_owner_repoName.json
  private genRepoConfigFilePath(rootPath: string): string {
    if (!rootPath) return '';
    const { owner, repo } = parseRepoName(this.client.getFullName());
    if (!owner || !repo) return '';
    return join(rootPath, `${this.client.getHostId}_${owner}_${repo}.json`);
  }

  private generateLuaContent(mergeLua: any) {
    Object.keys(mergeLua).forEach(compName => {
      if (mergeLua[compName]) {
        const head = `local ${compName} = function ()
  local compConfig = config.${compName}
  local compName = ${compName}
`;
        const tail = `
end
${compName}()
`;
        this.luaScript += head + mergeLua[compName] + tail;
      }
    });
  }

  public getConfig(): any {
    return this.config;
  }

  public getLuaScript(): string {
    return this.luaScript;
  }

  public getCompConfig<TConfig>(comp: string): TConfig | undefined {
    if (this.config[comp]) {
      return this.config[comp] as TConfig;
    }
    return undefined;
  }
}
