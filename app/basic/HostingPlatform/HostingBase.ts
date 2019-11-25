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

import { BotLogger, loggerWrapper } from '../Utils';
import { HostingClientBase } from './HostingClientBase';
import { HostingConfigBase } from './HostingConfigBase';
import { Application } from 'egg';

export abstract class HostingBase<TConfig extends HostingConfigBase, TClient extends HostingClientBase<TRawClient>, TRawClient> {

  protected id: number;
  protected name: string;
  protected clientMap: Map<string, () => Promise<TClient>>;
  protected config: TConfig;
  protected logger: BotLogger;
  protected app: Application;

  constructor(id: number, config: TConfig, app: Application) {
    this.id = id;
    this.config = config;
    this.name = config.name;
    this.app = app;
    this.logger = loggerWrapper(app.logger, `[host-${this.id}-${this.name}]`);
    this.clientMap = new Map<string, () => Promise<TClient>>();
    this.initWebhook(config);
  }

  public abstract async getInstalledRepos(): Promise<Array<{fullName: string, payload: any}>>;

  protected abstract async addRepo(name: string, payload: any): Promise<void>;

  protected abstract async initWebhook(config: TConfig): Promise<void>;

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

}
