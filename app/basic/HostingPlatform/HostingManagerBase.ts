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
import { Application, Context } from 'egg';
import { HostingPlatformInitEvent } from './event';
import { HostingBase } from './HostingBase';
import { HostingClientBase } from './HostingClientBase';
import { waitUntil } from '../Utils';
import { HostingConfigBase } from './HostingConfigBase';
import { getConfigMeta } from '../../config-generator/decorators';

export abstract class HostingManagerBase<THostingPlatform extends HostingBase<TConfig, TClient, TRawClient>,
  TClient extends HostingClientBase<TConfig, TRawClient>, TRawClient,
  TConfig extends HostingConfigBase> extends AppPluginBase<null> {

  protected type: string;
  private hpMap: Map<number, THostingPlatform>;

  constructor(config: null, app: Application) {
    super(config, app);
    this.hpMap = new Map<number, THostingPlatform>();
  }

  public async onReady(): Promise<void> {
    // After adding a new hosting platform,
    // select a worker to load data and sync to other workers
    this.app.event.subscribeOne(HostingPlatformInitEvent, async e => {
      if (e.type === this.type) {
        await waitUntil(() => this.hpMap.has(e.id));
        const hp = this.hpMap.get(e.id);
        if (hp) hp.syncData();
      }
    });

    this.app.event.subscribeAll(HostingPlatformInitEvent, async e => {
      // platform init, generate new hosting platform
      if (e.type === this.type) {
        const hp = await this.getNewHostingPlatform(e.id, e.config);
        this.hpMap.set(e.id, hp);
      }
    });

    this.app.installation.get(`${this.type}/configs`, async (ctx: Context, next: any) => {
      ctx.body = getConfigMeta(this.getConfigType());
      await next();
    });
  }

  public async onStart(): Promise<void> { }

  public async onClose(): Promise<void> { }

  protected abstract getConfigType(): any;

  protected abstract getNewHostingPlatform(id: number, config: TConfig): Promise<THostingPlatform>;

  public getHostPlatform(id: number): THostingPlatform | undefined {
    return this.hpMap.get(id);
  }

  public async getClient(id: number, name: string): Promise<TClient | undefined> {
    const hp = this.hpMap.get(id);
    if (hp) {
      return hp.getClient(name);
    }
    return undefined;
  }

}
