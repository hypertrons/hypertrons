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

import { Application, Agent } from 'egg';
import { prepareTestApplication, testClear, waitFor } from '../../../../Util';
import { GitHubClient } from '../../../../../app/plugin/github/GitHubClient';
import { waitUntil } from '../../../../../app/basic/Utils';
import { RawDataStatus } from '../../../../../app/basic/HostingPlatform/HostingClientService/ConfigService';
import { deepEqual } from 'assert';
import assert from 'power-assert';
import * as path from 'path';

describe('ConfigService', () => {
  let app: Application;
  let agent: Agent;
  let client: GitHubClient;
  let publishEvent: any;
  let status: RawDataStatus;
  let callSyncData = 0;

  class MockComponentService {
    async getDefaultConfig(_: any): Promise<any> {
      return { default: 'default' };
    }
    async getDefaultLuaScript(_: any): Promise<any> {
      return { defaultLua: 'defaultLua' };
    }
  }

  class MockHostingBase {
    compService: MockComponentService;
    repoConfigStatus: Map<string, RawDataStatus>;
    constructor() {
      this.compService = new MockComponentService();
      this.repoConfigStatus = new Map<string, RawDataStatus>();
    }
    getName(): string {
      return 'name';
    }
    getConfig(): any {
      return {};
    }
    getRepoConfigStatus(): Map<string, RawDataStatus> {
      return this.repoConfigStatus;
    }
    updateConfigStatus(_: string, changedStatus: RawDataStatus) {
      if (changedStatus.config) {
        Object.keys(changedStatus.config).forEach(key => {
          if (status && changedStatus.config[key] !== undefined) {
            status.config[key] = changedStatus.config[key];
          }
        });
      }
      if (changedStatus.luaScript) {
        Object.keys(changedStatus.luaScript).forEach(key => {
          if (status && changedStatus.luaScript[key] !== undefined) {
            status.luaScript[key] = changedStatus.luaScript[key];
          }
        });
      }
    }
  }

  beforeEach(async () => {
  });
  afterEach(() => {
  });

  describe('onStart PushEvent', () => {

    before(async () => {
      ({ app, agent } = await prepareTestApplication());
      client = new GitHubClient('wsl/test', 0, app, null as any, new MockHostingBase() as any);
      await waitUntil(() => client.getStarted(), { interval: 5 });
      client.getHostingBase().getConfig = ((): any => {
        return {
          component: { enableRepoLua: true },
          config: { remote: { filePath: 'filePath', luaScriptPath: './github/lua/' } },
        };
      });
    });
    after(() => {
      testClear(app, agent);
      client = null as any;
    });
    beforeEach(async () => {
      status = {
        config: { file: 'clear', mysql: 'clear', remote: 'clear' },
        luaScript: { remote: 'clear' },
      };
    });

    it('should not update both if commits not include filePath or luaScriptPath', async () => {
      await client.eventService.consume('PushEvent', 'worker', {
        push: { commits: [{ added: [], removed: [], modified: [] }] },
      } as any);
      const compare = {
        config: { file: 'clear', mysql: 'clear', remote: 'clear' },
        luaScript: { remote: 'clear' },
      };
      deepEqual(compare, status);
    });

    it('should only update config.remote', async () => {
      await client.eventService.consume('PushEvent', 'all', {
        push: { commits: [{ added: [ 'filePath' ], removed: [], modified: [] }] },
      } as any);
      deepEqual(status, {
        config: { file: 'clear', mysql: 'clear', remote: 'updated' },
        luaScript: { remote: 'clear' },
      });

      await client.eventService.consume('PushEvent', 'all', {
        push: { commits: [{ added: [], removed: [ 'filePath' ], modified: [] }] },
      } as any);
      deepEqual(status, {
        config: { file: 'clear', mysql: 'clear', remote: 'deleted' },
        luaScript: { remote: 'clear' },
      });
    });

    it('should only update luaScript.remote', async () => {
      await client.eventService.consume('PushEvent', 'all', {
        push: { commits: [{ added: [ './github/lua/a.lua' ], removed: [], modified: [] }] },
      } as any);
      deepEqual(status, {
        config: { file: 'clear', mysql: 'clear', remote: 'clear' },
        luaScript: { remote: 'updated' },
      });

      await client.eventService.consume('PushEvent', 'all', {
        push: { commits: [{ added: [], removed: [ './github/lua/b.lua' ], modified: [] }] },
      } as any);
      deepEqual(status, {
        config: { file: 'clear', mysql: 'clear', remote: 'clear' },
        luaScript: { remote: 'updated' },
      });
    });

    it('should update configStatus and luaScriptStatus', async () => {
      await client.eventService.consume('PushEvent', 'all', {
        push: { commits: [{ added: [ ], removed: [ './github/lua/a.lua' ], modified: [ 'filePath' ] }] },
      } as any);
      deepEqual(status, {
        config: { file: 'clear', mysql: 'clear', remote: 'updated' },
        luaScript: { remote: 'updated' },
      });

      await client.eventService.consume('PushEvent', 'all', {
        push: { commits: [{ added: [ ], removed: [ 'filePath' ], modified: [ './github/lua/a.lua' ] }] },
      } as any);
      deepEqual(status, {
        config: { file: 'clear', mysql: 'clear', remote: 'deleted' },
        luaScript: { remote: 'updated' },
      });
    });

    it('should not update luaScript if component.enableRepoLua is false', async () => {
      client.getHostingBase().getConfig = ((): any => {
        return {
          component: { enableRepoLua: false },
          config: { remote: { filePath: 'filePath', luaScriptPath: './github/lua/' } },
        };
      });

      await client.eventService.consume('PushEvent', 'all', {
        push: { commits: [{ added: [], removed: [ './github/lua/a.lua' ], modified: [ ] }] },
      } as any);
      deepEqual(status, {
        config: { file: 'clear', mysql: 'clear', remote: 'clear' },
        luaScript: { remote: 'clear' },
      });
    });

  });

  describe('onStart HostingClientConfigInitedEvent', () => {

    before(async () => {
      ({ app, agent } = await prepareTestApplication());
      client = new GitHubClient('wsl/test', 0, app, null as any, new MockHostingBase() as any);
      await waitUntil(() => client.getStarted(), { interval: 5 });
      client.getHostingBase().updateConfigStatus = (_: string, param: any) => {
        status = param;
      };
      client.onConfigLoaded = () => {};
      (client.configService as any).mergedLuaScript = () => {};
      (client.configService as any).mergedConfig = () => {};
    });
    after(() => {
      testClear(app, agent);
      client = null as any;
    });

    it('should update all', async () => {
      await client.eventService.consume('HostingClientConfigInitedEvent', 'all', {
        rawData: {
          config: { remote: { foo1: 'bar1' }, file: { foo2: 'bar2' }, mysql: undefined },
          luaScript: { remote: { foo3: 'bar3' } },
        },
        status: undefined,
      } as any);
      deepEqual((client.configService as any).rawData, {
        config: { remote: { foo1: 'bar1' }, file: { foo2: 'bar2' }, mysql: {}, },
        luaScript: { remote: { foo3: 'bar3' } },
      });
      deepEqual(status, {
        config: { file: 'clear', mysql: 'clear', remote: 'clear' },
        luaScript: { remote: 'clear' },
      });

      await client.eventService.consume('HostingClientConfigInitedEvent', 'all', {
        rawData: {
          config: {},
          luaScript: {},
        },
        status: { config: { remote: 'updated' } },
      } as any);
      deepEqual(status, { config: { remote: 'updated' } });
    });
  });

  describe('onStart HostingClientConfigInitedEvent', () => {
    before(async () => {
      ({ app, agent } = await prepareTestApplication());
      client = new GitHubClient('wsl/test', 0, app, null as any, new MockHostingBase() as any);
      await waitUntil(() => client.getStarted(), { interval: 5 });
      (client.configService as any).syncData = (_: any) => {
        callSyncData++;
      };
    });
    after(() => {
      testClear(app, agent);
      client = null as any;
    });

    it('should call syncData()', async () => {
      callSyncData = 0;
      client.eventService.consume('HostingClientSyncConfigEvent', 'worker', {} as any);
      await waitFor(5);
      assert(callSyncData === 1);
    });

  });

  describe('syncData()', () => {
    before(async () => {
      ({ app, agent } = await prepareTestApplication());
      client = new GitHubClient('wsl/test', 0, app, null as any, new MockHostingBase() as any);
      await waitUntil(() => client.getStarted(), { interval: 5 });
      (client.configService as any).loadConfigFromFile = async () => ({ file: 'file' });
      (client.configService as any).loadConfigFromMysql = async () => ({ mysql: 'mysql' });
      (client.configService as any).loadConfigFromRemote = async () => ({ remote: 'remote' });
      (client.configService as any).loadLuaScriptFromRemote = async () => ({ remoteLua: 'remoteLua' });
      client.eventService.publish = (_: 'worker' | 'workers' | 'agent' | 'all',
                                     __: new (...args: any) => any, param: Partial<any>) => publishEvent = param;
    });
    after(() => {
      testClear(app, agent);
      client = null as any;
    });
    beforeEach(async () => {
      publishEvent = undefined;
      (client.configService as any).config = {};
    });

    it('should update all if do not pass param', async () => {
      await client.configService.syncData();
      assert(publishEvent.status === undefined);
      deepEqual(publishEvent.rawData, {
        config: {  file: { file: 'file' }, mysql: { mysql: 'mysql' }, remote: { remote: 'remote' } },
        luaScript: { remote: { remoteLua: 'remoteLua' } },
      });
    });

    it('should not update if all statuses are clear', async () => {
      await client.configService.syncData({
        config: {  file: 'clear', mysql: 'clear', remote: 'clear' },
        luaScript: {  remote: 'clear' },
      });
      assert(publishEvent === undefined);
    });

    it('should update if all config statuses are deleted and LuaScriptChanged is true', async () => {
      await client.configService.syncData({
        config: {  file: 'deleted', mysql: 'deleted', remote: 'deleted' },
        luaScript: {  remote: 'updated' },
      });
      assert(publishEvent.status === undefined);
      deepEqual(publishEvent.rawData, {
        config: {  file: {}, mysql: {}, remote: {} },
        luaScript: { remote: { remoteLua: 'remoteLua' } },
      });
    });

  });

  describe('loadConfigFromFile()', () => {
    before(async () => {
      ({ app, agent } = await prepareTestApplication());
      client = new GitHubClient('owner/repo2', 0, app, null as any, new MockHostingBase() as any);
      await waitUntil(() => client.getStarted(), { interval: 5 });
    });
    after(() => {
      testClear(app, agent);
      client = null as any;
    });

    it('should return {} if params are empty', async () => {
      client.getHostingBase().getConfig = (): any => ({});
      const result = await (client.configService as any).loadConfigFromFile();
      deepEqual(result, {});
    });

    it('should return {} if file not exist', async () => {
      client.getHostingBase().getConfig = (): any => {
        return { config: { private: { file: { rootPath: 'not_exist' } } } };
      };
      const result = await (client.configService as any).loadConfigFromFile();
      deepEqual(result, {});
    });

    it('right case', async () => {
      client.getHostingBase().getConfig = (): any => {
        return { config: { private: { file: { rootPath: './test/plugin/github/repo_configs' } } } };
      };
      const result = await (client.configService as any).loadConfigFromFile();
      deepEqual(result, { auto_label: { version: 1 } });
    });
  });

  describe('loadConfigFromRemote()', () => {
    before(async () => {
      ({ app, agent } = await prepareTestApplication());
      client = new GitHubClient('wsl/test', 0, app, null as any, new MockHostingBase() as any);
      await waitUntil(() => client.getStarted(), { interval: 5 });
    });
    after(() => {
      testClear(app, agent);
      client = null as any;
    });

    it('should return {} if hostingConfig is empty', async () => {
      client.getHostingBase().getConfig = (): any => ({});
      const res = await (client.configService as any).loadConfigFromRemote();
      deepEqual(res, {});
    });

    it('right case', async () => {
      client.getHostingBase().getConfig = (): any => {
        return {
          enableRepoLua: false,
          config: { remote: { filePath: 'path' } },
        };
      };
      client.getFileContent = async (_: string): Promise<string | undefined> => {
        return '{"key": "value"}';
      };
      const res = await (client.configService as any).loadConfigFromRemote();
      deepEqual({ key: 'value' }, res);
    });
  });

  describe('loadLuaScriptFromRemote()', () => {
    before(async () => {
      ({ app, agent } = await prepareTestApplication());
      client = new GitHubClient('wsl/test', 0, app, null as any, new MockHostingBase() as any);
      await waitUntil(() => client.getStarted(), { interval: 5 });
      (client.configService as any).config = { comp1: {}, comp2: {} };
      client.getFileContent = (async (path: string): Promise<string | undefined> => `this is lua script in ${path}`);
    });
    after(() => {
      testClear(app, agent);
      client = null as any;
    });

    it('should return {} if hostingConfig is false', async () => {
      client.getHostingBase().getConfig = ((): any => {
        return { enableRepoLua: false };
      });
      const res = await (client.configService as any).loadLuaScriptFromRemote();
      deepEqual(res, {});
    });

    it('right case', async () => {
      client.getHostingBase().getConfig = ((): any => {
        return {
          component: { enableRepoLua: true },
          config: { remote: { luaScriptPath: '.github/lua/' } },
        };
      });
      const res = await (client.configService as any).loadLuaScriptFromRemote();
      deepEqual(res, {
        comp1: 'this is lua script in .github/lua/comp1.lua',
        comp2: 'this is lua script in .github/lua/comp2.lua',
      });
    });
  });

  describe('loadConfigFromMysql()', () => {
    before(async () => {
      ({ app, agent } = await prepareTestApplication());
      client = new GitHubClient('wsl/test', 0, app, null as any, new MockHostingBase() as any);
      await waitUntil(() => client.getStarted(), { interval: 5 });
    });
    after(() => {
      testClear(app, agent);
      client = null as any;
    });

    it('should always return {}', async () => {
      deepEqual(await (client.configService as any).loadConfigFromMysql(), {});
    });
  });

  describe('others', () => {
    before(async () => {
      ({ app, agent } = await prepareTestApplication());
      client = new GitHubClient('wsl/test', 0, app, null as any, new MockHostingBase() as any);
      await waitUntil(() => client.getStarted(), { interval: 5 });
    });
    after(() => {
      testClear(app, agent);
      client = null as any;
    });

    it('genRepoConfigFilePath() right case', async () => {
      (client as any).hostId = 0;
      (client as any).fullName = 'owner/repo';
      let result = (client.configService as any).genRepoConfigFilePath('path');
      assert(result === path.join('path', 'owner', 'repo') + '.json');

      (client as any).hostId = 1;
      (client as any).fullName = 'owner/repo';
      result = (client.configService as any).genRepoConfigFilePath('');
      assert(result === path.join('owner', 'repo') + '.json');
    });

    it('genRepoLuaFilePath() right case', async () => {
      let result = (client.configService as any).genRepoLuaFilePath('path', 'a');
      assert(result === path.join('path', 'a.lua'));

      result = (client.configService as any).genRepoLuaFilePath('', 'b');
      assert(result === 'b.lua');
    });

    it('getConfig() right case', async () => {
      (client.configService as any).config = { foo: 'bar' };
      const res = client.configService.getConfig();
      deepEqual(res, { foo: 'bar' });
    });

    it('getCompConfig() right case', async () => {
      (client.configService as any).config = { foo: 'bar' };
      const res = client.configService.getCompConfig<any>('foo');
      assert(res === 'bar');
    });

    it('getCompConfig() should get undefined', async () => {
      (client.configService as any).config = { foo: 'bar' };
      const res = client.configService.getCompConfig<any>('test');
      assert(res === undefined);
    });

    it('getLuaScriptOffset() right case', async () => {
      (client.configService as any).config = {
        comp1: { luaScript: 'lua-comp1' },
        comp2: { luaScript: 'lua-comp2' },
      };
      const res = client.configService.getLuaScriptOffset();
      deepEqual(res, [{ compName: 'comp1', offset: 6 }, { compName: 'comp2', offset: 6 }]);
    });
  });

});
