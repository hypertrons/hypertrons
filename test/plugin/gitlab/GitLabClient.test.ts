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
import { prepareTestApplication, testClear } from '../../Util';
import { GitLabClient } from '../../../app/plugin/gitlab/GitLabClient';
import assert from 'power-assert';

describe('GitLabClient', () => {
  let app: Application;
  let agent: Agent;
  let client: GitLabClient;
  let testResult: any;

  beforeEach(async () => {
    ({ app, agent } = await prepareTestApplication());
    client = new GitLabClient('owner/repo', 0, app, 42, new MockRawClient() as any, {} as any, new MockHostingBase() as any);
    testResult = (client as any).rawClient.testResult;
  });
  afterEach(() => {
    testClear(app, agent);
  });

  /**
   * Mock HostingBase
   */
  class MockHostingBase {
    getName(): string {
      return 'name';
    }
    getConfig(): any {
      return {};
    }
  }

  /**
   * Mock GitLab rawClient API
   * Every time use method of client, gitlab api will be called by rawClient.
   * But the mock rawClient will save parameters instead of truly sending requests.
   * Thus by checking values in "testResult" we can know whether function work normally
   */
  class MockRawClient {
    // store test result
    // variable like issue, assignees do not have to assign value in advance
    // but labels must be a array
    testResult: any = {
      labels: [],
    };
    Issues: any = {
      create: (_id, issue) => this.testResult.issue = issue,
      edit: (_id, number, issue) => {
        this.testResult.number = number;
        this.testResult.issue = issue;
      },
    };
    IssueNotes: any = {
      create: (_id, number, comment) => {
        this.testResult.number = number;
        this.testResult.comment = comment;
      },
    };
    Labels: any = {
      create: (_id, name, color, label) => {
        this.testResult.labels.push({
          name,
          color,
          label,
        });
      },
      edit: (_id, name, label) => {
        this.testResult.labels.push({
          name,
          label,
        });
      },
      all: () => this.testResult.labels,
    };
    RepositoryFiles: any = {
      show: () => {
        return {
          content: this.testResult.content,
          encoding: 'base64',
        };
      },
    };
  }

  describe('getFileContent', () => {
    it('getFileContent', async () => {
      testResult.content = 'dGVzdA==';
      assert.deepStrictEqual(await client.getFileContent('path'), { content: 'test' });
    });
  });

  describe('addIssue', () => {
    it('add issue', async () => {
      await client.addIssue('testIssue', 'testBody', [ 'label1', 'label2' ]);
      assert.deepStrictEqual(testResult.issue, {
        title: 'testIssue',
        description: 'testBody',
        labels: 'label1,label2',
      });
    });
    it('add issue with no label', async () => {
      await client.addIssue('testIssue', 'testBody', undefined);
      assert.deepStrictEqual(testResult.issue, {
        title: 'testIssue',
        description: 'testBody',
        labels: undefined,
      });
    });
  });

  describe('updateIssue', () => {
    const update = {
      title: 'testIssue',
      body: 'testBody',
      state: '',
    };

    it('reopen issue', async () => {
      await client.updateIssue(42, {
        ...update,
        state: 'open',
      } as any);
      assert.deepStrictEqual(testResult.number, 42);
      assert.deepStrictEqual(testResult.issue, {
        title: 'testIssue',
        description: 'testBody',
        state_event: 'reopen',
      });
    });

    it('close issue', async () => {
      await client.updateIssue(42, {
        ...update,
        state: 'closed',
      } as any);
      assert.deepStrictEqual(testResult.number, 42);
      assert.deepStrictEqual(testResult.issue, {
        title: 'testIssue',
        description: 'testBody',
        state_event: 'close',
      });
    });
  });

  describe('addIssueComment', () => {
    it('add issue comment', async () => {
      await client.addIssueComment(42, 'testBody');
      assert.deepStrictEqual(testResult.number, 42);
      assert.deepStrictEqual(testResult.comment, 'testBody');
    });
  });

  describe('addLabels', () => {
    it('add labels', async () => {
      await client.addLabels(42, [ 'label1', 'label2' ]);
      assert.deepStrictEqual(testResult.issue, { labels: 'label1,label2' });
    });
  });

  describe('parseColor', () => {
    it('return undefine if color is undefined', async () => {
      assert.strictEqual((client as any).parseColor(undefined), undefined);
    });

    it('return upper case COLOR that start with #', async () => {
      assert.strictEqual((client as any).parseColor('b1024'), '#B1024');
    });
  });

  describe('createLabels', () => {
    it('create labels', async () => {
      const labels = [
        {
          name: 'label1',
          description: 'des1',
          color: '2048',
        },
        {
          name: 'label2',
          description: 'des2',
          color: '4096',
        },
      ];
      await client.createLabels(labels);
      assert.deepStrictEqual(testResult.labels, [
        { name: 'label1', color: '#2048', label: { description: 'des1' } },
        { name: 'label2', color: '#4096', label: { description: 'des2' } },
      ]);
    });
  });

  describe('updateLabels', () => {
    const labels = [
      {
        current_name: 'label1',
        description: 'des1',
        color: '2048',
      },
      {
        current_name: 'label2',
        description: 'des2',
        color: '4096',
      },
    ];
    it('update labels', async () => {
      await client.updateLabels(labels);
      assert.deepStrictEqual(testResult.labels, [
        {
          name: 'label1',
          label: { color: '#2048', description: 'des1' },
        },
        {
          name: 'label2',
          label: { color: '#4096', description: 'des2' },
        },
      ]);
    });
  });

  describe('listLabels', () => {
    it('list labels', async () => {
      testResult.labels = [
        {
          name: 'label1',
          description: 'des1',
          color: '2048',
        },
        {
          name: 'label2',
          description: 'des2',
          color: '4096',
        },
      ];
      const labels = await client.listLabels();
      assert.deepStrictEqual(labels, testResult.labels);
    });
    it('no labels', async () => {
      testResult.labels = undefined;
      const labels = await client.listLabels();
      assert.deepStrictEqual(labels, []);
    });
  });

  describe('createCheckRun', () => {
    it('createCheckRun', async () => {
      const check = {
        name: 'testCheck',
        head_sha: '1024',
        owner: 'owner',
        repo: 'repo',
      };
      // add await will incur timeout
      client.createCheckRun(check);
    });
  });

});
