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

import { ISchedulerJobHandler } from './types';
import { Job, cancelJob } from 'node-schedule';

export class BasicJobHandler implements ISchedulerJobHandler {

  private job: Job;

  constructor(job: Job) {
    this.job = job;
  }

  cancel(): void {
    this.job.cancel();
    cancelJob(this.job);
  }

  reschedule(time: string): void {
    this.job.reschedule(time);
  }

  nextScheduleTime(): Date {
    return this.job.nextInvocation();
  }

}
