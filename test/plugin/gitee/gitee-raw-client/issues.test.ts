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

import { Issues } from '../../../../app/plugin/gitee/gitee-raw-client/issues';
import nock from 'nock';
import assert from 'power-assert';

describe('gitee raw client issues', () => {
  let issues: Issues;

  before(async () => {
    issues = new Issues('');
  });
  /**
   * If want to do online test, set a real token,
   * uncomment next a few codes,
   * then comment the 'nock' part
   */
  // afterEach(async () => {
  //   nock.cleanAll();
  //   nock.enableNetConnect();
  // });

  it('get all issues', async () => {
    nock('https://gitee.com')
      .get('/api/v5/repos/goodmeowing/push_test/issues')
      .reply(200, '{"hi": 123}');
    const result = await issues.all({
      owner: 'goodmeowing',
      repo: 'push_test',
    });
    assert.deepStrictEqual(result, { hi: 123 });
  });

  it('get all issue comments', async () => {
    nock('https://gitee.com')
      .get('/api/v5/repos/goodmeowing/push_test/issues/comments')
      .query({
        page: 1,
        per_page: 100,
      })
      .reply(200, '[{"first": 1}]', new Map().set('total_page', '2'));
    nock('https://gitee.com')
      .get('/api/v5/repos/goodmeowing/push_test/issues/comments')
      .query({
        page: 2,
        per_page: 100,
      })
      .reply(200, '[{"second": 2}]', new Map().set('total_page', '2'));
    const result = await issues.allComments({
      owner: 'goodmeowing',
      repo: 'push_test',
    });
    assert.deepStrictEqual(result, [{ first: 1 }, { second: 2 }]);
  });

  it('create issue', async () => {
    nock('https://gitee.com')
      .post('/api/v5/repos/goodmeowing/issues')
      .reply(200, '{"hi": 123}');
    const result = await issues.create({
      owner: 'goodmeowing',
      repo: 'push_test',
      title: 'test issue',
      body: 'test body',
      labels: [ 'bug', 'doc' ],
    });
    assert.deepStrictEqual(result, { hi: 123 });
  });

  it('update issue', async () => {
    nock('https://gitee.com')
      .get('/api/v5/repos/goodmeowing/push_test/issues/I199Y9')
      .reply(200, '{"labels":[{"name":"bug"},{"name":"doc"}]}');
    nock('https://gitee.com')
      .patch('/api/v5/repos/goodmeowing/issues/I199Y9')
      .reply(200, '{"hi": 123}');
    const result = await issues.update({
      owner: 'goodmeowing',
      repo: 'push_test',
      number: 'I199Y9',
      title: 'test issue changed',
      body: 'test body',
    });
    assert.deepStrictEqual(result, { hi: 123 });
  });

  it('create issue comment', async () => {
    nock('https://gitee.com')
      .post('/api/v5/repos/goodmeowing/push_test/issues/I199Y9/comments')
      .reply(200, '{"hi": 123}');
    const result = await issues.createComment({
      owner: 'goodmeowing',
      repo: 'push_test',
      number: 'I199Y9',
      body: 'comment body',
    });
    assert.deepStrictEqual(result, { hi: 123 });
  });

  it('list repo labels', async () => {
    nock('https://gitee.com')
      .get('/api/v5/repos/goodmeowing/push_test/labels')
      .reply(200, '{"hi": 123}');
    const result = await issues.listLabelsForRepo({
      owner: 'goodmeowing',
      repo: 'push_test',
    });
    assert.deepStrictEqual(result, { hi: 123 });
  });

  it('add issue labels', async () => {
    nock('https://gitee.com')
      .post('/api/v5/repos/goodmeowing/push_test/issues/I199Y9/labels')
      .reply(200, '{"hi": 123}');
    const result = await issues.addLabel({
      owner: 'goodmeowing',
      repo: 'push_test',
      number: 'I199Y9',
      labels: [ 'pull/approved' ],
    });
    assert.deepStrictEqual(result, { hi: 123 });
  });

  it('create repo labels', async () => {
    nock('https://gitee.com')
      .post('/api/v5/repos/goodmeowing/push_test/labels')
      .reply(200, '{"hi": 123}');
    const result = await issues.createLabel({
      owner: 'goodmeowing',
      repo: 'push_test',
      name: 'labelForTest',
      color: '000000',
    });
    assert.deepStrictEqual(result, { hi: 123 });
  });

  it('update repo labels', async () => {
    nock('https://gitee.com')
      .patch('/api/v5/repos/goodmeowing/push_test/labels/labelForTest')
      .reply(200, '{"hi": 123}');
    const result = await issues.updateLabel({
      owner: 'goodmeowing',
      repo: 'push_test',
      current_name: 'labelForTest',
      name: 'labelForTestChanged',
    });
    assert.deepStrictEqual(result, { hi: 123 });
  });

});
