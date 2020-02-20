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
import { initWebhooks, sendToWebhooks } from './gitee-test-util';
import { readFileSync } from 'fs';
import { join } from 'path';
import { convertIssueNumber2Number, convertIssueNumber2String } from '../../../app/plugin/gitee/util';
import assert from 'power-assert';

describe('GiteeApp', () => {
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

  it('issue opened lead to difficulty/5 label added', async () => {
    const noteHookPath = join(__dirname, './data/webhook/issue-hook-open.json');
    const request = JSON.parse(readFileSync(noteHookPath).toString());

    await sendToWebhooks(app, request.headers, request.payload);
    await waitFor(30);
    assert.deepStrictEqual(testResult, [
      [ 'addLabels', 734957508981, [ 'kind/bug', 'area/document' ]],
      [ 'assign', 734957508981, 'GoodMeowing' ],
    ]);
  });

  it('push hook', async () => {
    const noteHookPath = join(__dirname, './data/webhook/push-hook.json');
    const request = JSON.parse(readFileSync(noteHookPath).toString());

    await sendToWebhooks(app, request.headers, request.payload);
    await waitFor(30);
    assert.deepStrictEqual(testResult, []);
  });

  it('merge request opened', async () => {
    const noteHookPath = join(__dirname, './data/webhook/merge-request-hook-open.json');
    const request = JSON.parse(readFileSync(noteHookPath).toString());

    await sendToWebhooks(app, request.headers, request.payload);
    await waitFor(30);
    assert.deepStrictEqual(testResult, [[ 'addLabels', 1, [ 'kind/bug' ]]]);
  });

  it('merge request closed', async () => {
    const noteHookPath = join(__dirname, './data/webhook/merge-request-hook-close.json');
    const request = JSON.parse(readFileSync(noteHookPath).toString());

    await sendToWebhooks(app, request.headers, request.payload);
    await waitFor(30);
    assert.deepStrictEqual(testResult, []);
  });

  it('issue comment opened', async () => {
    const noteHookPath = join(__dirname, './data/webhook/note-hook-comment-issue.json');
    const request = JSON.parse(readFileSync(noteHookPath).toString());

    await sendToWebhooks(app, request.headers, request.payload);
    await waitFor(30);
    assert.deepStrictEqual(testResult, [[ 'assign', 734957508981, 'goodmeowing' ]]);
  });

  it('issue comment edited', async () => {
    const noteHookPath = join(__dirname, './data/webhook/note-hook-edited-issue.json');
    const request = JSON.parse(readFileSync(noteHookPath).toString());

    await sendToWebhooks(app, request.headers, request.payload);
    await waitFor(30);
    assert.deepStrictEqual(testResult, [[ 'assign', 734957487868, 'goodmeowing' ]]);
  });

  it('issue comment closed', async () => {
    const noteHookPath = join(__dirname, './data/webhook/note-hook-deleted-issue.json');
    const request = JSON.parse(readFileSync(noteHookPath).toString());

    await sendToWebhooks(app, request.headers, request.payload);
    await waitFor(30);
    assert.deepStrictEqual(testResult, []);
  });

  it('convert string and number into each other', async () => {
    assert.deepStrictEqual(convertIssueNumber2Number('I192YQ'), 734957508981);
    assert.deepStrictEqual(convertIssueNumber2String(734957508981), 'I192YQ');
  });

});
