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

import { AppPluginBase } from '../AppPluginBase';
import { Application } from 'egg';
import { HostingPlatformInitEvent, HostingManagerInitRepoEvent, HostingPlatformConfigInitedEvent } from './event';
import { HostingBase } from './HostingBase';
import { HostingClientBase } from './HostingClientBase';
import { waitUntil } from '../Utils';
import { HostingConfigBase } from './HostingConfigBase';
import { ConfigLoader } from './ConfigLoader';
import { RepoConfigLoadedEvent, RepoAddedEvent, CIRunFinishedEvent } from '../../plugin/event-manager/events';

export abstract class HostingManagerBase<THostingPlatform extends HostingBase<TConfig, TClient, TRawClient>,
  TClient extends HostingClientBase<TRawClient>, TRawClient,
  TConfig extends HostingConfigBase> extends AppPluginBase<null> {

  protected type: string;
  private hpMap: Map<number, THostingPlatform>;
  private configLoader: ConfigLoader;

  constructor(config: null, app: Application) {
    super(config, app);
    this.hpMap = new Map<number, THostingPlatform>();
    this.configLoader = new ConfigLoader(app);
  }

  public async onReady(): Promise<void> {
    this.app.event.subscribeOne(HostingPlatformInitEvent, async e => {
      if (e.type === this.type) {
        await waitUntil(() => this.hpMap.has(e.id));
        const hp = this.hpMap.get(e.id);
        if (!hp) return;
        this.logger.info(`Start to load installed repos for hosting name=${e.config.name}`);
        const repos = await hp.getInstalledRepos();
        this.logger.info(`All installed repos loaded for hosting name=${e.config.name}, count=${repos.length}`);
        repos.forEach(async repo => {
          const fullName = repo.fullName;
          this.app.event.publish('all', HostingManagerInitRepoEvent, {
            id: e.id,
            ...repo,
          });
          await waitUntil(() => (hp as any).clientMap.has(fullName));
          const client = await hp.getClient(fullName);
          if (!client) return;
          const config = await this.configLoader.loadConfig(e.config, e.id, fullName, client);
          this.app.event.publish('all', HostingPlatformConfigInitedEvent, {
            id: e.id,
            fullName,
            config,
          });
          await waitUntil(() => (client as any).config !== undefined);
          this.app.event.publish('all', RepoConfigLoadedEvent, {
            installationId: e.id,
            fullName,
          });
        });
      }
    });

    this.app.event.subscribeOne(RepoAddedEvent, async e => {
      const hp = this.hpMap.get(e.installationId);
      if (!hp) return;
      this.app.event.publish('all', HostingManagerInitRepoEvent, {
        id: e.installationId,
        fullName: e.fullName,
        payload: null,
      });
      await waitUntil(() => (hp as any).clientMap.has(e.fullName));
      const client = await hp.getClient(e.fullName);
      if (!client) return;
      const config = await this.configLoader.loadConfig((hp as any).config, e.installationId, e.fullName, client);
      this.app.event.publish('all', HostingPlatformConfigInitedEvent, {
        id: e.installationId,
        fullName: e.fullName,
        config,
      });
      await waitUntil(() => (client as any).config !== undefined);
      this.app.event.publish('all', RepoConfigLoadedEvent, {
        ...e,
      });
    });

    this.app.event.subscribeAll(HostingPlatformInitEvent, async e => {
      // platform init, generate new hosting platform
      if (e.type === this.type) {
        const hp = await this.getNewHostingPlatform(e.id, e.config);
        this.hpMap.set(e.id, hp);
      }
    });

    this.app.event.subscribeAll(HostingManagerInitRepoEvent, async e => {
      // repo init, create new repo client
      const hp = this.hpMap.get(e.id);
      if (hp) {
        this.logger.info(`Start to add repo for ${hp.getName()}, repo=${e.fullName}`);
        (hp as any).addRepo(e.fullName, e.payload);
      }
    });

    this.app.event.subscribeAll(HostingPlatformConfigInitedEvent, async e => {
      // config init, set config for client
      const hp = this.hpMap.get(e.id);
      if (hp) {
        const client = await hp.getClient(e.fullName);
        if (client) {
          this.logger.info(`Start to update config for ${hp.getName()}, repo=${e.fullName}`);
          (client as any).config = e.config;
        }
      }
    });

    this.app.event.subscribeOne(CIRunFinishedEvent, async e => {
      if (e.client) {
        e.client.createCheckRun(e.ciRunOutput);
      } else {
        this.logger.warn('client is null');
      }
    });
  }

  public async onStart(): Promise<void> { }

  public async onClose(): Promise<void> { }

  protected abstract getNewHostingPlatform(id: number, config: TConfig): Promise<THostingPlatform>;

  public async getClient(id: number, name: string): Promise<TClient | undefined> {
    const hp = this.hpMap.get(id);
    if (hp) {
      return hp.getClient(name);
    }
    return undefined;
  }

}
