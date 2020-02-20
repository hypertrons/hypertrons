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

import { Application } from 'egg';
import { getClassName, IPC_EVENT_NAME, IpcEventType } from './Helper';
import { EventHandlerMap } from './EventHandlerMap';
import { AppPluginBase } from '../../basic/AppPluginBase';

export class AppEventManager extends AppPluginBase<null> {

  private oneHandlerMap: EventHandlerMap;
  private allHandlerMap: EventHandlerMap;

  constructor(config: null, app: Application) {
    super(config, app);
    this.oneHandlerMap = new EventHandlerMap();
    this.allHandlerMap = new EventHandlerMap();
    this.app.messenger.on(IPC_EVENT_NAME, (e: IpcEventType) => {
      this.consume(e.className, e.type, e.payload);
    });
  }

  public async onReady(): Promise<void> { }

  public async onStart(): Promise<void> { }

  public async onClose(): Promise<void> { }

  public subscribeOne<T>(constructor: new (...args: any) => T, func: EventHandler<T>): void {
    const className = getClassName(constructor);
    this.oneHandlerMap.add(className, func);
  }

  public unsubscribeOne<T>(constructor: new (...args: any) => T, func: EventHandler<T>): void {
    const className = getClassName(constructor);
    this.oneHandlerMap.remove(className, func);
  }

  public subscribeAll<T>(constructor: new (...args: any) => T, func: EventHandler<T>): void {
    const className = getClassName(constructor);
    this.allHandlerMap.add(className, func);
  }

  public publish<T>(type: 'worker' | 'workers' | 'agent' | 'all', constructor: new (...args: any) => T, param: Partial<T>): void {
    const p: IpcEventType = {
      type,
      className: getClassName(constructor),
      payload: param,
      from: 'worker',
    };
    switch (type) {
      case 'worker':
        // if worker, send random to avoid self consume
        this.app.messenger.sendToAgent(IPC_EVENT_NAME, p);
        break;
      case 'workers':
        // if workers, send to all workers
        this.app.messenger.sendToApp(IPC_EVENT_NAME, p);
        break;
      case 'agent':
        // if agent, send to agent
        this.app.messenger.sendToAgent(IPC_EVENT_NAME, p);
        break;
      case 'all':
        // broadcast will send to agent and all workers
        this.app.messenger.broadcast(IPC_EVENT_NAME, p);
        // send to a random worker
        // need to create a new param here because IPC send may async and may affect former event
        this.app.messenger.sendToAgent(IPC_EVENT_NAME, {
          ...p,
          type: 'worker',
        });
        break;
      default: break;
    }
  }

  private async consume<T>(className: string, type: 'worker' | 'workers' | 'agent' | 'all', param: T): Promise<void> {
    const p = param as any;
    // if is a repo event, attach client automatically
    if (Number.isInteger(p.installationId) && p.fullName) {
      const client = await this.app.installation.getClient(p.installationId, p.fullName);
      if (client) client.eventService.consume(className, type, p);
    } else {
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
  }

}

type EventHandler<T> = (event: T) => Promise<void>;
