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
import { Application, Agent } from 'egg';
import { prepareTestApplication, testClear, waitFor } from '../../Util';
import { AgentWorkerJobHandler, SchedulerAgentScheduleEvent } from '../../../app/plugin/scheduler-manager/AgentWorkerJobHandler';
import { BasicJobHandler } from '../../../app/plugin/scheduler-manager/BasicJobHandler';

describe('AppSchedulerManager', () => {

  let app: Application;
  let agent: Agent;

  beforeEach(async () => {
    ({ app, agent } = await prepareTestApplication());
  });
  afterEach(() => {
    testClear(app, agent);
  });

  class MockJob {
    iCounter = 0;
    invoke() { this.iCounter++; }
  }

  describe('register', () => {
    it('should return AgentWorkerJobHandler', async () => {
      const result = app.sched.register('testName', '0', 'worker', () => { });
      assert(result instanceof AgentWorkerJobHandler);
    });

    it('should return BasicJobHandler', async () => {
      const result = app.sched.register('testName', '0', 'workers', () => { });
      assert(result instanceof BasicJobHandler);
    });

    it('should throw Error', async () => {
      let result;
      assert.throws(() => {
        result = (app.sched as any).register('testName', '0', 'agent', () => { });
      }, new Error('Not supported type agent.'));
      assert.deepStrictEqual(result, undefined);
    });
  });

  describe('scheduleAgentJob', () => {
    it('should invoke job when handlerMap contains name', async () => {
      const job = new MockJob() as any;
      // doesn't invoke
      (app.sched as any).scheduleAgentJob('testName');
      assert.deepStrictEqual(job.iCounter, 0);
      // invoke
      (app.sched as any).handlerMap.set('testName', job);
      (app.sched as any).scheduleAgentJob('testName');
      assert.deepStrictEqual(job.iCounter, 1);
    });
  });

  describe('onReady', () => {
    it('should call this.scheduleAgentJob', async () => {
      let counter = 0;
      (app.sched as any).scheduleAgentJob = (() => { counter++; });
      agent.event.publish('worker', SchedulerAgentScheduleEvent, { name: 'testName' });
      await waitFor(5);
      assert.strictEqual(counter, 1);
    });
  });

});
