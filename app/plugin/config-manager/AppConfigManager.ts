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

import { ConfigManagerInternalConfigLoadedEvent } from './events';
import {
  ClientReadyEvent, RepoPushEvent, RepoRemovedEvent, ConfigManagerConfigLoadedEvent,
} from '../event-manager/events';
import { Application } from 'egg';
import { AppPluginBase } from '../../basic/AppPluginBase';
import { AppConfigLoader } from './AppConfigLoader';

export class AppConfigManager extends AppPluginBase<AppConfigManagerConfig> {

  private configMap: Map<string, any>;
  private appConfigLoader: AppConfigLoader;

  constructor(config: AppConfigManagerConfig, app: Application) {
    super(config, app);
    this.configMap = new Map<string, any>();
    this.appConfigLoader = new AppConfigLoader(this.app);
  }

  public async onReady() {

    // load the configuration when client ready
    this.app.event.subscribeOne(ClientReadyEvent, async event => {
      this.loadConfig(event.installationId, event.fullName);
    });

    // update the configuration when a repo was removed
    this.app.event.subscribeOne(RepoRemovedEvent, async event => {
      this.loadConfig(event.installationId, event.fullName);
    });

    // update configuration when receive a push event
    this.app.event.subscribeOne(RepoPushEvent, async event => {
      if (event.commits.some(c => {
          // put modified first because this is the most common situation
          return c.modified.indexOf(this.config.remote.filePath) >= 0 ||
          c.added.indexOf(this.config.remote.filePath) >= 0 ||
          c.removed.indexOf(this.config.remote.filePath) >= 0;
      })) {
        this.loadConfig(event.installationId, event.fullName);
      }
    });

    // config loaded, update self config map
    this.app.event.subscribeAll(ConfigManagerInternalConfigLoadedEvent, async event => {
      this.configMap.set(this.genRepoConfigKey(event.installationId, event.fullName), event.config);
      this.app.event.publish('worker', ConfigManagerConfigLoadedEvent, event);
    });

  }

  public async onStart() { }

  public async onClose() { }

  public async getConfig(installationId: number, fullName: string): Promise<any> {
    return this.configMap.get(this.genRepoConfigKey(installationId, fullName));
  }

  private async loadConfig(installationId: number, fullName: string): Promise<void> {
    const config = await this.appConfigLoader.loadConfig(this.config, installationId, fullName);
    const newEvent = {
      installationId,
      fullName,
      config,
    };
    // notify all workers to update cache
    this.app.event.publish('workers', ConfigManagerInternalConfigLoadedEvent, newEvent);
  }

  // installationId/fullName <= (installationId, fullName)
  private genRepoConfigKey(installationId: number, fullName: string): string {
    return `${installationId}/${fullName}`;
  }

}

export interface AppConfigManagerConfig {
  remote: {
    filePath: string;
  };
  configurable: string[];
  private: {
    file?: {
      rootPath: string;
    },
    mysql?: {
      host: string;
      port: number;
      db: string;
      user: string;
      pass: string;
    },
  };
}
