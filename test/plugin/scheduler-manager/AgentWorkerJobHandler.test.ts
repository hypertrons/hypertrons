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

'use strict';

import assert from 'assert';
import { prepareTestApplication, testClear, waitFor } from '../../Util';
import { Application, Agent } from 'egg';
import { AgentWorkerJobHandler, SchedulerWorkerRegisterEvent, SchedulerWorkerUpdateEvent } from '../../../app/plugin/scheduler-manager/AgentWorkerJobHandler';

describe('AgentWorkerJobHandler', () => {
  let app: Application;
  let agent: Agent;

  beforeEach(async () => {
    ({ app, agent } = await prepareTestApplication());
  });
  afterEach(() => {
    testClear(app, agent);
  });

  describe('constructor', () => {
    it('should throw error when the name already exist', async () => {
      const map = new Map();
      let jobHandler1, jobHandler2;
      jobHandler1 = new AgentWorkerJobHandler(app, 'testName', 'testTime', () => {}, map);
      assert.throws(() => { jobHandler2 = new AgentWorkerJobHandler(app, 'testName', 'testTime', () => {}, map); }, new Error('Already have a job named in testName'),
        );
      assert.notDeepEqual(jobHandler1, undefined);
      assert.deepStrictEqual(jobHandler2, undefined);
    });

    it('should set curMap successfully', async () => {
      const map = new Map();
      const jobHandler = new AgentWorkerJobHandler(app, 'testName', 'testTime', () => {}, map);
      assert.deepStrictEqual(map.get('testName'), jobHandler);
    });

    it('should register', async () => {
      let innerName = '';
      agent.event.subscribe(SchedulerWorkerRegisterEvent, async e => { innerName = e.name; });
      const jobHandler = new AgentWorkerJobHandler(app, 'testName', 'testTime', () => {}, new Map());
      await waitFor(5);
      assert.deepStrictEqual(innerName, 'testName');
      assert.notDeepStrictEqual(jobHandler, undefined);
    });
  });

  describe('cancel', () => {
    it('should cancel', async () => {
      let innerName = '';
      agent.event.subscribe(SchedulerWorkerUpdateEvent, async e => { innerName = e.name; });
      new AgentWorkerJobHandler(app, 'testName', 'testTime', () => {}, new Map()).cancel();
      await waitFor(5);
      assert.deepStrictEqual(innerName, 'testName');
    });
  });

  describe('reschedule', () => {
    it('should reschedule', async () => {
      let innerName = '';
      agent.event.subscribe(SchedulerWorkerUpdateEvent, async e => { innerName = e.name; });
      new AgentWorkerJobHandler(app, 'testName', '0', () => {}, new Map()).reschedule('newTime');
      await waitFor(5);
      assert.deepStrictEqual(innerName, 'testName');
    });
  });

  describe('nextScheduleTime', () => {
    it('should execute job.nextInvocation()', async () => {
      let counter = 0;
      const jobHandler = new AgentWorkerJobHandler(app, 'testName', '0', () => {}, new Map());
      (jobHandler as any).job.nextInvocation = () => { counter++; };
      jobHandler.nextScheduleTime();
      assert.deepStrictEqual(counter, 1);
    });
  });

  describe('invoke', () => {
    it('should invoke', async () => {
      let counter = 0;
      new AgentWorkerJobHandler(app, 'testName', '0', () => { counter++; }, new Map()).invoke();
      assert.deepStrictEqual(counter, 1);
    });
  });

});
