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
import { parseRepoName, customizerMerge, BotLogger, loggerWrapper } from '../Utils';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { HostingConfigBase } from './HostingConfigBase';
import { IClient } from '../../plugin/installation-manager/IClient';

export class ConfigLoader {

  private app: Application;
  private logger: BotLogger;

  constructor(app: Application) {
    this.app = app;
    this.logger = loggerWrapper(app.logger, '[config-loader]');
  }

  public async loadConfig(config: HostingConfigBase, installationId: number,
                          fullName: string, client: IClient): Promise<any> {

    const mysqlConfig = await this.loadConfigFromMysql(config);
    const fileConfig = await this.loadConfigFromFile(config, installationId, fullName);
    const remoteConfig = await this.loadConfigFromRemote(config, client);
    const defaultConfig = await this.loadDefaultConfig();

    const mergeConfig = customizerMerge(defaultConfig, fileConfig, mysqlConfig, remoteConfig);
    if (mergeConfig.error && mergeConfig.error.length !== 0) {
      mergeConfig.error.forEach((err: any) => {
        this.logger.error(err);
      });
    }

    return mergeConfig.config;
  }

  private async loadConfigFromMysql(config: HostingConfigBase): Promise<any> {
    try {
      if (config.config.private.mysql) {
        return { };
      }
    } catch (error) {
      this.logger.error(error);
    }
    return { };
  }

  private async loadConfigFromFile(config: HostingConfigBase,
                                   installationId: number, fullName: string): Promise<any> {
    try {
      if (config.config.private.file) {
        const fileFullPath = this.genRepoConfigFilePath(config.config.private.file.rootPath, installationId, fullName);
        if (existsSync(fileFullPath)) {
          return JSON.parse(readFileSync(fileFullPath).toString());
        }
      }
    } catch (error) {
      this.logger.error(error);
    }
    return { };
  }

  private async loadConfigFromRemote(config: HostingConfigBase, client: IClient): Promise<any> {
    try {
      if (client) {
        const ret = await client.getFileContent(config.config.remote.filePath);
        if (ret) {
          return JSON.parse(ret);
        }
      }
    } catch (error) {
      this.logger.error(error);
    }
    return { };
  }

  private async loadDefaultConfig(): Promise<any> {
    return this.app.component.getDefaultConfig();
  }

  // rootPath_number_owner_repoName.json <= (installationId, fullName)
  private genRepoConfigFilePath(rootPath: string, installationId: number, fullName: string): string {
    const repoInfo = parseRepoName(fullName);
    return join(rootPath, `${installationId}_${repoInfo.owner}_${repoInfo.repo}.json`);
  }
}
