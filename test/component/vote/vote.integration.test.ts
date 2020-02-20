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

import { Application, Agent } from 'egg';
import { prepareTestApplication, testClear, waitFor } from '../../Util';
import { initWebhooks, sendToWebhooks, getPayload } from '../../plugin/github/GitHubTestUtil';
import assert from 'power-assert';

describe('Vote Integration Test', () => {
  let app: Application;
  let agent: Agent;
  let testResult: any[];

  before(async () => {
   ({ app, agent } = await prepareTestApplication());
   testResult = await initWebhooks(app);
  });

  after(() => {
    testClear(app, agent);
  });

  it('start a vote', async () => {
    // We need to start a new vote in a comment.
    await sendToWebhooks(app, 'issue_comment.edited', {
      ...getPayload('issue_comment.edited'),
      issue: {
        number: 1,
      },
      comment: {
        user: {
          login: 'liwen-tj',
        },
        url: '',
        body: '/start-vote a,b,c,d anyone 1d',
      },
    });
    await waitFor(30);
    assert.deepStrictEqual(testResult, []); // TODO NOT SURE.
  });

  it('vote', async () => {
    // Vote in a comment.
    await sendToWebhooks(app, 'issue_comment.edited', {
      ...getPayload('issue_comment.edited'),
      issue: {
        number: 1,
      },
      comment: {
        user: {
          login: 'liwen-tj',
        },
        url: '',
        body: '/vote a',
      },
    });
    await waitFor(30);
    assert.deepStrictEqual(testResult, []); // TODO NOT SURE.
  });

});
