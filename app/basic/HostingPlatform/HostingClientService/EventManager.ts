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

import { HostingClientBase } from '../HostingClientBase';
import { HostingConfigBase } from '../HostingConfigBase';
import { Application } from 'egg';
import { ClientServiceBase } from './ClientServiceBase';
import { RepoEventBase } from '../../../plugin/event-manager/events';
import { EventHandlerMap } from '../../../plugin/event-manager/EventHandlerMap';
import { getClassName } from '../../../plugin/event-manager/Helper';

export class EventManager<TConfig extends HostingConfigBase, TRawClient> extends ClientServiceBase<TConfig, TRawClient> {

  private oneHandlerMap: EventHandlerMap;
  private allHandlerMap: EventHandlerMap;

  constructor(app: Application, client: HostingClientBase<TConfig, TRawClient>) {
    super(app, client, 'eventService');
    this.oneHandlerMap = new EventHandlerMap();
    this.allHandlerMap = new EventHandlerMap();
  }

  public async onStart(): Promise<any> { }

  public async onDispose(): Promise<any> { }

  public async onConfigLoaded(): Promise<any> { }

  public async syncData(): Promise<any> { }

  public subscribeOne<T extends RepoEventBase>(constructor: new (...args: any) => T, func: EventHandler<T>): void {
    const className = getClassName(constructor);
    this.oneHandlerMap.add(className, func);
  }

  public unsubscribeOne<T extends RepoEventBase>(constructor: new (...args: any) => T, func: EventHandler<T>): void {
    const className = getClassName(constructor);
    this.oneHandlerMap.remove(className, func);
  }

  public subscribeAll<T extends RepoEventBase>(constructor: new (...args: any) => T, func: EventHandler<T>): void {
    const className = getClassName(constructor);
    this.allHandlerMap.add(className, func);
  }

  public async consume<T extends RepoEventBase>(className: string, type: 'worker' | 'workers' | 'agent' | 'all', param: T): Promise<void> {
    switch (type) {
      case 'worker':
        try {
          await this.oneHandlerMap.exec(className, param);
        } catch (e) {
          this.logger.error(`Error processing handlers, className=${className}, e=`, e);
        }
        break;
      case 'workers':
      case 'all':
        try {
          await this.allHandlerMap.exec(className, param);
        } catch (e) {
          this.logger.error(`Error processing handlers, className=${className}, e=`, e);
        }
        break;
      case 'agent':
        this.logger.error(`Worker recieve agent event. className=${className}`);
        break;
      default:
        break;
    }
  }

  public publish<T>(type: 'worker' | 'workers' | 'agent' | 'all',
                    constructor: new (...args: any) => T, param: Partial<T>): void {
    this.app.event.publish(type, constructor, param);
  }

}

type EventHandler<T> = (event: T) => Promise<void>;
