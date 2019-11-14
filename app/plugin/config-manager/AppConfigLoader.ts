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

import { AppConfigManagerConfig } from './AppConfigManager';
import { Application } from 'egg';
import { parseRepoName } from '../../basic/Utils';
import { readFileSync, existsSync } from 'fs';
import extend from 'extend2';
import { join } from 'path';

export class AppConfigLoader {

  private app: Application;

  constructor(app: Application) {
    this.app = app;
  }

  public async loadConfig(
    managerConfig: AppConfigManagerConfig, installationId: number, fullName: string): Promise<any> {

    const mysqlConfig = await this.loadConfigFromMysql(managerConfig);
    const fileConfig = await this.loadConfigFromFile(managerConfig, installationId, fullName);
    const remoteConfig = await this.loadConfigFromRemote(managerConfig, installationId, fullName);
    const mergeConfig = extend(true, { }, this.app.config, fileConfig, mysqlConfig, remoteConfig);

    // filter
    const retConfig: any = { };
    managerConfig.configurable.forEach(k => {
      if (mergeConfig[k]) {
        retConfig[k] = mergeConfig[k];
      }
    });

    return retConfig;
  }

  private async loadConfigFromMysql(managerConfig: AppConfigManagerConfig): Promise<any> {
    try {
      if (managerConfig.private.mysql) {
        return { };
      }
    } catch (error) {
      this.app.logger.error(error);
    }
    return { };
  }

  private async loadConfigFromFile(managerConfig: AppConfigManagerConfig,
                                   installationId: number, fullName: string): Promise<any> {
    try {
      if (managerConfig.private.file) {
        const fileFullPath = this.genRepoConfigFilePath(managerConfig.private.file.rootPath, installationId, fullName);
        if (existsSync(fileFullPath)) {
          return JSON.parse(readFileSync(fileFullPath).toString());
        }
      }
    } catch (error) {
      this.app.logger.error(error);
    }
    return { };
  }

  private async loadConfigFromRemote(
    managerConfig: AppConfigManagerConfig, installationId: number, fullName: string): Promise<any> {
    try {
      const client = await this.app.installation.getClient(installationId, fullName);
      if (client) {
        const ret = await client.getFileContent(managerConfig.remote.filePath);
        if (ret) {
          return JSON.parse(ret);
        }
      }
    } catch (error) {
      this.app.logger.error(error);
    }
    return { };
  }

  // rootPath_number_owner_repoName.json <= (installationId, fullName)
  private genRepoConfigFilePath(rootPath: string, installationId: number, fullName: string): string {
    const repoInfo = parseRepoName(fullName);
    return join(rootPath, `${installationId}_${repoInfo.owner}_${repoInfo.repo}.json`);
  }
}
