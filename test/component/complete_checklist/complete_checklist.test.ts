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

import { prepareLuaTest } from '../LuaTestUtil';
import assert from 'power-assert';

describe('complete-checklist component', () => {
  let luaVmWrapper;
  let newNumber = -1;
  let newIssue: any;
  const checkList = `
Create new components:
- [ ] vote
- [x] auto merge/ approve
- [x] self assign
- [ ] auto complete check list
`;

  before(async () => {
    newIssue = { body: '' };
    newNumber = -1;
    luaVmWrapper = await prepareLuaTest(__dirname, {
      injectMap: new Map().set('getData', () => ({
        pulls: [
          { number: 3, body: checkList },
          { number: 4, body: checkList },
        ],
        issues: [
          { number: 1, body: checkList },
          { number: 2, body: '' },
        ],
      })).set('updateIssue', (num, update) => {
        newNumber = num;
        newIssue = update;
      }).set('updatePull', (num, update) => {
        newNumber = num;
        newIssue = update;
      }),
    });
  });
  afterEach(() => {
    luaVmWrapper.clean();
  });

  describe('exec complete-checklist command', () => {

    it('should not update if pull(param2) not exist', async () => {
      luaVmWrapper.publish('CommandEvent', {
        command: '/complete-checklist',
        params: [ '1', '#100' ],
        from: 'comment',
      });
      assert(newNumber === -1);
      assert(newIssue.body === '');
    });

    it('should not update if issue(param2) not exist', async () => {
      luaVmWrapper.publish('CommandEvent', {
        command: '/complete-checklist',
        params: [ '1', '#100', 'issue' ],
        from: 'pull_comment',
      });
      assert(newNumber === -1);
      assert(newIssue.body === '');
    });

    it('should not update if checklist item already checked', async () => {
      luaVmWrapper.publish('CommandEvent', {
        number: 1,
        command: '/complete-checklist',
        params: [ '2', '#100', 'issue' ],
        from: 'comment',
      });
      assert(newNumber === -1);
      assert(newIssue.body === '');
    });

    it('should not update if item line number not found', async () => {
      luaVmWrapper.publish('CommandEvent', {
        number: 3,
        command: '/complete-checklist',
        params: [ '100', '#100' ],
        from: 'pull_comment',
      });
      assert(newNumber === -1);
      assert(newIssue.body === '');
    });

    it('should update issue', async () => {
      luaVmWrapper.publish('CommandEvent', {
        number: 1,
        command: '/complete-checklist',
        params: [ '1', '#3' ],
        from: 'comment',
      });
      const compare = [ 'Create new components:',
                        '- [x] vote(solved by #3)',
                        '- [x] auto merge/ approve',
                        '- [x] self assign',
                        '- [ ] auto complete check list',
                        '' ];
      const newIssueLines = newIssue.body.split(/\r?\n/);
      for (let i = 0; i < compare.length; i++) {
        assert(compare[i] === newIssueLines[i]);
      }
      assert(newNumber === 1);
    });

    it('should update pull request', async () => {
      luaVmWrapper.publish('CommandEvent', {
        number: 3,
        command: '/complete-checklist',
        params: [ '1', '#1', 'issue' ],
        from: 'pull_comment',
      });
      const compare = [ 'Create new components:',
                        '- [x] vote(solved by #1)',
                        '- [x] auto merge/ approve',
                        '- [x] self assign',
                        '- [ ] auto complete check list',
                        '' ];
      assert(newNumber === 3);
      const newIssueLines = newIssue.body.split(/\r?\n/);
      for (let i = 0; i < compare.length; i++) {
        assert(compare[i] === newIssueLines[i]);
      }
    });

  });

});
