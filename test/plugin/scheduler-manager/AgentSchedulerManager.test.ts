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
import { SchedulerAgentScheduleEvent, SchedulerWorkerRegisterEvent, SchedulerWorkerUpdateEvent } from '../../../app/plugin/scheduler-manager/AgentWorkerJobHandler';
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

  describe('register', () => {
    it('should return BasicJobHandler', async () => {
      const result = agent.sched.register('testName', '0', () => { });
      assert(result instanceof BasicJobHandler);
    });
  });

  describe('onReady', () => {
    it('should not send register event if sched exist', async () => {
      app.event.publish('agent', SchedulerWorkerRegisterEvent, { name: 'testName', time: '0' });
      app.event.publish('agent', SchedulerWorkerRegisterEvent, { name: 'testName', time: '0' });
      await waitFor(5);
      assert.strictEqual((agent.sched as any).workerHandlerMap.size, 1);
    });

    it('should exec job when time is up', async () => {
      let counter = 0;
      app.event.subscribeOne(SchedulerAgentScheduleEvent, async () => { counter++; });
      app.event.publish('agent', SchedulerWorkerRegisterEvent, { name: 'testName', time: '0' });
      // wait for agent receive sched event
      await waitFor(5);
      (agent.sched as any).workerHandlerMap.get('testName').invoke();
      // wait for worker receive exec event
      await waitFor(5);
      assert.strictEqual(counter, 1);
    });

    describe('switch branches by update event type', () => {
      let job;
      let whm;

      class MockJob {
        cCounter = 0;
        rCounter = 0;
        cancel() { this.cCounter++; }
        reschedule() { this.rCounter++; }
      }

      beforeEach(() => {
        job = new MockJob();
        whm = (agent.sched as any).workerHandlerMap;
        whm.set('testName', job);
      });

      it('should do nothing if job does not exist', async () => {
        app.event.publish('agent', SchedulerWorkerUpdateEvent, { name: 'testName2', type: 'cancel' });
        await waitFor(5);
        assert.strictEqual(whm.size, 1);
      });

      it('should reschedule job', async () => {
        app.event.publish('agent', SchedulerWorkerUpdateEvent, { name: 'testName', type: 'update', time: '1' });
        await waitFor(5);
        assert.strictEqual(job.rCounter, 1);
      });

      it('should cancel job', async () => {
        app.event.publish('agent', SchedulerWorkerUpdateEvent, { name: 'testName', type: 'cancel' });
        await waitFor(5);
        assert.strictEqual(job.cCounter, 1);
        assert.strictEqual(whm.size, 0);
      });

      it('should switch to default branch', async () => {
        app.event.publish('agent', SchedulerWorkerUpdateEvent, { name: 'testName', type: 'default' } as any);
      });

    });

  });

});
