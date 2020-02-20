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
import { prepareTestApplication, testClear } from '../../../../Util';
import { Application, Agent } from 'egg';
import { LuaService } from '../../../../../app/basic/HostingPlatform/HostingClientService/LuaService';

describe('LuaServiceLabelSetup', () => {
  let app: Application;
  let agent: Agent;
  let updateCounter = 0;
  let createCounter = 0;
  let luaService: LuaService<any, any>;

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
      return { labels: [] };
    }
    listLabels() {
      return [];
    }
    updateLabels<T>(updateTask: T[]): void {
      updateCounter += updateTask.length;
    }
    createLabels<T>(createTask: T[]): void {
      createCounter += createTask.length;
    }
  }

  beforeEach(async () => {
    ({ app, agent } = await prepareTestApplication());
    luaService = new LuaService(app, new MockClient() as any);
    updateCounter = 0;
    createCounter = 0;
  });
  afterEach(() => {
    testClear(app, agent);
  });

  it('no need to update', async () => {
    (luaService as any).client.getCompConfig = () => {
      return { labels: [{ name: 'test1' }] };
    };
    (luaService as any).client.listLabels = () => {
      return [{ name: 'test1' }];
    };
    await (luaService as any).lua_labelSetup();
    assert(updateCounter === 0 && createCounter === 0);
  });

  it('update old labels', async () => {
    (luaService as any).client.getCompConfig = () => {
      return { labels: [{ name: 'test1', color: 'color1' }] };
    };
    (luaService as any).client.listLabels = () => {
      return [{ name: 'test1' }];
    };
    await (luaService as any).lua_labelSetup();
    assert(updateCounter === 1 && createCounter === 0);
  });

  it('create new labels', async () => {
    (luaService as any).client.getCompConfig = () => {
      return { labels: [{ name: 'test1' }] };
    };
    await (luaService as any).lua_labelSetup();
    assert(updateCounter === 0 && createCounter === 1);
  });

  it('mixed tests', async () => {
    (luaService as any).client.getCompConfig = () => {
      return {
        labels: [
          { name: 'test1' },
          { name: 'test2', description: 'description2' },
          { name: 'test3' },
        ],
      };
    };
    (luaService as any).client.listLabels = () => {
      return [
        { name: 'test1' },
        { name: 'test2' },
      ];
    };
    await (luaService as any).lua_labelSetup();
    assert(updateCounter === 1 && createCounter === 1);
  });

});
