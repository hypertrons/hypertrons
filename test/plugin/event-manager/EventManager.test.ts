// tslint:disable: no-bitwise
'use strict';

import assert from 'assert';
import { waitFor, prepareTestApplication, testClear } from '../Util';
import { Application, Agent } from 'egg';

describe('EventManager', () => {
  let app: Application;
  let agent: Agent;
  let count = 0;
  type consumeType = 'unicast' | 'broadcast' | 'agent';
  const scoreMap = new Map<consumeType, number>();
  scoreMap.set('unicast', 1 << 0);
  scoreMap.set('broadcast', 1 << 1);
  scoreMap.set('agent', 1 << 2);

  const getScore = (...types: consumeType[]): number => {
    let score = 0;
    types.forEach(type => {
      score += scoreMap.get(type) || 0;
    });
    return score;
  };

  class TestEvent { }

  const func = (type: consumeType) => {
    return async (_: TestEvent) => {
      count += getScore(type);
    };
  };

  const test = async (sender: any, type: 'worker' | 'workers' | 'agent' | 'all', ...types: consumeType[]) => {
    sender.event.publish(type, TestEvent, {});
    await waitFor(2);
    assert(count === getScore(...types));
  };

  beforeEach(async () => {
    ({ app, agent } = await prepareTestApplication());
    count = 0;
    app.event.subscribeAll(TestEvent, func('broadcast'));
    app.event.subscribeOne(TestEvent, func('unicast'));
    agent.event.subscribe(TestEvent, func('agent'));
  });
  afterEach(() => {
    testClear(app, agent);
  });

  describe('AgentEventManager', () => {
    it('publish to a random worker', async () => {
      await test(agent, 'worker', 'unicast');
    });

    it('publish to all workers', async () => {
      await test(agent, 'workers', 'broadcast');
    });

    it('publish to the agent itself', async () => {
      await test(agent, 'agent', 'agent');
    });

    it('publish to all processes', async () => {
      await test(agent, 'all', 'unicast', 'broadcast', 'agent');
    });
  });

  describe('AppEventManager', () => {
    it('publish to a random worker', async () => {
      await test(app, 'worker', 'unicast');
    });

    it('publish to all workers', async () => {
      await test(app, 'workers', 'broadcast');
    });

    it('publish to the agent itself', async () => {
      await test(app, 'agent', 'agent');
    });

    it('publish to all processes', async () => {
      await test(app, 'all', 'unicast', 'broadcast', 'agent');
    });
  });

});
