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
import { Repos } from '../../../../app/plugin/gitee/gitee-raw-client/repos';

describe('gitee raw client repos', () => {
  let repos: Repos;

  before(async () => {
    repos = new Repos('');
  });

  it('get file contents', async () => {
    nock('https://gitee.com')
      .get('/api/v5/repos/goodmeowing/push_test/contents/README.md')
      .reply(200, '{"hi": 123}');
    const result = await repos.getContents({
      owner: 'goodmeowing',
      repo: 'push_test',
      path: 'README.md',
    });
    assert.deepStrictEqual(result, { hi: 123 });
  });

  it('list user repo', async () => {
    nock('https://gitee.com')
      .get('/api/v5/user/repos')
      .query({
        visibility: 'all',
        affiliation: 'admin',
        per_page: 100,
      })
      .reply(200, '{"hi": 123}');
    const result = await repos.listUserRepos();
    assert.deepStrictEqual(result, { hi: 123 });
  });

  it('get repo data', async () => {
    nock('https://gitee.com')
      .get('/api/v5/repos/goodmeowing/push_test')
      .reply(200, '{"hi": 123}');
    const result = await repos.getRepoData({
      owner: 'goodmeowing',
      repo: 'push_test',
    });
    assert.deepStrictEqual(result, { hi: 123 });
  });

  it('get contributors', async () => {
    nock('https://gitee.com')
      .get('/api/v5/repos/goodmeowing/push_test/contributors')
      .reply(200, '{"hi": 123}');
    const result = await repos.getContributors({
      owner: 'goodmeowing',
      repo: 'push_test',
    });
    assert.deepStrictEqual(result, { hi: 123 });
  });

  it('get forks', async () => {
    nock('https://gitee.com')
      .get('/api/v5/repos/goodmeowing/push_test/forks')
      .reply(200, '{"hi": 123}');
    const result = await repos.getForks({
      owner: 'goodmeowing',
      repo: 'push_test',
    });
    assert.deepStrictEqual(result, { hi: 123 });
  });

});
