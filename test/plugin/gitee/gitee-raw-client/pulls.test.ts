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

import nock from 'nock';
import assert from 'power-assert';
import { Pulls } from '../../../../app/plugin/gitee/gitee-raw-client/pulls';

describe('gitee raw client pulls', () => {
  let pulls: Pulls;

  before(async () => {
    pulls = new Pulls('');
  });
  // afterEach(async () => {
  //   nock.cleanAll();
  //   nock.enableNetConnect();
  // });

  it('get all MRs', async () => {
    nock('https://gitee.com')
      .get('/api/v5/repos/goodmeowing/push_test/pulls')
      .reply(200, '{"hi": 123}');
    const result = await pulls.all({
      owner: 'goodmeowing',
      repo: 'push_test',
    });
    assert.deepStrictEqual(result, { hi: 123 });
  });

  it('get all MR comments', async () => {
    nock('https://gitee.com')
      .get('/api/v5/repos/goodmeowing/push_test/pulls/comments')
      .query({
        page: 1,
        per_page: 100,
      })
      .reply(200, '[{"first": 1}]', new Map().set('total_page', '2'));
    nock('https://gitee.com')
      .get('/api/v5/repos/goodmeowing/push_test/pulls/comments')
      .query({
        page: 2,
        per_page: 100,
      })
      .reply(200, '[{"second": 2}]', new Map().set('total_page', '2'));
    const result = await pulls.allComments({
      owner: 'goodmeowing',
      repo: 'push_test',
    });
    assert.deepStrictEqual(result, [{ first: 1 }, { second: 2 }]);
  });

  it('update MR', async () => {
    nock('https://gitee.com')
      .patch('/api/v5/repos/goodmeowing/push_test/pulls/2')
      .reply(200, '{"hi": 123}');
    const result = await pulls.update({
      owner: 'goodmeowing',
      repo: 'push_test',
      number: 2,
      title: 'title changed',
    });
    assert.deepStrictEqual(result, { hi: 123 });
  });

  it('merge MR', async () => {
    nock('https://gitee.com')
      .put('/api/v5/repos/goodmeowing/push_test/pulls/2/merge')
      .reply(200, '{"hi": 123}');
    const result = await pulls.merge({
      owner: 'goodmeowing',
      repo: 'push_test',
      number: 2,
    });
    assert.deepStrictEqual(result, { hi: 123 });
  });

  it('replace labels for MR', async () => {
    nock('https://gitee.com')
      .put('/api/v5/repos/goodmeowing/push_test/pulls/2/labels')
      .reply(200, '{"hi": 123}');
    const result = await pulls.addLabel({
      owner: 'goodmeowing',
      repo: 'push_test',
      number: 2,
      labels: [ 'bug', 'doc' ],
    });
    assert.deepStrictEqual(result, { hi: 123 });
  });

});
