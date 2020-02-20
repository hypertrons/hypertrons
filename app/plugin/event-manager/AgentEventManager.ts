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

import { Agent } from 'egg';
import { getClassName, IPC_EVENT_NAME, IpcEventType } from './Helper';
import { EventHandlerMap } from './EventHandlerMap';
import { AgentPluginBase } from '../../basic/AgentPluginBase';

export class AgentEventManager extends AgentPluginBase<null> {

  private handlerMap: EventHandlerMap;

  constructor(config: null, agent: Agent) {
    super(config, agent);
    this.handlerMap = new EventHandlerMap();
    this.agent.messenger.on(IPC_EVENT_NAME, (e: IpcEventType) => {
      this.consume(e.className, e.type, e.payload, e.from);
    });
  }

  public async onReady(): Promise<void> { }

  public async onStart(): Promise<void> { }

  public async onClose(): Promise<void> { }

  public subscribe<T>(constructor: new (...args: any) => T, func: EventHandler<T>): void {
    const className = getClassName(constructor);
    this.handlerMap.add(className, func);
  }

  public publish<T>(type: 'worker' | 'workers' | 'agent' | 'all', constructor: new (...args: any) => T, param: Partial<T>): void {
    const className = getClassName(constructor);
    const p: IpcEventType = {
      type,
      className,
      payload: param,
      from: 'agent',
    };
    switch (type) {
      case 'worker':
        this.agent.messenger.sendRandom(IPC_EVENT_NAME, p);
        break;
      case 'workers':
        this.agent.messenger.sendToApp(IPC_EVENT_NAME, p);
        break;
      case 'all':
        this.agent.messenger.sendToApp(IPC_EVENT_NAME, p);
        this.consume(className, type, param, 'agent');
        // need to create a new param here because IPC send may async and may affect former event
        this.agent.messenger.sendRandom(IPC_EVENT_NAME, {
          ...p,
          type: 'worker',
        });
        break;
      case 'agent':
        this.consume(className, type, param, 'agent');
        break;
      default:
        break;
    }
  }

  private async consume<T>(className: string, type: 'worker' | 'workers' | 'agent' | 'all', param: T, from: 'worker' | 'agent'): Promise<void> {
    switch (type) {
      case 'agent':
      case 'all':
        try {
          await this.handlerMap.exec(className, param);
        } catch (e) {
          this.logger.error(`Error processing handlers, className=${className}, e=`, e);
        }
        break;
      case 'worker':
        if (from === 'worker') {
          // if worker from app, means need to send to a random worker
          this.agent.messenger.sendRandom(IPC_EVENT_NAME, {
            className,
            type,
            payload: param,
            from: 'agent',
          });
        }
        break;
      default:
        break;
    }
  }

}

type EventHandler<T> = (event: T) => Promise<void>;
