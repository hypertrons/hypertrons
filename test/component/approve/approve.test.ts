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
import { prepareLuaTest } from '../LuaTestUtil';

describe('approve component', () => {
  let luaVmWrapper;

  before(async () => {
    luaVmWrapper = await prepareLuaTest(__dirname);
  });
  afterEach(() => {
    luaVmWrapper.clean();
  });

  describe('exec approve command', () => {

    it('add approve label', async () => {
      const result = luaVmWrapper.publish('CommandEvent', {
        number: 42,
        command: '/approve',
      });
      assert.deepStrictEqual(result, [
        [ 'addLabels', 42, [ 'pull/approved' ]],
      ]);
    });

  });

});
