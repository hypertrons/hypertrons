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

export class EventManager<TConfig extends HostingConfigBase, TRawClient> {

  private client: HostingClientBase<TConfig, TRawClient>;
  private app: Application;

  constructor(app: Application, client: HostingClientBase<TConfig, TRawClient>) {
    this.app = app;
    this.client = client;
  }

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
