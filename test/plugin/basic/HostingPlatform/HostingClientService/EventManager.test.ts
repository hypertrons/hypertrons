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

import assert, { deepEqual } from 'assert';
import { Application, Agent } from 'egg';
import { prepareTestApplication, testClear } from '../../../../Util';
import { EventManager } from '../../../../../app/basic/HostingPlatform/HostingClientService/EventManager';
import { PushEvent } from '../../../../../app/plugin/event-manager/events';

describe('EventManager', () => {
  let app: Application;
  let agent: Agent;
  let eventService: EventManager<any, any>;
  let count = 0;

  class MockHostingBase {
    getName () {
      return 'name';
    }
  }
  class MockClient {
    mockHostingBase: MockHostingBase;
    constructor() {
      this.mockHostingBase = new MockHostingBase();
    }
    getHostingBase() {
      return this.mockHostingBase;
    }
    getFullName() {
      return 'name';
    }
  }

  beforeEach(async () => {
    ({ app, agent } = await prepareTestApplication());
    eventService = new EventManager<any, any>(app, new MockClient() as any);
    count = 0;
  });
  afterEach(() => {
    testClear(app, agent);
  });

  describe('Life cycle functions', () => {
    it('right case', async () => {
      await eventService.onStart();
      await eventService.onDispose();
      await eventService.onConfigLoaded();
      await eventService.syncData();
    });
  });

  describe('subscribeOne()', () => {
    it('right case', async () => {
      eventService.subscribeOne(PushEvent, async () => {
        count++;
      });
      eventService.consume('PushEvent', 'worker', {} as any);
      assert(count === 1);
    });
  });

  describe('subscribeAll()', () => {
    it('right case', async () => {
      eventService.subscribeAll(PushEvent, async () => {
        count++;
      });
      eventService.consume('PushEvent', 'all', {} as any);
      assert(count === 1);
    });
  });

  describe('unsubscribeOne()', () => {
    it('right case', async () => {
      const func = async () => { count++; };
      eventService.subscribeOne(PushEvent, func);
      eventService.consume('PushEvent', 'worker', {} as any);
      eventService.unsubscribeOne(PushEvent, func);
      eventService.consume('PushEvent', 'worker', {} as any);
      assert(count === 1);
    });
  });

  describe('consume()', () => {
    it('right case', async () => {
      eventService.subscribeOne(PushEvent, async () => {
        count++;
      });
      eventService.subscribeAll(PushEvent, async () => {
        count++;
      });
      eventService.consume('PushEvent', 'worker', {} as any);
      assert(count === 1);
      eventService.consume('PushEvent', 'all', {} as any);
      assert(count === 2);
      eventService.consume('PushEvent', 'workers', {} as any);
      assert(count === 3);
      eventService.consume('PushEvent', 'agent', {} as any);
      assert(count === 3);
      eventService.consume('PushEvent', 'others' as any, {} as any);
      assert(count === 3);
    });
  });

  describe('publish()', () => {
    it('right case', async () => {
      let type = '';
      let param: any;
      app.event.publish = (pType: string, _: any, pParam: any) => {
        type = pType;
        param = pParam;
      };
      eventService.publish('all', PushEvent, {} as any);
      assert(type === 'all');
      deepEqual(param , {});

      eventService.publish('worker', PushEvent, { foo: 'bar' } as any);
      assert(type === 'worker');
      deepEqual(param , { foo: 'bar' });
    });
  });
});
