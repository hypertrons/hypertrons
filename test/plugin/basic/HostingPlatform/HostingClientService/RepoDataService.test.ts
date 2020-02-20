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

import { prepareTestApplication, testClear } from '../../../../Util';
import { Application, Agent } from 'egg';
import assert from 'power-assert';
import { deepEqual } from 'assert';
import { GitHubClient } from '../../../../../app/plugin/github/GitHubClient';
import { waitUntil } from '../../../../../app/basic/Utils';

describe('RepoDataService', () => {
  let app: Application;
  let agent: Agent;
  let client: GitHubClient;
  let count = 0;

  class MockHostingBase {
    getName(): string {
      return 'name';
    }
    getConfig(): any {
      return {};
    }
  }

  beforeEach(async () => {
    // ({ app, agent } = await prepareTestApplication());
    count = 0;
  });
  afterEach(() => {
    // testClear(app, agent);
  });

  describe('onStart()', () => {
    before(async () => {
      ({ app, agent } = await prepareTestApplication());
      client = new GitHubClient('wsl/test', 0, app, null as any, new MockHostingBase() as any);
      await waitUntil(() => client.getStarted(), { interval: 10 });
      client.repoDataService.updatePull = () => count++;
      client.repoDataService.updateLabel = () => count++;
      client.repoDataService.updateIssueComment = () => count++;
      client.repoDataService.updatePullComment = () => count++;
      client.repoDataService.updateIssue = () => count++;
    });
    after(() => {
      testClear(app, agent);
    });

    // PullRequestEvent
    it('should call updatePull if PullRequestEvent.pullRequest is not empty', async () => {
      await client.eventService.consume('PullRequestEvent', 'all', { pullRequest: {} } as any);
      assert(count === 1);
    });
    it('should not call updatePull if PullRequestEvent.pullRequest is empty', async () => {
      await client.eventService.consume('PullRequestEvent', 'all', undefined as any);
      assert(count === 0);
    });
    // LabelUpdateEvent
    it('should call updateLabel if LabelUpdateEvent.labelName is not empty', async () => {
      await client.eventService.consume('LabelUpdateEvent', 'all', { labelName: 'name' } as any);
      assert(count === 1);
    });
    it('should not call updateLabel if LabelUpdateEvent.labelName is empty', async () => {
      await client.eventService.consume('LabelUpdateEvent', 'all', { action: '' } as any);
      assert(count === 0);
    });
    // CommentUpdateEvent
    it('should call updateComment if CommentUpdateEvent.comment is not empty', async () => {
      await client.eventService.consume('CommentUpdateEvent', 'all', { comment: {} } as any);
      assert(count === 1);
    });
    it('should call updateComment if CommentUpdateEvent.comment is not empty', async () => {
      await client.eventService.consume('CommentUpdateEvent', 'all', { isIssue: true, comment: {} } as any);
      assert(count === 1);
    });
    it('should not call updateComment if CommentUpdateEvent.comment is empty', async () => {
      await client.eventService.consume('CommentUpdateEvent', 'all', { action: '' } as any);
      assert(count === 0);
    });
    // IssueEvent
    it('should call updateIssue if IssueEvent.issue is not empty', async () => {
      await client.eventService.consume('IssueEvent', 'all', { issue: {} } as any);
      assert(count === 1);
    });
    it('should not call updateIssue if IssueEvent.issue is empty', async () => {
      await client.eventService.consume('IssueEvent', 'all', { action: '' } as any);
      assert(count === 0);
    });
    // HostingClientRepoDataInitedEvent
    it('should update data if receive HostingClientRepoDataInitedEvent', async () => {
      client.repoDataService.setRepoData(undefined as any);
      await client.eventService.consume('HostingClientRepoDataInitedEvent', 'all', { repoData: { foo: 'bar' } } as any);
      deepEqual(client.repoDataService.getRepoData(), { foo: 'bar' });
    });
  });

  describe('syncData()', () => {
    before(async () => {
      ({ app, agent } = await prepareTestApplication());
      client = new GitHubClient('wsl/test', 0, app, null as any, new MockHostingBase() as any);
      await waitUntil(() => client.getStarted(), { interval: 10 });
    });
    after(() => {
      testClear(app, agent);
    });

    it('right case', async () => {
      let type: any;
      let param: any;
      client.eventService.publish = async (pType: any, _: new (...args: any) => any, pParam: Partial<any>) => {
        type = pType;
        param = pParam;
      };
      client.repoDataService.setRepoData({ foo: 'bar' } as any);

      await client.repoDataService.syncData();
      assert(type === 'all');
      deepEqual(param, { installationId: 0, fullName: 'wsl/test', repoData: { foo: 'bar' } });
    });
  });

  describe('get() and set()', () => {
    before(async () => {
      ({ app, agent } = await prepareTestApplication());
      client = new GitHubClient('wsl/test', 0, app, null as any, new MockHostingBase() as any);
      await waitUntil(() => client.getStarted(), { interval: 10 });
    });
    after(() => {
      testClear(app, agent);
    });

    it('should get undefined if not set repoData yet', async () => {
      assert(client.getRepoData() === undefined);
    });

    it('should get value that passed in', async () => {
      client.repoDataService.setRepoData({} as any);
      deepEqual(client.repoDataService.getRepoData(), {});
    });
  });

  describe('updateLabel()', () => {
    before(async () => {
      ({ app, agent } = await prepareTestApplication());
      client = new GitHubClient('wsl/test', 0, app, null as any, new MockHostingBase() as any);
      await waitUntil(() => client.getStarted(), { interval: 10 });
    });
    after(() => {
      testClear(app, agent);
    });

    it('should not trigger if not set repoData yet', async () => {
      client.repoDataService.setRepoData(undefined as any);
      client.repoDataService.updateLabel('edited', 'test111');
      assert(client.repoDataService.getRepoData() === undefined);
    });

    it('should not trigger if action === created', async () => {
      const data = { issues: [{ labels: [ 'bug' ] }], pulls: [{ labels: [ 'bug' ] }] };
      client.repoDataService.setRepoData(data as any);
      client.repoDataService.updateLabel('created', 'add label');

      const compare = { issues: [{ labels: [ 'bug' ] }], pulls: [{ labels: [ 'bug' ] }] };
      deepEqual(client.repoDataService.getRepoData(), compare);
    });

    it('test update action', async () => {
      const data = { issues: [{ labels: [ 'bug' ] }], pulls: [{ labels: [ 'bug' ] }] };
      client.repoDataService.setRepoData(data as any);
      client.repoDataService.updateLabel('edited', 'bugs', 'bug');

      const compare = { issues: [{ labels: [ 'bugs' ] }], pulls: [{ labels: [ 'bugs' ] }] };
      deepEqual(client.repoDataService.getRepoData(), compare);
    });

    it('should not update if from is empty', async () => {
      const data = { issues: [{ labels: [ 'bug' ] }], pulls: [{ labels: [ 'bug' ] }] };
      client.repoDataService.setRepoData(data as any);
      client.repoDataService.updateLabel('edited', 'bugs');

      const compare = { issues: [{ labels: [ 'bug' ] }], pulls: [{ labels: [ 'bug' ] }] };
      deepEqual(client.repoDataService.getRepoData(), compare);
    });

    it('test delete option', async () => {
      const data = { issues: [{ labels: [ 'bug', 'test' ] }], pulls: [{ labels: [ 'bug', 'test' ] }] };
      client.repoDataService.setRepoData(data as any);
      client.repoDataService.updateLabel('deleted', 'bug');

      const compare = { issues: [{ labels: [ 'test' ] }], pulls: [{ labels: [ 'test' ] }] };
      deepEqual(client.repoDataService.getRepoData(), compare);
    });

    it('should not delete if label not exist', async () => {
      const data = { issues: [{ labels: [ 'bug', 'test' ] }], pulls: [{ labels: [ 'bug', 'test' ] }] };
      client.repoDataService.setRepoData(data as any);
      client.repoDataService.updateLabel('deleted', 'not exist');

      const compare = { issues: [{ labels: [ 'bug', 'test' ] }], pulls: [{ labels: [ 'bug', 'test' ] }] };
      deepEqual(client.repoDataService.getRepoData(), compare);
    });
  });

  describe('updateIssueComment()', () => {
    before(async () => {
      ({ app, agent } = await prepareTestApplication());
      client = new GitHubClient('wsl/test', 0, app, null as any, new MockHostingBase() as any);
      await waitUntil(() => client.getStarted(), { interval: 10 });
    });
    after(() => {
      testClear(app, agent);
    });

    it('should not update if not set repoData yet', async () => {
      client.repoDataService.setRepoData(undefined as any);
      client.repoDataService.updateIssueComment('edited', 1, null as any);
      assert(client.repoDataService.getRepoData() === undefined);
    });

    it('should not update if issue number not match', async () => {
      const data = { issues: [{ number: 1, comments: [{ id: 1 }] }] };
      client.repoDataService.setRepoData(data as any);
      client.repoDataService.updateIssueComment('created', -1, null as any);

      const compare = { issues: [{ number: 1, comments: [{ id: 1 }] }] };
      deepEqual(client.repoDataService.getRepoData(), compare);
    });

    it('test deleted action', async () => {
      const data = { issues: [{ number: 1, comments: [{ id: 1 }] }] };
      client.repoDataService.setRepoData(data as any);
      client.repoDataService.updateIssueComment('deleted', 1, { id: 1 } as any);
      assert(client.repoDataService.getRepoData().issues[0].comments.length === 0);
    });

    it('should not delete if comment.id not match', async () => {
      const data = { issues: [{ number: 1, comments: [{ id: 1 }] }] };
      client.repoDataService.setRepoData(data as any);
      client.repoDataService.updateIssueComment('deleted', 1, { id: 3 } as any);
      assert(client.repoDataService.getRepoData().issues[0].comments.length === 1);
    });

    it('test created action', async () => {
      const data = { issues: [{ number: 1, comments: [{ id: 1 }] }] };
      client.repoDataService.setRepoData(data as any);
      client.repoDataService.updateIssueComment('created', 1, { id: 2 } as any);
      assert(client.repoDataService.getRepoData().issues[0].comments.length === 2);
    });

    it('test edited action', async () => {
      const data = { issues: [{ number: 1, comments: [{ id: 1, body: 'body' }] }] };
      client.repoDataService.setRepoData(data as any);
      client.repoDataService.updateIssueComment('edited', 1, { id: 1, body: 'new body' } as any);
      assert(client.repoDataService.getRepoData().issues[0].comments[0].body === 'new body');
    });

    it('should not update if comment.id not match', async () => {
      const data = { issues: [{ number: 1, comments: [{ id: 1, body: 'body' }] }] };
      client.repoDataService.setRepoData(data as any);
      client.repoDataService.updateIssueComment('edited', 1, { id: 2 } as any);
      assert(client.repoDataService.getRepoData().issues[0].comments[0].body === 'body');
    });
  });

  describe('updatePullComment()', () => {
    before(async () => {
      ({ app, agent } = await prepareTestApplication());
      client = new GitHubClient('wsl/test', 0, app, null as any, new MockHostingBase() as any);
      await waitUntil(() => client.getStarted(), { interval: 10 });
    });
    after(() => {
      testClear(app, agent);
    });

    it('should not update if not set repoData yet', async () => {
      client.repoDataService.setRepoData(undefined as any);
      client.repoDataService.updatePullComment('edited', 1, null as any);
      assert(client.repoDataService.getRepoData() === undefined);
    });

    it('should not update if pull number not match', async () => {
      const data = { pulls: [{ number: 1, comments: [{ id: 1 }] }] };
      client.repoDataService.setRepoData(data as any);
      client.repoDataService.updatePullComment('created', -1, null as any);

      const compare = { pulls: [{ number: 1, comments: [{ id: 1 }] }] };
      deepEqual(client.repoDataService.getRepoData(), compare);
    });

    it('test deleted action', async () => {
      const data = { pulls: [{ number: 1, comments: [{ id: 1 }] }] };
      client.repoDataService.setRepoData(data as any);
      client.repoDataService.updatePullComment('deleted', 1, { id: 1 } as any);
      assert(client.repoDataService.getRepoData().pulls[0].comments.length === 0);
    });

    it('should not delete if comment.id not match', async () => {
      const data = { pulls: [{ number: 1, comments: [{ id: 1 }] }] };
      client.repoDataService.setRepoData(data as any);
      client.repoDataService.updatePullComment('deleted', 1, { id: 3 } as any);
      assert(client.repoDataService.getRepoData().pulls[0].comments.length === 1);
    });

    it('test created action', async () => {
      const data = { pulls: [{ number: 1, comments: [{ id: 1 }] }] };
      client.repoDataService.setRepoData(data as any);
      client.repoDataService.updatePullComment('created', 1, { id: 2 } as any);
      assert(client.repoDataService.getRepoData().pulls[0].comments.length === 2);
    });

    it('test edited action', async () => {
      const data = { pulls: [{ number: 1, comments: [{ id: 1, body: 'body' }] }] };
      client.repoDataService.setRepoData(data as any);
      client.repoDataService.updatePullComment('edited', 1, { id: 1, body: 'new body' } as any);
      assert(client.repoDataService.getRepoData().pulls[0].comments[0].body === 'new body');
    });

    it('should not update if comment.id not match', async () => {
      const data = { pulls: [{ number: 1, comments: [{ id: 1, body: 'body' }] }] };
      client.repoDataService.setRepoData(data as any);
      client.repoDataService.updatePullComment('edited', 1, { id: 2 } as any);
      assert(client.repoDataService.getRepoData().pulls[0].comments[0].body === 'body');
    });
  });

  describe('updatePull()', () => {
    before(async () => {
      ({ app, agent } = await prepareTestApplication());
      client = new GitHubClient('wsl/test', 0, app, null as any, new MockHostingBase() as any);
      await waitUntil(() => client.getStarted(), { interval: 10 });
    });
    after(() => {
      testClear(app, agent);
    });

    it('should not update if not set repoData yet', async () => {
      client.repoDataService.setRepoData(undefined as any);
      client.repoDataService.updatePull('updated', {} as any);
      assert(client.repoDataService.getRepoData() === undefined);
    });

    it('test opened action', async () => {
      const data = { pulls: [{ id: 2 }] };
      client.repoDataService.setRepoData(data as any);
      client.repoDataService.updatePull('opened', { id: 2 } as any);
      assert(client.repoDataService.getRepoData().pulls.length === 2);
    });

    it('should not update if pull.id not match', async () => {
      const data = { pulls: [{ id: 1, author: 'a' }] };
      client.repoDataService.setRepoData(data as any);
      client.repoDataService.updatePull('updated', { id: 2, author: 'b' } as any);

      const compare = { pulls: [{ id: 1, author: 'a' }] };
      deepEqual(client.repoDataService.getRepoData(), compare);
    });

    it('right case', async () => {
      const data = { pulls: [{ id: 1, author: 'a' }] };
      client.repoDataService.setRepoData(data as any);
      client.repoDataService.updatePull('updated', { id: 1, author: 'b' } as any);
      assert(client.repoDataService.getRepoData().pulls[0].author === 'b');
    });
  });

  describe('updateIssue()', () => {
    before(async () => {
      ({ app, agent } = await prepareTestApplication());
      client = new GitHubClient('wsl/test', 0, app, null as any, new MockHostingBase() as any);
      await waitUntil(() => client.getStarted(), { interval: 10 });
    });
    after(() => {
      testClear(app, agent);
    });

    it('should not update if not set repoData yet', async () => {
      client.repoDataService.setRepoData(undefined as any);
      client.repoDataService.updateIssue('updated', {} as any);
      assert(client.repoDataService.getRepoData() === undefined);
    });

    it('test opened action', async () => {
      const data = { issues: [{ id: 2 }] };
      client.repoDataService.setRepoData(data as any);
      client.repoDataService.updateIssue('opened', { id: 2 } as any);
      assert(client.repoDataService.getRepoData().issues.length === 2);
    });

    it('should not update if pull.id not match', async () => {
      const data = { issues: [{ id: 1, author: 'a' }] };
      client.repoDataService.setRepoData(data as any);
      client.repoDataService.updateIssue('updated', { id: 2, author: 'b' } as any);

      const compare = { issues: [{ id: 1, author: 'a' }] };
      deepEqual(client.repoDataService.getRepoData(), compare);
    });

    it('right case', async () => {
      const data = { issues: [{ id: 1, author: 'a' }] };
      client.repoDataService.setRepoData(data as any);
      client.repoDataService.updateIssue('updated', { id: 1, author: 'b' } as any);
      assert(client.repoDataService.getRepoData().issues[0].author === 'b');
    });
  });
});
