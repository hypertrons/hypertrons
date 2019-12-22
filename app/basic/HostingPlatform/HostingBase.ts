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

import { BotLogger, loggerWrapper, waitUntil } from '../Utils';
import { HostingClientBase } from './HostingClientBase';
import { HostingConfigBase } from './HostingConfigBase';
import { Application } from 'egg';
import { join } from 'path';
import { ComponentService } from './ComponentService';
import { HostingPlatformComponentInitedEvent, HostingPlatformInitRepoEvent } from './event';
import { RepoAddedEvent } from '../../plugin/event-manager/events';

export abstract class HostingBase<TConfig extends HostingConfigBase, TClient extends HostingClientBase<TConfig, TRawClient>, TRawClient> {

  protected app: Application;
  protected logger: BotLogger;
  protected id: number;
  protected name: string;
  protected clientMap: Map<string, () => Promise<TClient>>;
  protected config: TConfig;
  public compService: ComponentService;

  constructor(id: number, config: TConfig, app: Application) {
    this.id = id;
    this.config = config;
    this.name = config.name;
    this.app = app;
    this.logger = loggerWrapper(app.logger, `[host-${this.id}-${this.name}]`);
    this.clientMap = new Map<string, () => Promise<TClient>>();
    this.compService = new ComponentService(id, config.component, app);
    this.initWebhook(config);
    this.onStart();
  }

  public abstract async getInstalledRepos(): Promise<Array<{fullName: string, payload: any}>>;

  public abstract async addRepo(name: string, payload: any): Promise<void>;

  protected abstract async initWebhook(config: TConfig): Promise<void>;

  public async onStart(): Promise<any> {
    this.app.event.subscribeAll(HostingPlatformComponentInitedEvent, async e => {
      if (e.id === this.id) this.compService.setComponents(e.components);
    });
    // one worker load client data and then sync to other workers
    this.app.event.subscribeOne(RepoAddedEvent, async e => {
      if (e.installationId === this.id) {
        await waitUntil(() => this.clientMap.has(e.fullName));
        const client = await this.getClient(e.fullName);
        if (client) client.syncData();
      }
    });
    // all worker add repo
    this.app.event.subscribeAll(RepoAddedEvent, async e => {
      if (e.installationId === this.id) {
        await waitUntil(() => this.compService.getComponentLoaded());
        this.addRepo(e.fullName, e.payload);
      }
    });
    this.app.event.subscribeAll(HostingPlatformInitRepoEvent, async e => {
      if (e.id === this.id) this.addRepo(e.fullName, e.payload);
    });

  }

  // Only one worker call this function
  public async syncData(): Promise<void> {
    // load and sync components
    const components = await this.compService.loadComponents();
    if (components) {
      this.app.event.publish('all', HostingPlatformComponentInitedEvent, {
        id: this.id,
        components,
      });
    } else {
      this.logger.error('Sync hosting base components data error!');
    }

    await waitUntil(() => this.compService.getComponentLoaded());

    // Load and sync repos
    const repos = await this.getInstalledRepos();
    this.logger.info(
      `All installed repos loaded for hosting name=${this.name}, count=${repos.length}`,
    );
    repos.forEach(async repo => {
      const fullName = repo.fullName;
      // All worker init repo
      this.app.event.publish('all', HostingPlatformInitRepoEvent, {
        id: this.id,
        ...repo,
      });
      // Only one client load data and sync to other workers.
      await waitUntil(() => this.clientMap.has(fullName));
      const clientBase = await this.getClient(fullName);
      if (!clientBase) {
        this.logger.error('Add client error, client is undefined!');
        return;
      }
      clientBase.syncData();
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

  protected post(path: string, middleware: any): string {
    const p = join(this.id.toString(), path);
    this.app.installation.post(p, middleware);
    return join('installation', p);
  }

}
