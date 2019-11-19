'use strict';

import assert from 'assert';
import mock, { MockApplication } from 'egg-mock';
import { waitFor } from '../Util';

describe('AppEventManager', () => {
  let app: MockApplication;

  beforeEach(async () => {
    app = mock.app({
      cache: false,
    });
    await app.ready();
  });
  afterEach(mock.restore);

  class TestEvent {
    num: number;
  }

  describe('publish()', () => {
    it('should publish to the worker itself', async () => {
      let count = 0;
      app.event.subscribeOne(TestEvent, async e => { count += e.num; });
      app.event.publish('worker', TestEvent, { num: 1 });
      await waitFor(10);
      assert(count === 1);
    });

    it('should publish to all workers', async () => {
      let count = 0;
      app.event.subscribeAll(TestEvent, async e => { count += e.num; });
      app.event.publish('workers', TestEvent, { num: 1 });
      await waitFor(10);
      assert(count === 1);
    });

    it('should publish to the agent', async () => {
      let count = 0;
      (app as any).agent.event.subscribe(TestEvent, async e => { count += e.num; });
      app.event.publish('agent', TestEvent, { num: 1 });
      await waitFor(10);
      assert(count === 1);
    });

    it('should publish to all processes', async () => {
      let count = 0;
      app.event.subscribeAll(TestEvent, async e => { count += e.num; });
      (app as any).agent.event.subscribe(TestEvent, async e => { count += e.num; });
      app.event.publish('all', TestEvent, { num: 1 });
      await waitFor(10);
      assert(count === 2);
    });
  });

});
