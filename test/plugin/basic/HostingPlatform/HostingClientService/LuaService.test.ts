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
import { prepareTestApplication, testClear } from '../../../../Util';
import { Application, Agent } from 'egg';
import { LuaService } from '../../../../../app/basic/HostingPlatform/HostingClientService/LuaService';

describe('LuaService', () => {
  let app: Application;
  let agent: Agent;
  let luaService: LuaService<any, any>;
  let count = 0;

  class MockHostingBase {
    getName(): string {
      return 'name';
    }
    getConfig(): any {
      return {};
    }
  }
  class MockClient {
    getHostingBase(): any {
      return new MockHostingBase();
    }
    getFullName(): string {
      return 'owner/repo';
    }
    getCompConfig() {
      return { };
    }
    getRepoData() {
      return {};
    }
    addIssue() {
      count++;
    }
    assign() {
      count++;
    }
    addIssueComment() {
      count++;
    }
    addLabels() {
      count++;
    }
    merge() {
      count++;
    }

  }

  beforeEach(async () => {
    ({ app, agent } = await prepareTestApplication());
    luaService = new LuaService(app, new MockClient() as any);
    count = 0;
  });
  afterEach(() => {
    testClear(app, agent);
  });
  it('lua_getData()', async () => {
    const res = (luaService as any).lua_getData();
    deepEqual(res, {});
  });
  it('lua_addIssue()', async () => {
    (luaService as any).lua_addIssue(1, []);
    assert(count === 1);
  });
  it('lua_assign()', async () => {
    (luaService as any).lua_assign();
    assert(count === 1);
  });
  it('lua_addIssueComment()', async () => {
    (luaService as any).lua_addIssueComment(1, '');
    assert(count === 1);
  });
  it('lua_addLabels()', async () => {
    (luaService as any).lua_addLabels(1, []);
    assert(count === 1);
  });
  it('lua_toNow()', async () => {
    (luaService as any).lua_toNow();
  });
  it('lua_log()', async () => {
    (luaService as any).lua_log('log');
  });
  it('lua_merge()', async () => {
    (luaService as any).lua_merge();
    assert(count === 1);
  });

});
