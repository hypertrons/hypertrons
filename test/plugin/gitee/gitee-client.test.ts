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
import { GiteeClient } from '../../../app/plugin/gitee/gitee-client';
import { prepareTestApplication, testClear } from '../../Util';
import assert from 'power-assert';

describe('GiteeClient', () => {
  let app: Application;
  let agent: Agent;
  let client: GiteeClient;
  let testResult: any[];
  const repoName: any = { owner: 'owner', repo: 'repo' };

  before(async () => {
    ({ app, agent } = await prepareTestApplication());
    client = new GiteeClient('owner/repo', 42, app, new MockRawClient() as any, new MockHostingBase() as any);
    testResult = (client.getRawClient() as any).testResult;
  });
  afterEach(() => {
    testResult.length = 0;
  });
  after(() => {
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
   * Mock Gitee Raw Client
   */
  class MockRawClient {
    // store test result
    testResult: any[] = [];
    issues: any = {
      create: param => this.testResult.push('issues.create', param),
      update: param => this.testResult.push('issues.update', param),
      createComment: param => this.testResult.push('issues.createComment', param),
      addLabel: param => this.testResult.push('issues.addLabel', param),
      createLabel: param => this.testResult.push('issues.createLabel', param),
      updateLabel: param => this.testResult.push('issues.updateLabel', param),
      listLabelsForRepo: () => this.testResult,
      all: () => [
        {
          id: 0,
          user: 'login',
          number: 'I192YQ',
        },
      ],
      allComments: () => [
        {
          user: {
            login: 'login',
          },
          target: {
            issue: {
              number: 'I192YQ',
            },
          },
        },
      ],
    };
    pulls: any = {
      update: param => this.testResult.push('pulls.update', param),
      addLabel: param => this.testResult.push('pulls.addLabel', param),
      merge: param => this.testResult.push('pulls.merge', param),
      all: () => [
        {
          id: 0,
          user: 'login',
          number: 42,
        },
      ],
      allComments: () => [
        {
          user: {
            login: 'login',
          },
          target: {
            issue: {
              number: 42,
            },
          },
        },
      ],
    };
    // fake repo API
    repos: any = {
      getRepoData: () => {
        return {
          id: 0,
          full_name: 'owner/repo',
          owner: {
            login: 'owner',
            type: 'user',
            name: 'Owner',
          },
          name: 'name',
          license: 'license',
          created_at: 0,
          updated_at: 0,
          pushed_at: 0,
        };
      },
      getContributors: () => [
        {
          name: 'name',
          emal: 'emal',
        },
      ],
      getForks: () => {
        return [
          {
            owner: {
              login: 'login',
            },
          },
        ];
      },
      getContents: (param: { owner, repo, path }) => {
        if (param.path === 'correct') {
          return { content: 'dGVzdA==', encoding: 'base64' };
        } else {
          throw new Error('File not exist');
        }
      },
    };
  }

  describe('updateData', () => {
    it('update data', async () => {
      await client.updateData();
      assert.notDeepStrictEqual(client.repoDataService.getRepoData(), undefined);
    });
  });

  describe('getFileContent', () => {
    it('getFileContent', async () => {
      // the base64 form of string "test" is "dGVzdA=="
      testResult.push('dGVzdA==');
      assert.deepStrictEqual(await client.getFileContent('correct'), { content: 'test' });
    });

    it('catch error', async () => {
      testResult.push(undefined);
      assert.deepStrictEqual(await client.getFileContent('wrong'), undefined);
    });
  });

  describe('addIssue', () => {
    it('add issue', async () => {
      await client.addIssue('testIssue', 'testBody', []);
      assert.deepStrictEqual(testResult, [
        'issues.create',
        {
          ...repoName,
          title: 'testIssue',
          body: 'testBody',
          labels: [],
        },
      ]);
    });
  });

  describe('updateIssue', () => {
    const update = {
      title: 'testIssue',
      body: 'testBody',
      state: 'open',
    };
    it('update issue', async () => {
      await client.updateIssue(734957508981, update as any);
      assert.deepStrictEqual(testResult, [
        'issues.update',
        {
          ...repoName,
          number: 'I192YQ',
          ...update,
        },
      ]);
    });
  });

  describe('updatePull', () => {
    const update = {
      title: 'testIssue',
      body: 'testBody',
      state: 'open',
    };
    it('update pull', async () => {
      await client.updatePull(42, update as any);
      assert.deepStrictEqual(testResult, [
        'pulls.update',
        {
          ...repoName,
          number: 42,
          ...update,
        },
      ]);
    });
  });

  describe('merge', () => {
    it('merge', async () => {
      await client.merge(42);
      assert.deepStrictEqual(testResult, [
        'pulls.merge',
        {
          ...repoName,
          number: 42,
          merge_method: 'squash',
        },
      ]);
    });
  });

  describe('addIssueComment', () => {
    it('add issue comment', async () => {
      await client.addIssueComment(734957508981, 'testBody');
      assert.deepStrictEqual(testResult, [
        'issues.createComment',
        {
          ...repoName,
          number: 'I192YQ',
          body: 'testBody',
        },
      ]);
    });
  });

  describe('addAssignees', () => {
    it('add assignees', async () => {
      await client.assign(734957508981, 'Tracer');
      assert.deepStrictEqual(testResult, [
        'issues.update',
        {
          ...repoName,
          number: 'I192YQ',
          assignee: 'Tracer',
        },
      ]);
    });
  });

  describe('addLabels for issue', () => {
    it('add labels', async () => {
      await client.addLabels(734957508981, [ 'label1', 'label2' ]);
      assert.deepStrictEqual(testResult, [
        'issues.addLabel',
        {
          ...repoName,
          number: 'I192YQ',
          labels: [ 'label1', 'label2' ],
        },
      ]);
    });
  });

  // need more mock to test this
  // describe('addLabels for PR', () => {
  //   it('add labels', async () => {
  //     await client.addLabels(42, [ 'label1', 'label2' ]);
  //     assert.deepStrictEqual(testResult, [
  //       'issues.addLabel',
  //       {
  //         ...repoName,
  //         number: 42,
  //         labels: [ 'label1', 'label2' ],
  //       },
  //     ]);
  //   });
  // });

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
      assert.deepStrictEqual(testResult, [
        'issues.createLabel',
        {
          owner: 'owner',
          repo: 'repo',
          name: 'label1',
          description: 'des1',
          color: '2048',
        },
        'issues.createLabel',
        {
          owner: 'owner',
          repo: 'repo',
          name: 'label2',
          description: 'des2',
          color: '4096',
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

    it('should not update without color', async () => {
      await client.updateLabels([
        {
          ...labels[0],
          description: 'des',
          color: undefined,
        },
        {
          ...labels[1],
          description: 'des',
          color: undefined,
        },
      ]);
      assert.deepStrictEqual(testResult, []);
    });

    it('update labels', async () => {
      await client.updateLabels(labels);
      assert.deepStrictEqual(testResult, [
        'issues.updateLabel',
        {
          owner: 'owner',
          repo: 'repo',
          current_name: 'label1_old',
          name: 'label1',
          description: 'des1',
          color: '2048',
        },
        'issues.updateLabel',
        {
          owner: 'owner',
          repo: 'repo',
          current_name: 'label2_old',
          name: 'label2',
          description: 'des2',
          color: '4096',
        },
      ]);
    });
  });

  describe('listLabels', () => {
    it('listLabels', async () => {
      testResult.push(
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
      );
      const labels = await client.listLabels();
      assert.deepStrictEqual(labels, testResult);
    });
  });

  describe('createCheckRun', () => {
    it('createCheckRun', async () => {
      await client.createCheckRun();
      assert.deepStrictEqual(testResult, []);
    });
  });

});
