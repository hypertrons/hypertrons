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
import { GitHubClient } from '../../../app/plugin/github/GitHubClient';
import assert from 'power-assert';

describe('GitHubClient', () => {
  let app: Application;
  let agent: Agent;
  let client: GitHubClient;
  let testResult: any;
  const repoName: any = { owner: 'owner', repo: 'repo' };

  beforeEach(async () => {
    ({ app, agent } = await prepareTestApplication());
    client = new GitHubClient('owner/repo', 42, app, new MockDataCat() as any, new MockHostingBase() as any);
    client.setRawClient(new MockRawClient() as any);
    testResult = (client.getRawClient() as any).testResult;
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
   * Mock GitHub DataCat
   */
  class MockDataCat {
    inited: boolean = true;
    repo: any = {
      full: () => ({
        stars: [
          {
            login: 'testLogin',
            time: new Date(0),
          },
        ],
        forks: [
          {
            login: 'testLogin',
            time: new Date(0),
          },
        ],
        issues: [
          {
            createAt: new Date(0),
            updateAt: new Date(0),
            closedAt: new Date(0),
            comments: [
              {
                login: 'testLogin',
                createAt: new Date(0),
              },
            ],
          },
        ],
        pulls: [
          {
            createAt: new Date(0),
            updateAt: new Date(0),
            closedAt: new Date(0),
            mergedAt: new Date(0),
            comments: [
              {
                login: 'testLogin',
                createAt: new Date(0),
              },
            ],
            reviewComments: [
              {
                login: 'testLogin',
                createAt: new Date(0),
              },
            ],
          },
        ],
        contributors: [
          {
            login: 'testLogin',
            time: new Date(0),
          },
        ],
      }),
    };
  }

  /**
   * Mock GitHub rawClient API
   * Every time use method of client, github api will be called by rawClient.
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
    issues: any = {
      create: issue => this.testResult.issue = issue,
      update: issue => this.testResult.issue = issue,
      createComment: comment => this.testResult.comment = comment,
      addAssignees: assignees => this.testResult.assignees = assignees,
      addLabels: labels => this.testResult.labels = labels,
      createLabel: label => this.testResult.labels.push(label),
      updateLabel: label => this.testResult.labels.push(label),
      listLabelsForRepo: () => ({ data: this.testResult.labels }),
    };
    checks: any = {
      create: check => this.testResult.check = check,
    };
    repos: any = {
      getContents: () => ({ data: { content: this.testResult.content, encoding: 'base64' } }),
    };
  }

  describe('getFileContent', () => {
    it('getFileContent', async () => {
      // the base64 form of string "test" is "dGVzdA=="
      testResult.content = 'dGVzdA==';
      assert.deepStrictEqual(await client.getFileContent('path'), { content: 'test' });
    });
  });

  describe('addIssue', () => {
    it('add issue', async () => {
      await client.addIssue('testIssue', 'testBody', []);
      assert.deepStrictEqual(testResult.issue, {
        ...repoName,
        title: 'testIssue',
        body: 'testBody',
        labels: [],
      });
    });
  });

  describe('updateIssue', () => {
    const update = {
      title: 'testIssue',
      body: 'testBody',
      state: 'open',
    };
    it('update issue', async () => {
      await client.updateIssue(42, update as any);
      assert.deepStrictEqual(testResult.issue, {
        ...repoName,
        issue_number: 42,
        ...update,
      });
    });
  });

  describe('addIssueComment', () => {
    it('add issue comment', async () => {
      await client.addIssueComment(42, 'testBody');
      assert.deepStrictEqual(testResult.comment, {
        ...repoName,
        issue_number: 42,
        body: 'testBody',
      });
    });
  });

  describe('addAssignees', () => {
    it('add assignees', async () => {
      await client.addAssignees(42, [ 'Tracer', 'Winston' ]);
      assert.deepStrictEqual(testResult.assignees, {
        ...repoName,
        issue_number: 42,
        0: 'Tracer',
        1: 'Winston',
      });
    });
  });

  describe('addLabels', () => {
    it('add labels', async () => {
      await client.addLabels(42, [ 'label1', 'label2' ]);
      assert.deepStrictEqual(testResult.labels, {
        ...repoName,
        issue_number: 42,
        labels: [ 'label1', 'label2' ],
      });
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
        {
          ...repoName,
          ...labels[0],
        },
        {
          ...repoName,
          ...labels[1],
        },
      ]);
    });
  });

  describe('updateLabels', () => {
    const labels = [
      {
        current_name: 'label1_old',
        name: 'label1',
        description: 'des1',
        color: '2048',
      },
      {
        current_name: 'label2_old',
        name: 'label2',
        description: 'des2',
        color: '4096',
      },
    ];
    it('should not update without description and color', async () => {
      await client.updateLabels([
        {
          ...labels[0],
          description: undefined,
          color: undefined,
        },
        {
          ...labels[1],
          description: undefined,
          color: undefined,
        },
      ]);
      assert.deepStrictEqual(testResult.labels, []);
    });
    it('update labels', async () => {
      await client.updateLabels(labels);
      assert.deepStrictEqual(testResult.labels, [
        {
          ...repoName,
          ...labels[0],
        },
        {
          ...repoName,
          ...labels[1],
        },
      ]);
    });
  });

  describe('listLabels', () => {
    it('listLabels', async () => {
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
  });

  describe('createCheckRun', () => {
    it('createCheckRun', async () => {
      const check = {
        name: 'testCheck',
        head_sha: '1024',
        owner: 'owner',
        repo: 'repo',
      };
      await client.createCheckRun(check);
      assert.deepStrictEqual(testResult.check, check);
    });
  });

  describe('getData', () => {
    it('getData', async () => {
      assert(client.getData() !== undefined);
    });
  });

});
