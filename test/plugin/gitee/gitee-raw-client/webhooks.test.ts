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
import { Webhooks } from '../../../../app/plugin/gitee/gitee-raw-client/webhooks';

describe('gitee raw client repos', () => {
  let webhooks: Webhooks;

  before(async () => {
    webhooks = new Webhooks('');
  });

  it('get all webhooks', async () => {
    nock('https://gitee.com')
      .get('/api/v5/repos/goodmeowing/push_test/hooks')
      .reply(200, '{"hi": 123}');
    const result = await webhooks.all({
      owner: 'goodmeowing',
      repo: 'push_test',
    });
    assert.deepStrictEqual(result, { hi: 123 });
  });

  it('create webhook', async () => {
    nock('https://gitee.com')
      .post('/api/v5/repos/goodmeowing/push_test/hooks')
      .reply(200, '{"hi": 123}');
    const result = await webhooks.addWebhook({
      owner: 'goodmeowing',
      repo: 'push_test',
      url: 'https://smee.io/7ynZ7HZRRiAcuAx',
    });
    assert.deepStrictEqual(result, { hi: 123 });
  });

});
