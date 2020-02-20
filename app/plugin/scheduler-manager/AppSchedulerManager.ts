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
import { scheduleJob } from 'node-schedule';
import { BasicJobHandler } from './BasicJobHandler';
import { SchedulerAgentScheduleEvent, AgentWorkerJobHandler } from './AgentWorkerJobHandler';
import { AppPluginBase } from '../../basic/AppPluginBase';
import { ISchedulerJobCallback, ISchedulerJobHandler } from './types';

export class AppSchedulerManager extends AppPluginBase<null> {

  private handlerMap: Map<string, AgentWorkerJobHandler>;

  constructor(config: null, app: Application) {
    super(config, app);
    this.handlerMap = new Map<string, AgentWorkerJobHandler>();
  }

  public async onReady(): Promise<void> {
    this.app.event.subscribeOne(SchedulerAgentScheduleEvent, async e => {
      this.scheduleAgentJob(e.name);
    });
  }

  public async onStart(): Promise<void> { }

  public async onClose(): Promise<void> { }

  public register(name: string, time: string, type: 'worker' | 'workers', func: ISchedulerJobCallback): ISchedulerJobHandler {
    switch (type) {
      case 'worker':
        // register on agent
        const awj = new AgentWorkerJobHandler(this.app, name, time, func);
        this.handlerMap.set(name, awj);
        return awj;
      case 'workers':
        // register on self
        const j = scheduleJob(name, time, func);
        return new BasicJobHandler(j);
      default:
        throw new Error(`Not supported type ${type}.`);
    }
  }

  private async scheduleAgentJob(name: string) {
    const job = this.handlerMap.get(name);
    if (job) {
      job.invoke();
    }
  }

}
