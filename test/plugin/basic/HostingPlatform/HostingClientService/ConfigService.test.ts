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

import { Application, Agent } from 'egg';
import { prepareTestApplication, testClear, waitFor } from '../../../../Util';
import { GitHubClient } from '../../../../../app/plugin/github/GitHubClient';
import { waitUntil } from '../../../../../app/basic/Utils';
import { deepEqual } from 'assert';
import { HostingClientConfigInitedEvent } from '../../../../../app/basic/HostingPlatform/event';
import assert from 'power-assert';
import * as path from 'path';
import { RepoFile } from '../../../../../app/basic/DataTypes';

describe('ConfigService', () => {
  let app: Application;
  let agent: Agent;
  let client: GitHubClient;
  let configInitedEvent: HostingClientConfigInitedEvent;
  let callOnConfigLoaded = 0;

  class MockComponentService {
    async getDefaultConfig(_: any): Promise<any> {
      return { default: {} };
    }
    async getDefaultLuaScript(_: any): Promise<any> {
      return { default: 'this is default lua script' };
    }
  }

  class MockHostingBase {
    compService: MockComponentService;
    constructor() {
      this.compService = new MockComponentService();
    }
    getName(): string {
      return 'name';
    }
    getConfig(): any {
      return {};
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
      client.eventService.publish = ((_: 'worker' | 'workers' | 'agent' | 'all',
                                      __: new (...args: any) => any, param: Partial<any>) => {
        configInitedEvent = param as any;
      }) as any;
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
    beforeEach(() => {
      configInitedEvent = undefined as any;
    });

    it('should not update both if commits not include filePath or luaScriptPath', async () => {
      await client.eventService.consume('PushEvent', 'worker', {
        push: { commits: [{ added: [], removed: [], modified: [] }] },
      } as any);
      deepEqual(configInitedEvent, undefined);
    });

    it('should only update config.remote', async () => {
      await client.eventService.consume('PushEvent', 'all', {
        push: { commits: [{ added: [ 'filePath' ], removed: [], modified: [] }] },
      } as any);
      deepEqual(configInitedEvent.rawData, { config: { remote: {} } });

      configInitedEvent = undefined as any;
      await client.eventService.consume('PushEvent', 'all', {
        push: { commits: [{ added: [], removed: [ 'filePath' ], modified: [] }] },
      } as any);
      deepEqual(configInitedEvent.rawData, { config: { remote: {} } });
    });

    it('should only update luaScript.remote', async () => {
      await client.eventService.consume('PushEvent', 'all', {
        push: { commits: [{ added: [ './github/lua/a.lua' ], removed: [], modified: [] }] },
      } as any);
      deepEqual(configInitedEvent.rawData, { luaScript: { remote: {} } });

      configInitedEvent = undefined as any;
      await client.eventService.consume('PushEvent', 'all', {
        push: { commits: [{ added: [], removed: [ './github/lua/b.lua' ], modified: [] }] },
      } as any);
      deepEqual(configInitedEvent.rawData, { luaScript: { remote: {} } });
    });

    it('should only update luaScript.remote', async () => {
      await client.eventService.consume('PushEvent', 'all', {
        push: { commits: [{ added: [ './github/lua/a.lua' ], removed: [], modified: [] }] },
      } as any);
      deepEqual(configInitedEvent.rawData, { luaScript: { remote: {} } });

      configInitedEvent = undefined as any;
      await client.eventService.consume('PushEvent', 'all', {
        push: { commits: [{ added: [], removed: [], modified: [ './github/lua/b.lua' ] }] },
      } as any);
      deepEqual(configInitedEvent.rawData, { luaScript: { remote: {} } });
    });

    it('should not update luaScript if component.enableRepoLua is false', async () => {
      client.getHostingBase().getConfig = ((): any => {
        return {
          component: { enableRepoLua: false },
          config: { remote: { filePath: 'filePath', luaScriptPath: './github/lua/' } },
        };
      });

      await client.eventService.consume('PushEvent', 'all', {
        push: { commits: [{ added: [], removed: [ './github/lua/a.lua' ], modified: [] }] },
      } as any);

      deepEqual(configInitedEvent, undefined);
    });

  });

  describe('onStart HostingClientConfigInitedEvent', () => {

    before(async () => {
      ({ app, agent } = await prepareTestApplication());
      client = new GitHubClient('wsl/test', 0, app, null as any, new MockHostingBase() as any);
      await waitUntil(() => client.getStarted(), { interval: 5 });
      client.onConfigLoaded = () => callOnConfigLoaded++;
    });
    after(() => {
      testClear(app, agent);
      client = null as any;
    });
    beforeEach(() => {
      callOnConfigLoaded = 0;
      configInitedEvent = undefined as any;
      (client.configService as any).config = {};
      (client.configService as any).luaScript = {};
      (client.configService as any).rawData = {
        config: { file: {}, mysql: {}, remote: {} },
        luaScript: { remote: {} },
      };
      (client.configService as any).version = 0;
    });

    it('should update all', async () => {
      await client.eventService.consume('HostingClientConfigInitedEvent', 'all', {
        rawData: {
          config: { remote: { auto_label: {} }, file: { label_setup: {} }, mysql: {} },
          luaScript: { remote: { auto_label: {} } },
        },
        version: 123456,
      } as any);

      await waitFor(20);
      deepEqual((client.configService as any).rawData, {
        config: { remote: { auto_label: {} }, file: { label_setup: {} }, mysql: {} },
        luaScript: { remote: { auto_label: {} } },
      });
      deepEqual((client.configService as any).config, {
        default: {}, auto_label: {}, label_setup: {},
      });
      deepEqual((client.configService as any).luaScript, {
        default: 'this is default lua script',
        auto_label: {},
      });
      assert(callOnConfigLoaded === 1);
    });

    it('should not update if configService.version >= event.version ', async () => {
      (client.configService as any).version = 2;
      (client.configService as any).rawData = {};
      (client.configService as any).config = {};

      await client.eventService.consume('HostingClientConfigInitedEvent', 'all', {
        rawData: {
          config: { remote: { auto_label: {} }, file: { label_setup: {} }, mysql: {} },
          luaScript: { remote: { auto_merge: {} } },
        },
        version: 1,
      } as any);
      await waitFor(20);

      deepEqual((client.configService as any).rawData, {});
      deepEqual((client.configService as any).config, {});
      deepEqual((client.configService as any).luaScript, {});
      assert(callOnConfigLoaded === 0);
    });

    it('should update if configService.version < event.version', async () => {
      (client.configService as any).version = 2;

      await client.eventService.consume('HostingClientConfigInitedEvent', 'all', {
        rawData: {
          config: { remote: { auto_label: {} }, file: { auto_merge: {} } },
          luaScript: { remote: { auto_label: 'this is auto_label lua script' } },
        },
        version: 3,
      } as any);
      await waitFor(20);

      deepEqual((client.configService as any).rawData, {
        config: { file: { auto_merge: {} }, mysql: {}, remote: { auto_label: {} } },
        luaScript: { remote: { auto_label: 'this is auto_label lua script' } },
      });
      deepEqual((client.configService as any).config, {
        default: {}, auto_merge: {}, auto_label: {},
      });
      deepEqual((client.configService as any).luaScript, {
        default: 'this is default lua script',
        auto_label: 'this is auto_label lua script',
      });
      assert(callOnConfigLoaded === 1);
    });
  });

  describe('onStart HostingClientOnConfigFileChangedEvent', () => {
    before(async () => {
      ({ app, agent } = await prepareTestApplication());
      client = new GitHubClient('wsl/test', 0, app, null as any, new MockHostingBase() as any);
      await waitUntil(() => client.getStarted(), { interval: 5 });
      (client.configService as any).loadConfigFromFile = async () => ({ auto_merge: { version: 1 } });
      client.eventService.publish = ((_: 'worker' | 'workers' | 'agent' | 'all',
                                      __: new (...args: any) => any, param: Partial<any>) => {
        configInitedEvent = param as any;
      });
    });
    after(() => {
      testClear(app, agent);
      client = null as any;
    });
    beforeEach(async () => {
      configInitedEvent = undefined as any;
    });

    it('should update file config', async () => {
      await client.eventService.consume('HostingClientOnConfigFileChangedEvent', 'worker', {
        option: 'update',
      } as any);

      await waitFor(5);
      deepEqual(configInitedEvent.rawData.config, { file: { auto_merge: { version: 1 } } });
    });

    it('should remove file config', async () => {
      await client.eventService.consume('HostingClientOnConfigFileChangedEvent', 'worker', {
        option: 'remove',
      } as any);

      await waitFor(5);
      deepEqual(configInitedEvent.rawData.config, { file: {} });
    });

  });

  describe('onStart HostingClientSyncConfigEvent', () => {
    before(async () => {
      ({ app, agent } = await prepareTestApplication());
      client = new GitHubClient('wsl/test', 0, app, null as any, new MockHostingBase() as any);
      await waitUntil(() => client.getStarted(), { interval: 5 });
      (client.configService as any).loadConfigFromFile = async () => ({ auto_label: {} });
      (client.configService as any).loadConfigFromMysql = async () => ({ auto_merge: {} });
      (client.configService as any).loadConfigFromRemote = async () => ({ weekly_report: {} });
      (client.configService as any).loadLuaScriptFromRemote = async () => ({ weekly_report: 'lua' });
      client.eventService.publish = ((_: 'worker' | 'workers' | 'agent' | 'all',
                                      __: new (...args: any) => any, param: Partial<any>) => {
        configInitedEvent = param as any;
      });
    });
    after(() => {
      testClear(app, agent);
      client = null as any;
    });
    beforeEach(async () => {
      configInitedEvent = undefined as any;
      (client.configService as any).config = {};
      (client.configService as any).luaScript = {};
      (client.configService as any).rawData = {
        config: { file: {}, mysql: {}, remote: {} },
        luaScript: { remote: {} },
      };
    });

    it('should call syncData and update all', async () => {
      client.getHostingBase().getConfig = ((): any => {
        return { component: { enableRepoLua: true } };
      });
      await client.eventService.consume('HostingClientSyncConfigEvent', 'worker', {
      } as any);

      await waitFor(5);
      deepEqual(configInitedEvent.rawData, {
        config: {
          file: { auto_label: {} },
          mysql: { auto_merge: {} },
          remote: { weekly_report: {} },
        },
        luaScript: { remote: { weekly_report: 'lua' } },
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
      client.getFileContent = async (_: string): Promise<RepoFile | undefined> => {
        return { content: '{"key": "value"}' } as any;
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
      client.getFileContent = (async (path: string): Promise<RepoFile | undefined> => {
        return { content: `this is lua script in ${path}` } as any;
      });
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
      (client.configService as any).luaScript = {
        comp1: 'lua-comp1',
        comp2: 'lua-comp2',
      };
      const res = client.configService.getLuaScriptOffset();
      deepEqual(res, [{ compName: 'comp1', offset: 6 }, { compName: 'comp2', offset: 6 }]);
    });

    it('getLuaScript() right case', async () => {
      (client.configService as any).luaScript = {
        comp1: 'lua-comp1',
        comp2: 'lua-comp2' ,
      };
      const res = client.configService.getLuaScript();
      const compare =
`local comp1 = function ()
  local compName = 'comp1'
  local compConfig = config.comp1
lua-comp1
end
comp1()
local comp2 = function ()
  local compName = 'comp2'
  local compConfig = config.comp2
lua-comp2
end
comp2()
`;
      assert(res === compare);
    });
  });

});
