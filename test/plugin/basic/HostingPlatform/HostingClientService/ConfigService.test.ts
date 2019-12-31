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
import { prepareTestApplication, testClear } from '../../../../Util';
import { GitHubClient } from '../../../../../app/plugin/github/GitHubClient';
import { waitUntil } from '../../../../../app/basic/Utils';
import assert, { deepEqual } from 'assert';
import path from 'path';

describe('ConfigService', () => {
  let app: Application;
  let agent: Agent;
  let client: GitHubClient;
  let callSyncDataCount = 0;
  let updateConfig = false;
  let updateLuaScript = false;

  class MockComponentService {
    async getDefaultConfig(_: any): Promise<any> {
      return {};
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
    callSyncDataCount = 0;
    updateConfig = false;
    updateLuaScript = false;
  });
  afterEach(() => {
  });

  describe('onStart PushEvent', () => {

    before(async () => {
      ({ app, agent } = await prepareTestApplication());
      client = new GitHubClient('wsl/test', 0, app, null as any, new MockHostingBase() as any);
      await waitUntil(() => client.getStarted(), { interval: 5 });
      client.configService.syncData = (async (pUpdateConfig: boolean, pUpdateLuaScript: boolean) => {
        updateConfig = pUpdateConfig;
        updateLuaScript = pUpdateLuaScript;
        callSyncDataCount++;
      });
      client.getHostingBase().getConfig = ((): any => {
        return {
          enableRepoLua: true,
          config: { remote: { filePath: 'filePath', luaScriptPath: './github/lua/' } },
        };
      });
    });
    after(() => {
      testClear(app, agent);
      client = null as any;
    });

    it('should not trigger syncData() if commits not include filePath or luaScriptPath', async () => {
      await client.eventService.consume('PushEvent', 'worker', {
        push: { commits: [{ added: [], removed: [], modified: [] }] },
      } as any);
      assert(callSyncDataCount === 0);
    });

    it('should only update config', async () => {
      await client.eventService.consume('PushEvent', 'worker', {
        push: { commits: [{ added: [ 'filePath' ], removed: [], modified: [] }] },
      } as any);
      assert(updateConfig && updateLuaScript === false);
    });

    it('should only update luaScript', async () => {
      await client.eventService.consume('PushEvent', 'worker', {
        push: { commits: [{ added: [ './github/lua/' ], removed: [], modified: [] }] },
      } as any);
      assert(updateConfig === false && updateLuaScript);
    });

    it('should update config and luaScript', async () => {
      await client.eventService.consume('PushEvent', 'worker', {
        push: { commits: [{ added: [ ], removed: [ './github/lua/' ], modified: [ 'filePath' ] }] },
      } as any);
      assert(updateConfig && updateLuaScript);
    });

  });

  describe('onStart HostingClientConfigInitedEvent', () => {

    before(async () => {
      ({ app, agent } = await prepareTestApplication());
      client = new GitHubClient('wsl/test', 0, app, null as any, new MockHostingBase() as any);
      await waitUntil(() => client.getStarted(), { interval: 5 });
      client.onConfigLoaded = () => { };
    });
    after(() => {
      testClear(app, agent);
      client = null as any;
    });

    it('should update config and luaScript', async () => {
      (client.configService as any).config = {};
      (client.configService as any).luaScript = '';

      await client.eventService.consume('HostingClientConfigInitedEvent', 'all', {
        config: { foo: 'bar' },
        luaScript: 'foo bar',
      } as any);
      deepEqual(client.configService.getConfig(), { foo: 'bar' });
      assert(client.configService.getLuaScript() === 'foo bar');
    });

    it('should only update luaScript', async () => {
      (client.configService as any).config = { foo: 'bar' };
      (client.configService as any).luaScript = '';

      await client.eventService.consume('HostingClientConfigInitedEvent', 'all', {
        config: undefined,
        luaScript: 'test',
      } as any);
      deepEqual(client.configService.getConfig(), { foo: 'bar' });
      assert(client.configService.getLuaScript() === 'test');
    });

    it('should only update config', async () => {
      (client.configService as any).config = {};
      (client.configService as any).luaScript = 'test';

      await client.eventService.consume('HostingClientConfigInitedEvent', 'all', {
        config: { foo: 'bar' },
        luaScript: '',
      } as any);
      deepEqual(client.configService.getConfig(), { foo: 'bar' });
      assert(client.configService.getLuaScript() === 'test');
    });

    it('should not update config and luaScript', async () => {
      (client.configService as any).config = {};
      (client.configService as any).luaScript = 'test';

      await client.eventService.consume('HostingClientConfigInitedEvent', 'all', {
        config: undefined,
        luaScript: '',
      } as any);
      deepEqual(client.configService.getConfig(), {});
      assert(client.configService.getLuaScript() === 'test');
    });
  });

  describe('syncData()', () => {
    before(async () => {
      ({ app, agent } = await prepareTestApplication());
      client = new GitHubClient('wsl/test', 0, app, null as any, new MockHostingBase() as any);
      await waitUntil(() => client.getStarted(), { interval: 5 });
      (client.configService as any).loadConfig = (async () => {
        (client.configService as any).config = { foo: 'bar' };
      });
      (client.configService as any).loadLuaScript = (async () => {
        (client.configService as any).luaScript = 'foo:bar';
      });
      client.eventService.publish = () => {};
    });
    after(() => {
      testClear(app, agent);
      client = null as any;
    });
    beforeEach(async () => {
      (client.configService as any).config = {};
      (client.configService as any).luaScript = '';
    });

    it('should update config and luaScript', async () => {
      await client.configService.syncData();
      assert((client.configService as any).luaScript === 'foo:bar');
      deepEqual((client.configService as any).config, { foo: 'bar' });
    });

    it('should only update config', async () => {
      await client.configService.syncData(true, false);
      deepEqual((client.configService as any).config, { foo: 'bar' });
      assert((client.configService as any).luaScript === '');
    });

    it('should only update luaScript', async () => {
      await client.configService.syncData(false, true);
      deepEqual((client.configService as any).config, {});
      assert((client.configService as any).luaScript === 'foo:bar');
    });
  });

  describe('loadConfig() and loadLuaScript()', () => {
    before(async () => {
      ({ app, agent } = await prepareTestApplication());
      client = new GitHubClient('wsl/test', 0, app, null as any, new MockHostingBase() as any);
      await waitUntil(() => client.getStarted(), { interval: 5 });
      client.getHostingBase().compService.getDefaultConfig = async (_: any): Promise<any> => {
        return { comp1: {}, comp2: {} };
      };
      client.getHostingBase().compService.getDefaultLuaScript = async (_: any): Promise<any> => {
        return {  comp1: 'lua script1', comp2: 'lua script2' };
      };
      client.getHostingBase().getConfig = (): any => {
        return {};
      };
    });
    after(() => {
      testClear(app, agent);
      client = null as any;
    });

    it('loadConfig() right case', async () => {
      await (client.configService as any).loadConfig();
      deepEqual((client.configService as any).config, { comp1: {}, comp2: {} });
    });

    it('loadLuaScript() right case', async () => {
      await (client.configService as any).loadLuaScript((client.configService as any).config);
      const lua =
`local comp1 = function ()
  local compName = 'comp1'
  local compConfig = config.comp1
lua script1
end
comp1()
local comp2 = function ()
  local compName = 'comp2'
  local compConfig = config.comp2
lua script2
end
comp2()
`;
      assert((client.configService as any).luaScript === lua);
    });
  });

  describe('loadConfigFromFile()', () => {
    before(async () => {
      ({ app, agent } = await prepareTestApplication());
      client = new GitHubClient('wsl/test', 0, app, null as any, new MockHostingBase() as any);
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
          enableRepoLua: true,
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

    it('genRepoConfigFilePath() should return "" if params are empty', async () => {
      (client as any).hostId = 0;
      (client as any).fullName = 'owner/repo';
      const result = (client.configService as any).genRepoConfigFilePath(null as any);
      assert(result === '');
    });

    it('genRepoConfigFilePath() right case', async () => {
      (client as any).hostId = 0;
      (client as any).fullName = 'owner/repo';
      let result = (client.configService as any).genRepoConfigFilePath('path');
      assert(result === path.join('path', '0_owner_repo.json'));

      (client as any).hostId = 1;
      (client as any).fullName = 'owner/repo';
      result = (client.configService as any).genRepoConfigFilePath('path');
      assert(result === path.join('path', '1_owner_repo.json'));
    });

    it('generateLuaContent() right case', async () => {
      (client.configService as any).generateLuaContent({
        im: 'im',
        ci: 'ci',
      });
      const script =
`local im = function ()
  local compName = 'im'
  local compConfig = config.im
im
end
im()
local ci = function ()
  local compName = 'ci'
  local compConfig = config.ci
ci
end
ci()
`;
      assert((client.configService as any).luaScript === script);
    });

    it('getConfig() right case', async () => {
      (client.configService as any).config = { foo: 'bar' };
      const res = client.configService.getConfig();
      deepEqual(res, { foo: 'bar' });
    });

    it('getLuaScript() right case', async () => {
      (client.configService as any).luaScript = 'foo-bar';
      const res = client.configService.getLuaScript();
      assert(res, 'foo-bar');
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
      (client.configService as any).luaScriptOffset = [
        { compName: 'a', offset: 10 },
        { compName: 'b', offset: 20 },
      ];
      const res = client.configService.getLuaScriptOffset();
      deepEqual(res, [
        { compName: 'a', offset: 10 },
        { compName: 'b', offset: 20 },
      ]);
    });
  });

});
