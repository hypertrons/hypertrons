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
import { prepareTestApplication, testClear } from '../../../Util';
import { ComponentService } from '../../../../app/basic/HostingPlatform/ComponentService';
import { deepEqual } from 'assert';
import assert from 'power-assert';
import path from 'path';

describe('ComponentService', () => {
  let app: Application;
  let agent: Agent;
  let componentService: ComponentService;

  const defaultConfig = {
    comp1: {
      1: {
        config: { foo: 'bar1' },
        luaScript: 'luaScript',
      },
    },
    comp2: {
      1: {
        config: { foo: 'bar1' },
        luaScript: 'luaScript',
      },
      2: {
        config: { foo: 'bar2' },
        luaScript: 'luaScript 2',
      },
    },
    comp3: {
      1: {
        config: { foo: 'bar1' },
        luaScript: 'luaScript',
      },
      2: {
        config: { foo: 'bar2' },
        luaScript: 'luaScript 2',
      },
      3: {
        config: { foo: 'bar3' },
        luaScript: 'luaScript 3',
      },
    },
  };

  beforeEach(async () => {
    ({ app, agent } = await prepareTestApplication());
    componentService = new ComponentService('github', {
      enableRepoLua: true,
      file: {
        basePath: 'app/component',
        configModule: 'config',
        luaModule: 'index.lua',
        versionPath: 'version.json',
      },
    }, app);
  });
  afterEach(() => {
    testClear(app, agent);
    componentService = null as any;
  });

  describe('getComponents() and setComponents()', () => {
    it('right case', async () => {
      componentService.setComponents({} as any);
      deepEqual(componentService.getComponents(), {});
    });
  });

  describe('getComponentLoaded()', () => {
    it('right case', async () => {
      assert(componentService.getComponentLoaded() === false);
    });
  });

  describe('getLatestConfigStructure()', () => {
    it('right case', async () => {
      (componentService as any).configStructure = { foo: 'bar' };
      deepEqual({ foo: 'bar' }, componentService.getLatestConfigStructure());
    });
  });

  describe('getConfigStructureByVersion()', () => {
    it('right case', async () => {
      componentService.setComponents({
        comp: { 1: { foo: 'bar' } },
      });
      (componentService as any).configStructure = {
        comp: { 1: { foo: 'bar' } },
      };
      deepEqual({ foo: 'bar' }, componentService.getConfigStructureByVersion('comp', 1));
    });

    it('should return {} if name or version not exist', async () => {
      componentService.setComponents({
        comp: { 1: { foo: 'bar' } },
      });
      deepEqual({}, componentService.getConfigStructureByVersion('comp', 2));
      deepEqual({}, componentService.getConfigStructureByVersion('not_exist', 1));
    });
  });

  describe('loadComponents()', () => {
    it('should return undefined if directory path not exists', async () => {
      (componentService as any).config = { file: { basePath: 'not_exist' } };
      const res = await componentService.loadComponents();
      assert(res === undefined);
    });

    it('should return undefined if path is not a directory', async () => {
      const dir = path.join('test', 'plugin', 'basic', 'HostingPlatform', 'ComponentService.test.ts');
      (componentService as any).config = { file: { basePath: dir } };
      const res = await componentService.loadComponents();
      assert(res === undefined);
    });

    it('right case', async () => {
      (componentService as any).loadComponent = async () => {};
      const dir = path.join('test', 'plugin', 'basic', 'HostingPlatform', 'components');
      (componentService as any).config = { file: { basePath: dir } };
      const res = await componentService.loadComponents();
      assert(componentService.getComponentLoaded() === true);
      deepEqual({}, res);
    });
  });

  describe('loadComponent()', () => {
    it('should return if path is not a directory', async () => {
      const dir = path.join(app.baseDir, 'test', 'plugin', 'basic', 'HostingPlatform', 'ComponentService.test.ts');
      await (componentService as any).loadComponent(dir, 'auto_label');
      deepEqual(componentService.getComponents(), {});
    });

    it('right case', async () => {
      const dir = path.join(app.baseDir, 'test', 'plugin', 'basic', 'HostingPlatform', 'components', 'auto_label');
      const sourceConfig = {
        configModule: 'config',
        luaModule: 'index.lua',
        versionPath: 'version.json',
      };
      await (componentService as any).loadComponent(dir, 'auto_label', sourceConfig);
      const comps = componentService.getComponents().auto_label;
      assert(comps[1].config && comps[1].name && comps[1].version && comps[1].configStructure && comps[1].luaScript);
    });

    it('right case', async () => {
      const dir = path.join(app.baseDir, 'test', 'plugin', 'basic', 'HostingPlatform', 'components', 'command');
      const sourceConfig = {
        configModule: 'config',
        luaModule: 'index.lua',
        versionPath: 'version.json',
      };
      await (componentService as any).loadComponent(dir, 'command', sourceConfig);
      const comps = componentService.getComponents().command;
      assert(comps[1].config && comps[1].name && comps[1].version && comps[1].configStructure);
    });
  });

  describe('getDefaultConfig()', () => {
    it('right case', async () => {
      (componentService as any).componentLoaded = true;
      componentService.setComponents(defaultConfig);
      const config = {
        comp1: { version: 1, foo: 'bar' },
        comp2: { version: 3, foo: 'bar' },
        comp3: { version: 2, foo: 'bar' },
        comp4: { version: 2, foo: 'bar' },
      };
      const res = await componentService.getDefaultConfig(config);
      deepEqual(res, { comp1: { foo: 'bar1' }, comp3: { foo: 'bar2' } });
    });

    it('should return {} if config is empty', async () => {
      (componentService as any).componentLoaded = true;
      componentService.setComponents(defaultConfig);
      const res = await componentService.getDefaultConfig(undefined);
      deepEqual(res, {});
    });
  });

  describe('getDefaultLuaScript()', () => {
    it('right case', async () => {
      (componentService as any).componentLoaded = true;
      componentService.setComponents(defaultConfig);
      const config = {
        comp1: { version: 1, foo: 'bar' },
        comp2: { version: 3, foo: 'bar' },
        comp3: { version: 2, foo: 'bar' },
        comp4: { version: 2, foo: 'bar' },
      };
      const res = await componentService.getDefaultLuaScript(config);
      deepEqual(res, { comp1: 'luaScript', comp3: 'luaScript 2' });
    });

    it('should return {} if config is empty', async () => {
      (componentService as any).componentLoaded = true;
      componentService.setComponents(defaultConfig);
      const res = await componentService.getDefaultLuaScript(undefined);
      deepEqual(res, {});
    });
  });
});
