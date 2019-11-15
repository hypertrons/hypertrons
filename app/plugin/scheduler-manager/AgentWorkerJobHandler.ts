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

import { Application } from 'egg';
import { Job, scheduleJob } from 'node-schedule';
import { ISchedulerJobHandler, ISchedulerJobCallback } from './types';

export class AgentWorkerJobHandler implements ISchedulerJobHandler {

  private app: Application;
  private name: string;
  public innerName: string;
  private time: string;
  private func: ISchedulerJobCallback;
  private job: Job;

  constructor(app: Application, name: string, time: string, func: ISchedulerJobCallback, curMap: Map<string, AgentWorkerJobHandler>) {
    this.app = app;
    this.name = name;
    this.time = time;
    this.func = func;
    this.job = scheduleJob(name, time, () => { });

    do {
      this.genInnerName();
    } while (!curMap.has(this.innerName));
    curMap.set(this.innerName, this);

    this.app.event.publish('agent', SchedulerWorkerRegisterEvent, {
      name: this.innerName,
      time: this.time,
    });
  }

  public cancle(): void {
    this.app.event.publish('agent', SchedulerWorkerUpdateEvent, {
      name: this.innerName,
      type: 'cancle',
    });
  }

  public reschedule(time: string): void {
    this.time = time;
    this.job.reschedule(time);
    this.app.event.publish('agent', SchedulerWorkerUpdateEvent, {
      name: this.innerName,
      type: 'update',
      time: this.time,
    });
  }

  public nextScheduleTime(): Date {
    return this.job.nextInvocation();
  }

  public invoke(): void {
    this.func(new Date());
  }

  private genInnerName() {
    this.innerName = `${this.name}_${Math.random()}`;
  }

}

export class SchedulerWorkerRegisterEvent {
  public name: string;
  public time: string;
}

export class SchedulerAgentScheduleEvent {
  public name: string;
}

export class SchedulerWorkerUpdateEvent {
  public name: string;
  public type: 'update' | 'cancle';
  public time?: string;
}
