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

import { HostingConfigBase } from '../HostingConfigBase';
import { HostingClientBase } from '../HostingClientBase';
import { Application } from 'egg';
import { BotLogger, loggerWrapper } from '../../Utils';

export abstract class ClientServiceBase <TConfig extends HostingConfigBase, TRawClient> {

  protected app: Application;
  protected logger: BotLogger;
  protected client: HostingClientBase<TConfig, TRawClient>;

  constructor(app: Application, client: HostingClientBase<TConfig, TRawClient>, serviceName: string) {
    this.app = app;
    this.client = client;
    this.logger = loggerWrapper(app.logger,
      `[client-${client.getHostingBase().getName()}-${client.getFullName()}-${serviceName}]`);
  }

  public abstract async onStart(): Promise<any>;

  public abstract async onDispose(): Promise<any>;

  public abstract async onConfigLoaded(): Promise<any>;

  public abstract async syncData(): Promise<any>;

}
