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

import { BotLogger, loggerWrapper, waitUntil, parsePrivateConfigFileName } from '../Utils';
import { HostingClientBase } from './HostingClientBase';
import { HostingConfigBase } from './HostingConfigBase';
import { Application } from 'egg';
import { join } from 'path';
import { ComponentService } from './ComponentService';
import {
  HostingPlatformComponentInitedEvent, HostingPlatformInitRepoEvent,
  HostingPlatformRepoRemovedEvent, HostingPlatformTypes, HostingPlatformRepoAddedEvent,
  HostingPlatformUninstallEvent, HostingPlatformSyncDataEvent, HostingClientSyncDataEvent,
  HostingClientSyncConfigEvent,
} from './event';
import watch from 'node-watch';
import { statSync } from 'fs';
import { ISchedulerJobHandler } from '../../plugin/scheduler-manager/types';
import { RawDataStatus } from './HostingClientService/ConfigService';

export abstract class HostingBase<TConfig extends HostingConfigBase,
                                  TClient extends HostingClientBase<TConfig, TRawClient>,
                                  TRawClient> {

  protected app: Application;
  protected logger: BotLogger;
  protected id: number;
  protected name: string;
  protected hostingType: HostingPlatformTypes;
  protected clientMap: Map<string, () => Promise<TClient>>;
  protected config: TConfig;
  public compService: ComponentService;
  private updateConfigSched: ISchedulerJobHandler;
  private repoConfigStatus: Map<string, RawDataStatus>;

  constructor(hostingType: HostingPlatformTypes, id: number, config: TConfig, app: Application) {
    this.id = id;
    this.config = config;
    this.name = config.name;
    this.hostingType = hostingType;
    this.app = app;
    this.logger = loggerWrapper(app.logger, `[host-${this.name}]`);
    this.clientMap = new Map<string, () => Promise<TClient>>();
    this.compService = new ComponentService(this.name, config.component, app);
    this.repoConfigStatus = new Map<string, RawDataStatus>();
    this.initWebhook(config);
    this.onStart();
  }

  public abstract async getInstalledRepos(): Promise<Array<{fullName: string, payload: any}>>;

  public abstract async addRepo(name: string, payload: any): Promise<void>;

  protected abstract async initWebhook(config: TConfig): Promise<void>;

  public async onStart(): Promise<any> {

    this.app.event.subscribeAll(HostingPlatformInitRepoEvent, async e => {
      if (e.id === this.id) this.addRepo(e.fullName, e.payload);
    });

    // Only one worker do load data and then sync data to others.
    this.app.event.subscribeOne(HostingPlatformSyncDataEvent, async e => {
      if (e.id === this.id) this.syncData();
    });

    // All worker update local components
    this.app.event.subscribeAll(HostingPlatformComponentInitedEvent, async e => {
      if (e.id === this.id) this.compService.setComponents(e.components);
    });

    // one worker load client data and then sync to other workers
    this.app.event.subscribeOne(HostingPlatformRepoAddedEvent, async e => {
      if (e.id !== this.id) return;
      await waitUntil(() => this.clientMap.has(e.fullName), { interval: 500 });
      const client = await this.getClient(e.fullName);
      if (client) {
        await waitUntil(() => client.getStarted(), { interval: 500 });
        this.app.event.publish('worker', HostingClientSyncDataEvent, {
          installationId: this.id,
          fullName: e.fullName,
        });
      } else {
        this.logger.error(`Add client error, client ${e.fullName} is undefined!`);
      }
    });
    // all worker add repo
    this.app.event.subscribeAll(HostingPlatformRepoAddedEvent, async e => {
      if (e.id !== this.id) return;
      await waitUntil(() => this.compService.getComponentLoaded(), { interval: 500 });
      this.addRepo(e.fullName, e.payload);
    });

    this.app.event.subscribeAll(HostingPlatformRepoRemovedEvent, async e => {
      if (e.id !== this.id) return;
      const client = await this.getClient(e.fullName);
      if (client) {
        await client.onDispose();
        this.clientMap.delete(e.fullName);
      }
    });
    this.app.event.subscribeAll(HostingPlatformUninstallEvent, async e => {
      if (e.id !== this.id || !e.owner) return;
      this.clientMap.forEach(async (_, fullName) => {
        const client = await this.getClient(fullName);
        if (client && client.getOwner() === e.owner) {
          await client.onDispose();
          this.clientMap.delete(fullName);
        }
      });
    });

    // init private-file config watcher
    if (this.config.config.private.file) {
      this.logger.info('Start to watch file config');
      const options = { recursive: true, filter: /\.json$/ };
      watch(this.config.config.private.file.rootPath, options, async (event, file) => {
        if (event === 'update') {
          const basePathInfo = statSync(file);
          if (!basePathInfo.isDirectory()) { // Only concern about file changed
            const fullName = parsePrivateConfigFileName(file);
            this.updateConfigStatus(fullName, { config: { file: 'updated' } } as any);
          }
        } else if (event === 'remove') {
          const fullName = parsePrivateConfigFileName(file);
          this.updateConfigStatus(fullName, { config: { file: 'deleted' } } as any);
        }
      });
    }
  }

  // Only one worker call this function
  private async syncData(): Promise<void> {
    // load and sync components
    this.logger.info('Start to load components');
    const components = await this.compService.loadComponents();
    if (this.compService.getComponentLoaded()) {
      this.app.event.publish('all', HostingPlatformComponentInitedEvent, {
        id: this.id,
        components,
      });
    } else {
      this.logger.error('Sync hosting base components data error!');
      return;
    }

    // Load and sync repos
    this.logger.info('Start to load and sync repos');
    const repos = await this.getInstalledRepos();
    this.logger.info(`All installed repos loaded for hosting name=${this.name}, count=${repos.length}`);
    repos.forEach(async repo => {
      const fullName = repo.fullName;
      // All worker init repo
      this.app.event.publish('all', HostingPlatformInitRepoEvent, {
        id: this.id,
        fullName,
        ...repo,
      });
      // Only one worker load data and sync to others
      await waitUntil(() => this.clientMap.has(fullName), { interval: 500 });
      const client = await this.getClient(fullName);
      if (client) {
        // Make sure that the client has listened to the event
        await waitUntil(() => client.getStarted(), { interval: 500 });
        this.app.event.publish('worker', HostingClientSyncDataEvent, {
          installationId: this.id,
          fullName,
        });
      } else {
        this.logger.error(`Add client error, client ${fullName} is undefined!`);
      }
    });

    // start update config schedule
    this.logger.info(`Start to update config schedule ${this.config.config.updateInterval}`);
    this.updateConfigSched = this.app.sched.register(
      `${this.id}_sync_config`,
      this.config.config.updateInterval,
      'worker',
      () => {
        this.repoConfigStatus.forEach((status, fullName) => {
          this.repoConfigStatus.delete(fullName);
          this.app.event.publish('worker', HostingClientSyncConfigEvent, {
            installationId: this.id,
            fullName,
            status,
          });
        });
      },
    );
  }

  public async onDispose(): Promise<void> {
    if (this.updateConfigSched !== undefined) {
      this.updateConfigSched.cancel();
    }
    this.clientMap.forEach(async(_, fullName) => {
      const client = await this.getClient(fullName);
      if (client) client.onDispose();
    });
  }

  public async getClient(name: string): Promise<TClient | undefined> {
    const gen = this.clientMap.get(name);
    if (gen) {
      return await gen();
    }
    return undefined;
  }

  public getName(): string {
    return this.name;
  }

  public getConfig(): TConfig {
    return this.config;
  }

  public getRepoConfigStatus(): Map<string, RawDataStatus> {
    return this.repoConfigStatus;
  }

  public updateConfigStatus(fullName: string, changedStatus: RawDataStatus) {
    let status: RawDataStatus | undefined = this.repoConfigStatus.get(fullName);
    if (status === undefined) {
      status = {
        config: { file: 'clear', mysql: 'clear', remote: 'clear' },
        luaScript: { remote: 'clear' },
      };
    }
    if (changedStatus.config) {
      Object.keys(changedStatus.config).forEach(key => {
        if (status && changedStatus.config[key] !== undefined) {
          status.config[key] = changedStatus.config[key];
        }
      });
    }
    if (changedStatus.luaScript) {
      Object.keys(changedStatus.luaScript).forEach(key => {
        if (status && changedStatus.luaScript[key] !== undefined) {
          status.luaScript[key] = changedStatus.luaScript[key];
        }
      });
    }
    this.repoConfigStatus.set(fullName, status);
  }

  protected post(path: string, middleware: any): string {
    const p = join(this.id.toString(), path);
    this.app.installation.post(p, middleware);
    return join('installation', p);
  }

}
