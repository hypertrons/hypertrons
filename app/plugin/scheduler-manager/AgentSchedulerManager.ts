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
import { scheduleJob, Job, cancelJob } from 'node-schedule';
import { BasicJobHandler } from './BasicJobHandler';
import { SchedulerWorkerRegisterEvent, SchedulerWorkerUpdateEvent, SchedulerAgentScheduleEvent } from './AgentWorkerJobHandler';
import { AgentPluginBase } from '../../basic/AgentPluginBase';
import { ISchedulerJobCallback, ISchedulerJobHandler } from './types';

export class AgentSchedulerManager extends AgentPluginBase<null> {

  private workerHandlerMap: Map<string, Job>;

  constructor(config: null, agent: Agent) {
    super(config, agent);
    this.workerHandlerMap = new Map<string, Job>();
  }

  public async onReady(): Promise<void> {
    this.agent.event.subscribe(SchedulerWorkerRegisterEvent, async e => {
      if (this.workerHandlerMap.has(e.name)) return;
      const job = scheduleJob(e.name, e.time, () => {
        this.agent.event.publish('worker', SchedulerAgentScheduleEvent, {
          name: e.name,
        });
      });
      this.workerHandlerMap.set(e.name, job);
    });

    this.agent.event.subscribe(SchedulerWorkerUpdateEvent, async e => {
      const job = this.workerHandlerMap.get(e.name);
      if (!job) return;
      switch (e.type) {
        case 'cancel':
          this.workerHandlerMap.delete(e.name);
          job.cancel();
          cancelJob(job);
          break;
        case 'update':
          if (e.time) {
            job.reschedule(e.time);
          }
          break;
        default:
          break;
      }
    });
  }

  public async onStart(): Promise<void> { }

  public async onClose(): Promise<void> { }

  register(name: string, time: string, func: ISchedulerJobCallback): ISchedulerJobHandler {
    const schedJob = scheduleJob(name, time, func);
    const job = new BasicJobHandler(schedJob);
    return job;
  }

}
