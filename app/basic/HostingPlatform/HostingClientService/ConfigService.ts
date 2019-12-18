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
import { parseRepoName, customizerMerge, BotLogger, loggerWrapper, customizerMergeWithType } from '../../Utils';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { PushEvent } from '../../../plugin/event-manager/events';
import { HostingClientConfigInitedEvent } from '../event';
import { HostingClientBase } from '../HostingClientBase';
import { HostingConfigBase } from '../HostingConfigBase';

export class ConfigService<TConfig extends HostingConfigBase, TRawClient> {

  private config: any;
  private luaScript: string;
  private client: HostingClientBase<TConfig, TRawClient>;
  private logger: BotLogger;

  constructor(app: Application, client: HostingClientBase<TConfig, TRawClient>) {
    this.client = client;
    this.logger = loggerWrapper(app.logger, `[config-service-${client.getHostId()}-${client.getFullName()}]`);
  }

  public init(): void {
    this.client.eventManager.subscribeOne(PushEvent, async e => {
      const hostingConfig = this.client.getHostingBase().getConfig();
      const filePath = hostingConfig.config.remote.filePath;
      if (e.push.commits.some(c =>
        c.modified.includes(filePath) || c.added.includes(filePath) || c.removed.includes(filePath))) {
        this.syncConfig();
      } else if (hostingConfig.enableRepoLua) {
        const luaFilePath = hostingConfig.config.remote.luaScriptPath;
        if (e.push.commits.some(c =>
          c.added.find(f => f.startsWith(luaFilePath)) ||
          c.modified.find(f => f.startsWith(luaFilePath)) ||
          c.removed.find(f => f.startsWith(luaFilePath)))) {
          this.syncConfig();
        }
      }
    });
    this.client.eventManager.subscribeAll(HostingClientConfigInitedEvent, async e => {
      this.config = e.config;
      this.luaScript = e.luaScript;
      this.client.onConfigLoaded();
    });
    this.syncConfig();
  }

  private async syncConfig(): Promise<void> {
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

    const mergeConfig = customizerMerge(mysqlConfig.config, fileConfig.config, remoteConfig.config);
    const mergeLuaScript = customizerMerge(mysqlConfig.luaScript, fileConfig.luaScript, remoteConfig.luaScript);

    const defaultConfig = this.loadDefaultConfig(mergeConfig);
    this.config = customizerMergeWithType(defaultConfig.config, mergeConfig);
    const mergeLua = customizerMergeWithType(defaultConfig.lua, mergeLuaScript);
    this.generateLuaContent(mergeLua);
  }

  private async loadConfigFromMysql(): Promise<{ config: any, luaScript: any }> {
    // TODO implement load config from mysql
    return { config: {}, luaScript: {} };
  }

  private async loadConfigFromFile(): Promise<{ config: any, luaScript: any }> {
    const hostingConfig = this.client.getHostingConfig();
    let config: any = {};
    const luaScript: any = {};
    try {
      if (!hostingConfig.config.private.file) return { config, luaScript };
      const rootPath = hostingConfig.config.private.file.rootPath;

      // load config from file
      const fileFullPath = this.genRepoConfigFilePath(rootPath);
      if (existsSync(fileFullPath)) {
        config = JSON.parse(readFileSync(fileFullPath).toString());
      }

      // load lua script from file
      if (hostingConfig.enableRepoLua) {
        Object.keys(config).forEach(key => {
          const luaCompFilePath = this.genRepoLuaFilePath(rootPath, key);
          if (existsSync(luaCompFilePath)) {
            luaScript[key] = readFileSync(luaCompFilePath).toString();
          }
        });
      }
    } catch (error) {
      this.logger.error(error);
    }
    return { config, luaScript };
  }

  private async loadConfigFromRemote(): Promise<{ config: any, luaScript: any }> {
    let config: any = {};
    const luaScript: any = {};
    const hostingConfig = this.client.getHostingConfig();
    try {
      // load config from remote
      const ret = await this.client.getFileContent(hostingConfig.config.remote.filePath);
      if (ret) config = JSON.parse(ret);

      // load lua script from remote
      if (hostingConfig.enableRepoLua) {
        Object.keys(config).forEach(async comp => {
          const luaCompPath = join(hostingConfig.config.remote.luaScriptPath, comp, '.lua');
          luaScript[comp] = await this.client.getFileContent(luaCompPath);
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

  // rootPath_number_owner_repoName.json <= (installationId, fullName)
  private genRepoConfigFilePath(rootPath: string): string {
    if (!rootPath) return '';
    const { owner, repo } = parseRepoName(this.client.getFullName());
    if (!owner || !repo) return '';
    return join(rootPath, `${this.client.getHostId}_${owner}_${repo}.json`);
  }

  // rootPath_number_owner_repoName_lua/_${compName} <= (installationId, fullName, compName)
  private genRepoLuaFilePath(rootPath: string, compName: string): string {
    if (!rootPath || !compName) return '';
    const { owner, repo } = parseRepoName(this.client.getFullName());
    if (!owner || !repo) return '';
    return join(rootPath, `${this.client.getHostId}_${owner}_${repo}_lua`, compName);
  }

  public generateLuaContent(mergeLua: any) {
    Object.keys(mergeLua).forEach(lua => {
      this.luaScript += lua;
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
