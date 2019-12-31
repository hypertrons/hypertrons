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
  private luaScriptOffset: Array<{ compName: string, offset: number }>;

  constructor(app: Application, client: HostingClientBase<TConfig, TRawClient>) {
    super(app, client, 'configService');
    this.luaScriptOffset = [];
    this.luaScript = '';
  }

  public async onStart(): Promise<any> {
    this.client.eventService.subscribeOne(PushEvent, async e => {
      const hostingConfig = this.client.getHostingBase().getConfig();
      const luaFilePath = hostingConfig.config.remote.luaScriptPath;
      const filePath = hostingConfig.config.remote.filePath;

      const updateConfig = e.push.commits.some(c =>
        c.modified.includes(filePath) || c.added.includes(filePath) || c.removed.includes(filePath));
      const updateLua = hostingConfig.enableRepoLua && e.push.commits.some(c =>
        c.added.find(f => f.startsWith(luaFilePath)) ||
        c.modified.find(f => f.startsWith(luaFilePath)) ||
        c.removed.find(f => f.startsWith(luaFilePath)));

      if (updateConfig || updateLua) this.syncData(updateConfig, updateLua);
    });

    this.client.eventService.subscribeAll(HostingClientConfigInitedEvent, async e => {
      this.logger.info('Hosting client config inited, update local config');
      if (e.config) {
        this.config = e.config;
      }
      if (e.luaScript) {
        this.luaScript = e.luaScript;
      }
      this.client.onConfigLoaded();
    });
  }

  public async onDispose(): Promise<any> { }

  public async onConfigLoaded(): Promise<any> { }

  public async syncData(updateConfig = true, updateLuaScript = true): Promise<void> {
    this.logger.info('Start to load and sync config');

    const e = {
      installationId: this.client.getHostId(),
      fullName: this.client.getFullName(),
      config: undefined,
      luaScript: '',
    };

    if (updateConfig) {
      await this.loadConfig();
      e.config = this.config;
    }
    if (updateLuaScript) {
      await this.loadLuaScript();
      e.luaScript = this.luaScript;
    }

    this.client.eventService.publish('all', HostingClientConfigInitedEvent, e);
  }

  private async loadLuaScript(): Promise<void> {
    const repoLuaComps = await this.loadLuaScriptFromRemote();
    const defaultLuaComps = await this.client.getHostingBase().compService.getDefaultLuaScript(this.config);
    const mergedLuaComps = customizerMergeWithType(defaultLuaComps, repoLuaComps);
    this.generateLuaContent(mergedLuaComps);
  }

  private async loadConfig(): Promise<void> {
    const mysqlConfig = await this.loadConfigFromMysql();
    const fileConfig = await this.loadConfigFromFile();
    const remoteConfig = await this.loadConfigFromRemote();
    const mergeConfig = customizerMerge(mysqlConfig, fileConfig, remoteConfig);
    const defaultConfig = await this.client.getHostingBase().compService.getDefaultConfig(mergeConfig);
    this.config = customizerMergeWithType(defaultConfig, mergeConfig);
  }

  private async loadConfigFromMysql(): Promise<any> {
    // TODO implement load config from mysql
    return {};
  }

  private async loadConfigFromFile(): Promise<any> {
    try {
      const hostingConfig = this.client.getHostingConfig();
      if (!hostingConfig || !hostingConfig.config || !hostingConfig.config.private ||
        !hostingConfig.config.private.file || !hostingConfig.config.private.file.rootPath) return {};
      const fileFullPath = this.genRepoConfigFilePath(hostingConfig.config.private.file.rootPath);
      if (existsSync(fileFullPath)) {
        return JSON.parse(readFileSync(fileFullPath).toString());
      }
    } catch (error) {
      this.logger.error(error);
    }
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

  private async loadLuaScriptFromRemote(): Promise<any> {
    const repoLuaComps: any = {};
    try {
      const hostingConfig = this.client.getHostingConfig();
      if (!hostingConfig.enableRepoLua) return {};

      const compNames = Object.keys(this.config);
      for (const i in compNames) {
        const luaCompPath = join(hostingConfig.config.remote.luaScriptPath, compNames[i] + '.lua');
        repoLuaComps[compNames[i]] = await this.client.getFileContent(luaCompPath);
      }
    } catch (error) {
      this.logger.error(error);
    }
    return repoLuaComps;
  }

  // rootPath/number_owner_repoName.json
  private genRepoConfigFilePath(rootPath: string): string {
    if (!rootPath) return '';
    const { owner, repo } = parseRepoName(this.client.getFullName());
    if (!owner || !repo) return '';
    return join(rootPath, `${this.client.getHostId()}_${owner}_${repo}.json`);
  }

  private generateLuaContent(mergeLua: any) {
    this.luaScript = '';
    Object.keys(mergeLua).forEach(compName => {
      if (mergeLua[compName]) {
        const head = `local ${compName} = function ()
  local compName = '${compName}'
  local compConfig = config.${compName}
`;
        const tail = `
end
${compName}()
`;
        const compScript = head + mergeLua[compName] + tail;
        this.luaScriptOffset.push({ compName, offset: compScript.split('\n').length - 1 });
        this.luaScript += compScript;
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
  public getLuaScriptOffset(): Array<{ compName: string, offset: number }> {
    return this.luaScriptOffset;
  }
}
