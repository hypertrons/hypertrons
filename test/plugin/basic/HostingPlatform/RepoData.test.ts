// Copyright 2019 Xlab
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

// import assert from 'assert';
import { prepareTestApplication, testClear } from '../../../Util';
import { Application, Agent } from 'egg';
import { RepoData } from '../../../../app/basic/HostingPlatform/RepoData';
import assert from 'power-assert';
import { deepEqual } from 'assert';

describe('RepoData', () => {
  let app: Application;
  let agent: Agent;

  const repoDataTemplate = new RepoData();

  const testUpdateLabelData = {
    issues: [{ labels: [ 'bug', 'test' ] }],
    pulls: [{ labels: [ 'bug', 'test' ] }],
  };

  beforeEach(async () => {
    ({ app, agent } = await prepareTestApplication());
  });

  afterEach(() => {
    testClear(app, agent);
  });

  describe('get and set RepoData', () => {
    it('should get undefined if not set repoData yet', async () => {
      assert(new RepoData().getRepoData() === undefined);
    });

    it('should get value that passed in', async () => {
      const repoData = new RepoData();
      repoData.setRepoData({} as any);
      deepEqual(repoData.getRepoData(), {});
    });
  });

  describe('updateLabel', () => {
    it('should not trigger if not set repoData yet', async () => {
      const repoData = new RepoData();
      repoData.updateLabel('created', 'test111');
      assert(repoData.getRepoData() === undefined);
    });

    it('should not trigger if action === created', async () => {
      const data = {
        issues: [{ labels: [ 'bug', 'test' ] }],
        pulls: [{ labels: [ 'bug', 'test' ] }],
      };
      repoDataTemplate.setRepoData(data as any);
      repoDataTemplate.updateLabel('created', 'add label');
      deepEqual(repoDataTemplate.getRepoData(), testUpdateLabelData);
    });

    it('test update action', async () => {
      const data = {
        issues: [{ labels: [ 'bug', 'test' ] }],
        pulls: [{ labels: [ 'bug', 'test' ] }],
      };
      const test = {
        issues: [{ labels: [ 'bugs', 'test' ] }],
        pulls: [{ labels: [ 'bugs', 'test' ] }],
      };
      repoDataTemplate.setRepoData(data as any);
      repoDataTemplate.updateLabel('edited', 'bugs', 'bug');
      deepEqual(repoDataTemplate.getRepoData(), test);
    });

    it('should not update if from is empty', async () => {
      const data = {
        issues: [{ labels: [ 'bug', 'test' ] }],
        pulls: [{ labels: [ 'bug', 'test' ] }],
      };
      repoDataTemplate.setRepoData(data as any);
      repoDataTemplate.updateLabel('edited', 'bugs');
      deepEqual(repoDataTemplate.getRepoData(), testUpdateLabelData);
    });

    it('test delete option', async () => {
      const data = {
        issues: [{ labels: [ 'bug', 'test' ] }],
        pulls: [{ labels: [ 'bug', 'test' ] }],
      };
      const test = {
        issues: [{ labels: [ 'test' ] }],
        pulls: [{ labels: [ 'test' ] }],
      };
      repoDataTemplate.setRepoData(data as any);
      repoDataTemplate.updateLabel('deleted', 'bug');
      deepEqual(repoDataTemplate.getRepoData(), test);
    });

    it('should not delete if label not exist', async () => {
      const data = {
        issues: [{ labels: [ 'bug', 'test' ] }],
        pulls: [{ labels: [ 'bug', 'test' ] }],
      };
      repoDataTemplate.setRepoData(data as any);
      repoDataTemplate.updateLabel('deleted', 'not exist');
      deepEqual(repoDataTemplate.getRepoData(), testUpdateLabelData);
    });
  });

  describe('updateIssueComment', () => {
    it('should not update if not set repoData yet', async () => {
      const repoData = new RepoData();
      repoData.updateIssueComment('created', 1, null as any);
      assert(repoData.getRepoData() === undefined);
    });

    it('should not update if issue number not match', async () => {
      const data = { issues: [{ number: 1, comments: [{ id: 1 }] }] };
      const compare = { issues: [{ number: 1, comments: [{ id: 1 }] }] };
      repoDataTemplate.setRepoData(data as any);
      repoDataTemplate.updateIssueComment('created', -1, null as any);
      deepEqual(repoDataTemplate.getRepoData(), compare);
    });

    it('test deleted action', async () => {
      const data = { issues: [{ number: 1, comments: [{ id: 1 }] }] };
      repoDataTemplate.setRepoData(data as any);
      repoDataTemplate.updateIssueComment('deleted', 1, { id: 1 } as any);
      assert(repoDataTemplate.getRepoData().issues[0].comments.length === 0);
    });

    it('should not delete if comment.id not match', async () => {
      const data = { issues: [{ number: 1, comments: [{ id: 1 }] }] };
      repoDataTemplate.setRepoData(data as any);
      repoDataTemplate.updateIssueComment('deleted', 1, { id: 3 } as any);
      assert(repoDataTemplate.getRepoData().issues[0].comments.length === 1);
    });

    it('test created action', async () => {
      const data = { issues: [{ number: 1, comments: [{ id: 1 }] }] };
      repoDataTemplate.setRepoData(data as any);
      repoDataTemplate.updateIssueComment('created', 1, { id: 2 } as any);
      assert(repoDataTemplate.getRepoData().issues[0].comments.length === 2);
    });

    it('test edited action', async () => {
      const data = { issues: [{ number: 1, comments: [{ id: 1, body: 'body' }] }] };
      repoDataTemplate.setRepoData(data as any);
      repoDataTemplate.updateIssueComment('edited', 1, { id: 1, body: 'new body' } as any);
      assert(repoDataTemplate.getRepoData().issues[0].comments[0].body === 'new body');
    });

    it('should not update if comment.id not match', async () => {
      const data = { issues: [{ number: 1, comments: [{ id: 1, body: 'body' }] }] };
      repoDataTemplate.setRepoData(data as any);
      repoDataTemplate.updateIssueComment('edited', 1, { id: 2 } as any);
      assert(repoDataTemplate.getRepoData().issues[0].comments[0].body === 'body');
    });
  });

  describe('updatePullComment', () => {
    it('should not update if not set repoData yet', async () => {
      const repoData = new RepoData();
      repoData.updatePullComment('created', 1, null as any);
      assert(repoData.getRepoData() === undefined);
    });

    it('should not update if pull number not match', async () => {
      const data = { pulls: [{ number: 1, comments: [{ id: 1 }] }] };
      const compare = { pulls: [{ number: 1, comments: [{ id: 1 }] }] };
      repoDataTemplate.setRepoData(data as any);
      repoDataTemplate.updatePullComment('created', -1, null as any);
      deepEqual(repoDataTemplate.getRepoData(), compare);
    });

    it('test deleted action', async () => {
      const data = { pulls: [{ number: 1, comments: [{ id: 1 }] }] };
      repoDataTemplate.setRepoData(data as any);
      repoDataTemplate.updatePullComment('deleted', 1, { id: 1 } as any);
      assert(repoDataTemplate.getRepoData().pulls[0].comments.length === 0);
    });

    it('should not delete if comment.id not match', async () => {
      const data = { pulls: [{ number: 1, comments: [{ id: 1 }] }] };
      repoDataTemplate.setRepoData(data as any);
      repoDataTemplate.updatePullComment('deleted', 1, { id: 3 } as any);
      assert(repoDataTemplate.getRepoData().pulls[0].comments.length === 1);
    });

    it('test created action', async () => {
      const data = { pulls: [{ number: 1, comments: [{ id: 1 }] }] };
      repoDataTemplate.setRepoData(data as any);
      repoDataTemplate.updatePullComment('created', 1, { id: 2 } as any);
      assert(repoDataTemplate.getRepoData().pulls[0].comments.length === 2);
    });

    it('test edited action', async () => {
      const data = { pulls: [{ number: 1, comments: [{ id: 1, body: 'body' }] }] };
      repoDataTemplate.setRepoData(data as any);
      repoDataTemplate.updatePullComment('edited', 1, { id: 1, body: 'new body' } as any);
      assert(repoDataTemplate.getRepoData().pulls[0].comments[0].body === 'new body');
    });

    it('should not update if comment.id not match', async () => {
      const data = { pulls: [{ number: 1, comments: [{ id: 1, body: 'body' }] }] };
      repoDataTemplate.setRepoData(data as any);
      repoDataTemplate.updatePullComment('edited', 1, { id: 2 } as any);
      assert(repoDataTemplate.getRepoData().pulls[0].comments[0].body === 'body');
    });
  });

  describe('updatePull', () => {
    it('should not update if not set repoData yet', async () => {
      const repoData = new RepoData();
      repoData.updatePull('created', {} as any);
      assert(repoData.getRepoData() === undefined);
    });

    it('test opened action', async () => {
      const data = { pulls: [{ id: 2 }] };
      repoDataTemplate.setRepoData(data as any);
      repoDataTemplate.updatePull('opened', { id: 2 } as any);
      assert(repoDataTemplate.getRepoData().pulls.length === 2);
    });

    it('should not update if pull.id not match', async () => {
      const data = { pulls: [{ id: 1, author: 'a' }] };
      const test = { pulls: [{ id: 1, author: 'a' }] };
      repoDataTemplate.setRepoData(data as any);
      repoDataTemplate.updatePull('updated', { id: 2, author: 'b' } as any);
      deepEqual(repoDataTemplate.getRepoData(), test);
    });

    it('right case', async () => {
      const data = { pulls: [{ id: 1, author: 'a' }] };
      repoDataTemplate.setRepoData(data as any);
      repoDataTemplate.updatePull('updated', { id: 1, author: 'b' } as any);
      assert(repoDataTemplate.getRepoData().pulls[0].author === 'b');
    });
  });

  describe('updateIssue', () => {
    it('should not update if not set repoData yet', async () => {
      const repoData = new RepoData();
      repoData.updateIssue('created', {} as any);
      assert(repoData.getRepoData() === undefined);
    });

    it('test opened action', async () => {
      const data = { issues: [{ id: 2 }] };
      repoDataTemplate.setRepoData(data as any);
      repoDataTemplate.updateIssue('opened', { id: 2 } as any);
      assert(repoDataTemplate.getRepoData().issues.length === 2);
    });

    it('should not update if pull.id not match', async () => {
      const data = { issues: [{ id: 1, author: 'a' }] };
      const test = { issues: [{ id: 1, author: 'a' }] };
      repoDataTemplate.setRepoData(data as any);
      repoDataTemplate.updateIssue('updated', { id: 2, author: 'b' } as any);
      deepEqual(repoDataTemplate.getRepoData(), test);
    });

    it('right case', async () => {
      const data = { issues: [{ id: 1, author: 'a' }] };
      repoDataTemplate.setRepoData(data as any);
      repoDataTemplate.updateIssue('updated', { id: 1, author: 'b' } as any);
      assert(repoDataTemplate.getRepoData().issues[0].author === 'b');
    });
  });
});
