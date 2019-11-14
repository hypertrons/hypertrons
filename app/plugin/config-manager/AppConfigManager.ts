// import { Application, IConfigManager, MgrBotAppPluginBase, Types } from '@mgrbot/core';
import { readFileSync } from 'fs';
import { ConfigManagerInternalConfigLoadedEvent, ConfigManagerInternalReLoadConfigEvent } from './events';
import { ConfigManagerConfigLoadedEvent } from '../event-manager/events';

import { Application } from 'egg';
import { AppPluginBase } from '../../basic/AppPluginBase';

export class AppConfigManager extends AppPluginBase<AppConfigManagerConfig> {

  private configMap: Map<string, any>;

  constructor(config: AppConfigManagerConfig, app: Application) {
    super(config, app);
    this.configMap = new Map<string, any>();
  }

  public async onReady() {

    // reload config
    this.app.event.subscribeAll(ConfigManagerInternalReLoadConfigEvent, async event => {

      const config = await this.loadConfig(event.installationId, event.fullName);

      const newEvent = {
        installationId: event.installationId,
        fullName: event.fullName,
        config,
      };
      this.app.event.publish('workers', ConfigManagerInternalConfigLoadedEvent, newEvent);
      this.app.event.publish('all', ConfigManagerConfigLoadedEvent, newEvent);

    });

    // config loaded
    this.app.event.subscribeAll(ConfigManagerInternalConfigLoadedEvent, async event => {
      this.configMap.set(this.genRepoConfigKey(event.installationId, event.fullName), event.config);
    });

  }

  public async onStart() { }

  public async onClose() { }

  public async getConfig(installationId: number, fullName: string): Promise<any> {
    return this.configMap.get(this.genRepoConfigKey(installationId, fullName));
  }

  private async loadConfig(installationId: number, fullName: string): Promise<any> {
    const baseConfig = this.app.config;
    let privateConfig = {};

    // load private config
    if (this.config.private.file) {
      privateConfig = readFileSync(this.genRepoConfigFilePath(installationId, fullName)).toJSON();
    } else if (this.config.private.mysql) {
      // TODO: load from mysql
    }

    // load remote config
    const fileContent = await this.getFileContent(this.config.remote.filePath);
    const remoteConfig = JSON.parse(fileContent);

    return Object.assign(baseConfig, privateConfig, remoteConfig);
  }

  private genRepoConfigFilePath(installationId: number, fullName: string): string {
    return `${installationId}_${fullName}.json`;
  }

  private genRepoConfigKey(installationId: number, fullName: string): string {
    return `${installationId}/${fullName}`;
  }

  // just for test
  private async getFileContent(filePath: string): Promise<any> {
    console.log(filePath);
  }
}

interface AppConfigManagerConfig {
  remote: {
    filePath: string;
  };
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
