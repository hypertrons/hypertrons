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

import assert from 'power-assert';
import { prepareLuaTest, LuaVmWrapper } from '../LuaTestUtil';
import { LuaVm } from '../../../app/lua-vm/lua-vm';

describe('vote component', () => {
  let luaVmWrapper: LuaVmWrapper;

  before(async () => {
    luaVmWrapper = await prepareLuaTest(__dirname, {
      injectMap: new Map()
      .set('getIssuesNumber', () => [ 0 ])
      .set('getIssueMetaData', (n: number) => {
        return {
          launchTime: n + 1,
          duration: 0,
        };
      })
      .set('toNowNumber', (n: number) => n),
    });
  });
  afterEach(() => {
    luaVmWrapper.clean();
  });

  describe('util lua function', () => {
    it('splitByComma', async () => {
      const luaVm = new LuaVm();
      luaVm.set('s', 'a,b,c,d');
      const result = luaVm.run(`
local s_res = {}
for c in string.gmatch(s, '([^,]+)') do
  table.insert(s_res, c)
end
return s_res
`);
      assert.deepStrictEqual(result, [ 'a', 'b', 'c', 'd' ]);
    });

    it('convertDuration', async () => {
      const luaVm = new LuaVm();
      luaVm.set('dur', '2h');
      const result = luaVm.run(`
local endChar = string.sub(dur, -1)
local dur_res = tonumber(string.sub(dur, 1, -2))
if (endChar == 'h') then
  dur_res = dur_res * 60 * 60 * 1000
elseif (endChar == 'd') then
  dur_res = dur_res * 24 * 60 * 60 * 1000
end
return dur_res
  `);
      assert.deepStrictEqual(result, 2 * 60 * 60 * 1000);
    });

    it('Vote Sched', async () => {
      const result = luaVmWrapper.invoke('Vote Regular Check');
      assert.deepStrictEqual(result, [
        [ 'addLabels', 0, [ 'vote end' ]],
        [ 'removeLabel', 0, 'voting' ],
      ]);
    });
  });
});
