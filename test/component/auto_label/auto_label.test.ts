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

describe('auto_label component', () => {
  let luaVmWrapper;

  before(async () => {
    luaVmWrapper = await prepareLuaTest(__dirname, {
      customConfig: {
        label_setup: {
          version: 1,
          labels: [
            {
              name: 'kind/bug',
              description: 'Category issues or prs related to bug.',
              color: 'e11d21',
              keywords: [ 'bug', 'bugreport', 'bug-report', 'bugfix', 'cannot', 'can not', "can't",
                          'error', 'failure', 'failed to', 'fix:' ],
            },
            {
              name: 'kind/feature',
              description: 'Category issues or prs related to feature request.',
              color: 'c7def8',
              keywords: [ 'feature', 'feature request', 'feature-request', 'feature_request' ],
            },
          ],
        },
      },
    });
  });
  afterEach(() => {
    luaVmWrapper.clean();
  });

  describe('add labels', () => {

    it('add bug label', async () => {
      const result = luaVmWrapper.publish('IssueEvent', {
        action: 'edited',
        title: 'error',
        number: 42,
      });
      assert.deepStrictEqual(result, [
        [ 'addLabels', 42, [ 'kind/bug' ]],
      ]);
    });

    it('add labels', async () => {
      luaVmWrapper.publish('IssueEvent', {
        action: 'edited',
        title: 'It is a bug',
        number: 42,
      });
      const result = luaVmWrapper.publish('PullRequestEvent', {
        action: 'opened',
        title: 'It is a feature',
        number: 7,
      });
      assert.deepStrictEqual(result, [
        [ 'addLabels', 42, [ 'kind/bug' ]],
        [ 'addLabels', 7, [ 'kind/feature' ]],
      ]);
    });

  });

});
