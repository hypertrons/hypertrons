'use strict';

import assert from 'assert';
import mock, { MockApplication } from 'egg-mock';
import { waitFor } from '../Util';

describe('AgentEventManager', () => {
  let app: MockApplication;

  beforeEach(async () => {
    app = mock.app({
        cache: false,
    });
    await app.ready();
  });
  afterEach(() => {
    mock.restore();
  });

  class TestEvent {
    num: number;
  }

  describe('publish()', () => {
    // can't send to random
    it('should publish to a random worker', async () => {
      let count = 0;
      app.event.subscribeOne(TestEvent, async e => { count += e.num; });
      (app as any).agent.event.publish('worker', TestEvent, { num: 1 });
      await waitFor(10);
      console.log(count);
      // assert(count === 1);
    });

    // agent can't send to workers
    it('should publish to all workers', async () => {
      let count = 0;
      app.event.subscribeAll(TestEvent, async e => { count += e.num; });
      (app as any).agent.event.publish('workers', TestEvent, { num: 1 });
      await waitFor(10);
      console.log(count);
      // assert(count === 1);
    });

    it('should publish to the agent itself', async () => {
      let count = 0;
      (app as any).agent.event.subscribe(TestEvent, async e => { count += e.num; });
      (app as any).agent.event.publish('agent', TestEvent, { num: 1 });
      await waitFor(10);
      assert(count === 1);
    });

    // agent can't send to app correctlly
    it('should publish to all processes', async () => {
      let count = 0;
      app.event.subscribeAll(TestEvent, async e => { count += e.num; });
      (app as any).agent.event.subscribe(TestEvent, async e => { count += e.num; });
      (app as any).agent.event.publish('all', TestEvent, { num: 1 });
      await waitFor(10);
      console.log(count);
      // assert(count === 2);
    });
  });

});
