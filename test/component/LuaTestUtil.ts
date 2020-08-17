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

import { LuaVm } from '../../app/lua-vm/lua-vm';
import { readFileSync } from 'fs';
import { join, basename } from 'path';

export class LuaVmWrapper {
  luaVm: LuaVm;
  onMap: Map<string, any>;
  schedMap: Map<string, any>;
  requestParams: any[] = [];

  constructor(luaVm: LuaVm, onMap: Map<string, any>, schedMap: Map<string, any>) {
    this.luaVm = luaVm;
    this.onMap = onMap;
    this.schedMap = schedMap;
  }

  publish(eventType: string, eventContent: any) {
    const funcs = this.onMap.get(eventType);
    if (funcs) {
      funcs.map(f => f(eventContent));
    }
    return this.requestParams;
  }

  invoke(schedName: string) {
    const funcs = this.schedMap.get(schedName);
    if (funcs) {
      funcs.map(f => f());
    }
    return this.requestParams;
  }

  clean() {
    this.requestParams.length = 0;
  }
}

/**
 *
 * @param path can be the component name or `__dirname`
 * @param injectMap the ts functions that gonna injected into lua vm
 */
export async function prepareLuaTest(path: string, opt?: { customConfig?: any, injectMap?: Map<string, any> }): Promise<LuaVmWrapper> {
  const compName = basename(path);

  const luaVm = new LuaVm();
  const cc = await import(join('../../app/component/', compName, '/defaultConfig'));
  const compConfig = cc.default;
  const hypertronsConfig = JSON.parse(readFileSync(join(__dirname, '../../.github/hypertrons.json')).toString());
  const luaContent = readFileSync(join(__dirname, '../../app/component/', compName, '/index.lua')).toString();
  const defaultInjectMap = new Map();
  const onMap = new Map();
  const schedMap = new Map();
  const luaTestVm = new LuaVmWrapper(luaVm, onMap, schedMap);

  defaultMockLuaMethods.map(m => {
    defaultInjectMap.set(m, (...args) => {
      // once modify the default lua method, counter will not count for it
      luaTestVm.requestParams.push([ m, ...args ]);
    });
  });
  // on and sched can not be mocked
  // set on
  defaultInjectMap.set('on', (eventType: string, cb: any) => {
    if (!onMap.get(eventType)) {
      onMap.set(eventType, []);
    }
    onMap.get(eventType).push(cb);
  });
  // set sched
  defaultInjectMap.set('sched', (schedName: string, _schedTime: string, cb: any) => {
    if (!schedMap.get(schedName)) {
      schedMap.set(schedName, []);
    }
    schedMap.get(schedName).push(cb);
  });

  defaultInjectMap.forEach((v, k) => {
    luaVm.set(k, v);
  });
  // use option to replace default param
  if (opt) {
    // if caller set inject map, replace origin lua function
    if (opt.injectMap) {
      opt.injectMap.forEach((v, k) => {
        luaVm.set(k, v);
      });
    }
    // if set customized test config, replace origin one
    if (opt.customConfig) {
      Object.assign(hypertronsConfig, opt.customConfig);
    }
  }

  luaVm.set('config', hypertronsConfig);
  luaVm.set('compConfig', compConfig);
  luaVm.set('compName', compName);
  luaVm.run(luaContent);

  return luaTestVm;

}

const defaultMockLuaMethods = [
  'getData', 'getRoles', 'addIssue', 'assign', 'addIssueComment',
  'addLabels', 'toNow', 'log', 'checkAuth', 'merge', 'runCI',
  'sendToSlack', 'sendToMail', 'sendToDingTalk', 'labelSetup', 'updateIssue', 'updatePull', 'removeLabel',
];
