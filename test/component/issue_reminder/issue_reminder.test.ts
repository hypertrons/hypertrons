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

describe('issue_reminder component', () => {
  let luaVmWrapper;

  before(async () => {
    luaVmWrapper = await prepareLuaTest(__dirname, {
      injectMap: new Map().set('getData', () => ({
        issues: [
          // should reply this
          {
            author: 'author',
            number: 1,
            createdAt: 0,
            closedAt: null,
            comments: [],
            labels: [],
          },
          // should not reply closed issue
          {
            author: 'author',
            number: 2,
            createdAt: 0,
            closedAt: 0,
            comments: [],
            labels: [],
          },
          // should not reply commented issue
          {
            author: 'author',
            number: 3,
            createdAt: 0,
            closedAt: null,
            comments: [
              {
                id: 1,
              },
            ],
            labels: [],
          },
          // should not reply issue created within a day
          {
            author: 'author',
            number: 4,
            createdAt: new Date().getTime(),
            closedAt: null,
            comments: [],
            labels: [],
          },
          // should not reply issue created by repliers
          {
            author: 'replier1',
            number: 5,
            createdAt: 0,
            closedAt: null,
            comments: [],
            labels: [],
          },
          // should reply this
          {
            author: 'author',
            number: 6,
            createdAt: 0,
            closedAt: null,
            comments: [],
            labels: [],
          },
          // should not reply issue that contains specific labels
          {
            author: 'author',
            number: 7,
            createdAt: 0,
            closedAt: null,
            comments: [],
            labels: [ 'bug', 'weekly-report' ],
          },
        ],
      })).set('getRoles', () => [
        'replier1',
        'replier2',
      ]).set('toNow', time => {
        return new Date().getTime() - new Date(time).getTime();
      }),
    });
  });
  afterEach(() => {
    luaVmWrapper.clean();
  });

  describe('issue reminder', () => {

    it('only remind specific issue', async () => {
      const result = luaVmWrapper.invoke('Issue reminder');
      assert.deepStrictEqual(result, [
        [ 'addIssueComment', 1, 'This issue has not been replied for 24 hours, please pay attention to this issue: @replier1 @replier2 ' ],
        [ 'addIssueComment', 6, 'This issue has not been replied for 24 hours, please pay attention to this issue: @replier1 @replier2 ' ],
      ]);
    });

  });

});
