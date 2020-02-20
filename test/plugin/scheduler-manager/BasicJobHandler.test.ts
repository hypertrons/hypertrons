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

'use strict';

import assert from 'assert';
// import * as Utils from '../../../app/basic/Utils';
import { BasicJobHandler } from '../../../app/plugin/scheduler-manager/BasicJobHandler';

describe('BasicJobHandler', () => {

  class MockJob {
    cCounter = 0;
    rCounter = 0;
    nCounter = 0;
    cancel() { this.cCounter++; }
    reschedule() { this.rCounter++; }
    nextInvocation() { this.nCounter++; }
  }
  const job = new MockJob() as any;
  const jobHandler = new BasicJobHandler(job);

  it('constructor() should set jobHandler.job', async () => {
    assert.deepStrictEqual((jobHandler as any).job, job);
  });

  it('cancel() should call job.cancel()', async () => {
    jobHandler.cancel();
    assert.deepStrictEqual(job.cCounter, 1);
  });

  it('reschedule() should call job.reschedule()', async () => {
    jobHandler.reschedule('time');
    assert.deepStrictEqual(job.rCounter, 1);
  });

  it('nextScheduleTime() should call job.nextInvocation()', async () => {
    jobHandler.nextScheduleTime();
    assert.deepStrictEqual(job.nCounter, 1);
  });

});
