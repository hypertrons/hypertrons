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

import { Agent, Application } from 'egg';
import { prepareTestApplication, testClear, waitFor } from '../../Util';
import { sendToWebhooks, getPayload, initWebhooks } from './GitHubTestUtil';
import assert from 'power-assert';

describe('GitHubApp', () => {
  let app: Application;
  let agent: Agent;
  // the params sent to github raw client are save here as an array
  // the first element in array is the api name, like `issues.addLabels`
  let testResult: any[];

  before(async () => {
    ({ app, agent } = await prepareTestApplication());
    testResult = await initWebhooks(app);
  });
  after(() => {
    testClear(app, agent);
  });
  afterEach(() => {
    testResult.length = 0;
  });

  it('installation created and deleted', async () => {
    // pre check
    let client1 = await app.github.getClient(0, 'owner2/repo2');
    let client2 = await app.github.getClient(0, 'owner2/repo3');
    assert.strictEqual(client1, undefined);
    assert.strictEqual(client2, undefined);

    // send created webhooks and check client
    await sendToWebhooks(app, 'installation.created', {
      installation: { id: 1 },
      repositories: [
        {
          id: 2,
          full_name: 'owner2/repo2',
        },
        {
          id: 3,
          full_name: 'owner2/repo3',
        },
      ],
    });
    await waitFor(30);
    client1 = await app.github.getClient(0, 'owner2/repo2');
    client2 = await app.github.getClient(0, 'owner2/repo3');
    assert.strictEqual((client1 as any).fullName, 'owner2/repo2');
    assert.strictEqual((client2 as any).fullName, 'owner2/repo3');

    // send deleted webhooks and check client
    await sendToWebhooks(app, 'installation.deleted', {
      installation: {
        account: {
          login: 'owner2',
        },
      },
    });
    await waitFor(30);
    client1 = await app.github.getClient(0, 'owner2/repo2');
    client2 = await app.github.getClient(0, 'owner2/repo3');
    assert.strictEqual(client1, undefined);
    assert.strictEqual(client2, undefined);
  });

  it('installation repos added and removed', async () => {
    // pre check
    let client1 = await app.github.getClient(0, 'owner2/repo2');
    let client2 = await app.github.getClient(0, 'owner2/repo3');
    assert.strictEqual(client1, undefined);
    assert.strictEqual(client2, undefined);

    // send created webhooks and check client
    await sendToWebhooks(app, 'installation_repositories.added', {
      installation: { id: 1 },
      repositories_added: [
        {
          id: 2,
          full_name: 'owner2/repo2',
        },
        {
          id: 3,
          full_name: 'owner2/repo3',
        },
      ],
    });
    await waitFor(30);
    client1 = await app.github.getClient(0, 'owner2/repo2');
    client2 = await app.github.getClient(0, 'owner2/repo3');
    assert.strictEqual((client1 as any).fullName, 'owner2/repo2');
    assert.strictEqual((client2 as any).fullName, 'owner2/repo3');

    // send deleted webhooks and check client
    await sendToWebhooks(app, 'installation_repositories.removed', {
      repositories_removed: [
        {
          id: 2,
          full_name: 'owner2/repo2',
        },
        {
          id: 3,
          full_name: 'owner2/repo3',
        },
      ],
    });
    await waitFor(30);
    client1 = await app.github.getClient(0, 'owner2/repo2');
    client2 = await app.github.getClient(0, 'owner2/repo3');
    assert.strictEqual(client1, undefined);
    assert.strictEqual(client2, undefined);
  });

  it('issue opened lead to difficulty/5 label added', async () => {
    await sendToWebhooks(app, 'issues.opened', {
      ...getPayload('issues.opened'),
      issue: {
        id: 2048,
        user: {
          login: 'GoodMeowing',
        },
        number: 1,
        created_at: 0,
        updated_at: 0,
        closed_at: null,
        title: 'title',
        body: '/difficulty 5',
        labels: [
          {
            name: 'label_name',
          },
        ],
      },
    });
    await waitFor(30);
    assert.deepStrictEqual(testResult, [
      [ 'issues.addLabels',
        {
          owner: 'owner',
          repo: 'repo',
          issue_number: 1,
          labels: [ 'difficulty/5' ],
        },
      ],
    ]);
  });

  it('issue comment edited lead to self assign', async () => {
    await sendToWebhooks(app, 'issue_comment.edited', {
      ...getPayload('issue_comment.edited'),
      comment: {
        id: 2048,
        user: {
          login: 'GoodMeowing',
        },
        url: '',
        created_at: 0,
        updated_at: 0,
        body: '/self-assign',
      },
    });
    await waitFor(30);
    assert.deepStrictEqual(testResult, [
      [ 'issues.addAssignees',
        {
          owner: 'owner',
          repo: 'repo',
          issue_number: 1,
          assignees: [ 'GoodMeowing' ],
        },
      ],
    ]);
  });

  it('pr review edited lead to approve label added', async () => {
    await sendToWebhooks(app, 'pull_request_review.edited', {
      ...getPayload('pull_request_review.edited'),
      review: {
        id: 2048,
        user: {
          login: 'GoodMeowing',
        },
        url: '',
        submitted_at: 0,
        updated_at: 0,
        body: '/approve',
      },
    });
    await waitFor(30);
    assert.deepStrictEqual(testResult, [
      [ 'issues.addLabels',
        {
          owner: 'owner',
          repo: 'repo',
          issue_number: 1,
          labels: [ 'pull/approved' ],
        },
      ],
    ]);
  });

  it('pr review comment edited lead to approve label added', async () => {
    await sendToWebhooks(app, 'pull_request_review_comment.edited', {
      ...getPayload('pull_request_review_comment.edited'),
      comment: {
        id: 2048,
        user: {
          login: 'GoodMeowing',
        },
        url: '',
        created_at: 0,
        updated_at: 0,
        body: '/approve',
      },
    });
    await waitFor(30);
    assert.deepStrictEqual(testResult, [
      [ 'issues.addLabels',
        {
          owner: 'owner',
          repo: 'repo',
          issue_number: 1,
          labels: [ 'pull/approved' ],
        },
      ],
    ]);
  });

});
