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

import { HostingClientBase } from '../HostingClientBase';
import { HostingConfigBase } from '../HostingConfigBase';
import { Application } from 'egg';
import { ClientServiceBase } from './ClientServiceBase';

export class EventManager<TConfig extends HostingConfigBase, TRawClient> extends ClientServiceBase<TConfig, TRawClient> {

  constructor(app: Application, client: HostingClientBase<TConfig, TRawClient>) {
    super(app, client, 'event');
  }

  public async onStart(): Promise<any> { }

  public async onDispose(): Promise<any> { }

  public async onConfigLoaded(): Promise<any> { }

  public async syncData(): Promise<any> { }

  public subscribeOne<T>(constructor: new (...args: any) => T, func: (event: T) => Promise<void>): void {
    this.app.event.subscribeOne(constructor, async (e: any) => {
      if (e.installationId !== this.client.getHostId() || e.fullName !== this.client.getFullName()) return;
      func(e);
    });
  }

  public subscribeAll<T>(constructor: new (...args: any) => T, func: (event: T) => Promise<void>): void {
    this.app.event.subscribeAll(constructor, async (e: any) => {
      if (e.installationId !== this.client.getHostId() || e.fullName !== this.client.getFullName()) return;
      func(e);
    });
  }

  public publish<T>(type: 'worker' | 'workers' | 'agent' | 'all',
                    constructor: new (...args: any) => T, param: Partial<T>): void {
    this.app.event.publish(type, constructor, param);
  }

}
