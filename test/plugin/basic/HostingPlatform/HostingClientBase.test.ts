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

import { GitHubClient } from '../../../../app/plugin/github/GitHubClient';
import { Application, Agent } from 'egg';
import { prepareTestApplication, testClear, waitFor } from '../../../Util';
import { waitUntil } from '../../../../app/basic/Utils';
import assert, { deepEqual } from 'assert';

describe('HostingClientBase', () => {
  let app: Application;
  let agent: Agent;
  let client: GitHubClient;
  let onStartCount = 0;
  let onConfigLoadedCount = 0;
  let onDisposeCount = 0;
  let syncDataCount = 0;

  class MockHostingBase {
    getName(): string {
      return 'name';
    }
    getConfig(): any {
      return { updateRepoDataSched: '0 0 8 * * *' };
    }
  }

  beforeEach(async () => {
    ({ app, agent } = await prepareTestApplication());

    client = new GitHubClient('hypertrons/test', 0, app, null as any, new MockHostingBase() as any);
    (client as any).services.forEach(service => {
      service.onStart = async () => onStartCount++;
    });
    (client as any).services.forEach(service => {
      service.onDispose = async () => onDisposeCount++;
    });
    (client as any).services.forEach(service => {
      service.onConfigLoaded = async () => onConfigLoadedCount++;
    });
    (client as any).services.forEach(service => {
      service.syncData = async () => syncDataCount++;
    });

  });
  afterEach(() => {
    testClear(app, agent);
  });

  describe('HostingClientSyncDataEvent()', () => {
    it('right case', async () => {
      let syncDataCount = 0;
      await waitUntil(() => client.getStarted(), { interval: 10 });
      client.syncData = async () => {
        syncDataCount++;
      };
      await client.eventService.consume('HostingClientSyncDataEvent', 'worker', {} as any);
      assert(syncDataCount === 1);
    });
  });

  describe('onStart()', () => {
    it('right case', async () => {
      onStartCount = 0;
      await client.onStart();
      assert(onStartCount === (client as any).services.length);
    });
  });

  describe('onDispose()', () => {
    it('right case', async () => {
      onDisposeCount = 0;
      await client.onDispose();
      assert(onDisposeCount === (client as any).services.length);
    });
  });

  describe('onConfigLoaded()', () => {
    it('right case', async () => {
      onConfigLoadedCount = 0;
      client.onConfigLoaded();
      assert(onConfigLoadedCount === (client as any).services.length);
    });
  });

  describe('syncData()', () => {
    it('right case', async () => {
      syncDataCount = 0;
      client.syncData();
      await waitFor(5);
      assert(syncDataCount === (client as any).services.length);
    });
  });

  describe('getOwner()', () => {
    it('right case', async () => {
      assert(client.getOwner() === 'hypertrons');
    });
  });

  describe('getConfig()', () => {
    it('right case', async () => {
      (client.configService as any).config = { foo: 'bar' };
      const res = client.getConfig();
      deepEqual(res, { foo: 'bar' });
    });
  });

  describe('getLuaScript()', () => {
    it('right case', async () => {
      (client.configService as any).luaScript = { weekly_report: 'weekly_report lua code' };
      const res = client.getLuaScript();
      const compare = `local weekly_report = function ()
  local compName = 'weekly_report'
  local compConfig = config.weekly_report
weekly_report lua code
end
weekly_report()
`;
      assert(res === compare);
    });
  });

  describe('getCompConfig()', () => {
    it('right case', async () => {
      (client.configService as any).config = { foo: 'bar' };
      const res = client.getCompConfig<any>('foo');
      assert(res === 'bar');
    });
  });

  describe('get and set RawClient()', () => {
    it('right case', async () => {
      client.setRawClient({ foo: 'bar' } as any);
      deepEqual(client.getRawClient(), { foo: 'bar' });
    });
  });
});
