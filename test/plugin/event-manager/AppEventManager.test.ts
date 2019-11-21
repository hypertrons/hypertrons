'use strict';

import assert from 'assert';
import { waitFor, prepareTestApplication, testClear } from '../Util';
import { Application, Agent } from 'egg';

describe('AppEventManager', () => {
  let app: Application;
  let agent: Agent;
  let count = 0;

  class TestEvent {
    num: number;
  }

  const func = async (e: TestEvent) => {
    count += e.num;
  };

  const test = async (type: 'worker' | 'workers' | 'agent' | 'all', result: number) => {
    agent.event.publish(type, TestEvent, { num: 1 });
    await waitFor(10);
    assert(count === result);
  };

  beforeEach(async () => {
    ({ app, agent } = await prepareTestApplication());
    count = 0;
    app.event.subscribeAll(TestEvent, func);
    app.event.subscribeOne(TestEvent, func);
    agent.event.subscribe(TestEvent, func);
  });
  afterEach(() => {
    testClear(app, agent);
  });

  describe('publish test', () => {
    it('publish to a random worker', async () => {
      await test('worker', 1);
    });

    it('should publish to all workers', async () => {
      await test('workers', 1);
    });

    it('should publish to the agent', async () => {
      await test('agent', 1);
    });

    it('should publish to all processes', async () => {
      await test('all', 3);
    });
  });

});
