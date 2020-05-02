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

import { MockApplication } from 'egg-mock';
import { Application } from 'egg';
import { GitHubApp } from '../../../app/plugin/github/GitHubApp';
import sign from '@octokit/webhooks/sign';
import { GitHubClient } from '../../../app/plugin/github/GitHubClient';
import { HostingPlatformInitEvent } from '../../../app/basic/HostingPlatform/event';
import { GitHubConfig } from '../../../app/plugin/github/GitHubConfig';
import { waitFor } from '../../Util';
import { waitUntil } from '../../../app/basic/Utils';

/**
 * Mock GitHub DataCat
 */
export class MockDataCat {
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
          id: 1,
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
          id: 1,
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
export class MockRawClient {
  // store test result
  testResult: any[] = [];
  // mock origin API
  issues: any = {
    create: issue => this.testResult.push([ 'issues.create', issue ]),
    update: issue => this.testResult.push([ 'issues.update', issue ]),
    createComment: issue => this.testResult.push([ 'issues.createComment', issue ]),
    addAssignees: issue => this.testResult.push([ 'issues.addAssignees', issue ]),
    addLabels: issue => this.testResult.push([ 'issues.addLabels', issue ]),
    createLabel: issue => this.testResult.push([ 'issues.createLabel', issue ]),
    updateLabel: issue => this.testResult.push([ 'issues.updateLabel', issue ]),
    listLabelsForRepo: () => ({
      data: [
        {
          name: 'name',
          description: 'des',
          color: '666',
        },
      ],
    }),
  };
  checks: any = {
    create: check => this.testResult.push([ 'check.create', check ]),
  };
  repos: any = {
    getContents: () => ({ data: { content: 'content' } }),
  };
}

/**
 * Mock GitHub App
 * Only replace some methods that need to connect to Internet
 */
export class MockGitHubApp extends GitHubApp {
  constructor(id: number, config: GitHubConfig, app: Application) {
    super(id, config, app);
    // Can not stop create real DataCat in super.
    // Therefore logger will print out some error.
    // But it does not matter.
    this.dataCat = new MockDataCat() as any;
  }

  public async getInstalledRepos(): Promise<Array<{ fullName: string, payload: any }>> {
    const ret: Array<{ fullName: string, payload: any }> = [];
    ret.push(
      {
        fullName: 'owner/repo',
        payload: 0,
      },
    );
    return ret;
  }

  public async addRepo(name: string, _payload: any): Promise<void> {
    // set token before any request
    const githubClient = new GitHubClient(name, this.id, this.app, this.dataCat, this);
    githubClient.setRawClient(new MockRawClient() as any);
    this.clientMap.set(name, async () => githubClient);
  }
}

// init github webhooks
export async function initWebhooks(app: Application): Promise<any[]> {
  // need to sync with template later
  const githubConfig = {
    type: 'github',
    config: {
      name: 'github',
      endpoint: 'https://api.github.com/',
      appId: 0,
      privateKeyPath: '.github/hypertrons.json',
      privateKeyPathAbsolute: false,
      webhook: {
        path: '/',
        secret: 'test',
        proxyUrl: 'https://smee.io/YOUR_PROXY',
      },
      fetcher: {
        tokens: [ 'YOUR TOKEN' ],
      },
      config: {
        remote: {
          filePath: '.github/hypertrons.json',
          luaScriptPath: './github/lua/',
        },
        private: {
          file: {
            rootPath: './test/plugin/github/repo_configs',
          },
        },
      },
      component: {
        enableRepoLua: false,
        file: {
          basePath: 'app/component',
          configModule: 'config',
          luaModule: 'index.lua',
          versionPath: 'version.json',
        },
      },
      updateRepoDataSched: '0 0 8 * * *',
    },
  };
  // replace getNewHostingPlatform method, generate mock github app
  (app.github as any).getNewHostingPlatform = async function (id: number, config: GitHubConfig): Promise<GitHubApp> {
    return new MockGitHubApp(id, config, this.app);
  };
  // manually add hosting platform
  (app as any).agent.event.publish('all', HostingPlatformInitEvent, {
    id: 0,
    ...githubConfig,
  });
  // wait until client inited
  let githubClient;
  let retryTime = 0;
  while (!githubClient) {
    if (retryTime >= 10) {
      throw new Error('init webhook timeout');
    }
    await waitFor(100);
    githubClient = await app.github.getClient(0, 'owner/repo');
    retryTime++;
  }
  const testResult = (githubClient as any).rawClient.testResult;
  // first test case usually take more time
  // make sure sending webhooks is successful
  await sendToWebhooks(app, 'pull_request.opened', getPayload('pull_request.opened'));
  // wait for pre calling finished
  await waitUntil(() => testResult.length !== 0, { interval: 100 });
  await waitFor(200);
  // clear pre calling record (like create labels)
  testResult.length = 0;
  return testResult;
}

// send to webhooks with specified event type
export async function sendToWebhooks(app: Application, eventType: string, payload?: any) {
  payload = payload ? payload : getPayload(eventType);
  await (app as MockApplication).httpRequest()
    .post('/installation/0/')
    .set('x-github-delivery', '0')
    .set('x-github-event', eventType)
    .set('x-hub-signature', sign('test', payload))
    .send(payload);
}

// get payload template
export function getPayload(eventType: string): any {
  const et = eventType.split('.');
  if (et.length !== 2) return {};
  switch (et[0]) {
    case 'issues':
      return {
        ...issuesPayloadTemplate,
        action: et[1],
      };
    case 'pull_request':
      return {
        ...prPayloadTemplate,
        action: et[1],
      };
    case 'label':
      return {
        ...labelPayloadTemplate,
        action: et[1],
      };
    case 'issue_comment':
      return {
        ...issueCommentPayloadTemplate,
        action: et[1],
      };
    case 'pull_request_review':
      return {
        ...reviewPayloadTemplate,
        action: et[1],
      };
    case 'pull_request_review_comment':
      return {
        ...reviewCommentPayloadTemplate,
        action: et[1],
      };
    default:
      return {};
  }
}

/**
 * mock payload template zone
 */

const repoTemplate = {
  full_name: 'owner/repo',
};

const issueTemplate = {
  id: 2048,
  user: {
    login: 'login',
  },
  number: 1,
  created_at: 0,
  updated_at: 0,
  closed_at: null,
  title: 'title',
  body: 'body',
  labels: [
    {
      name: 'label_name',
    },
  ],
};

const prTemplate = {
  id: 2048,
  user: {
    login: 'login',
  },
  number: 1,
  created_at: 0,
  updated_at: 0,
  closed_at: null,
  merged_at: null,
  title: 'title',
  body: 'body',
  labels: [
    {
      name: 'label_name',
    },
  ],
  additions: 0,
  deletions: 0,
};

const commentTemplate = {
  id: 2048,
  user: {
    login: 'login',
  },
  url: '',
  created_at: 0,
  updated_at: 0,
  body: 'body',
};

const reviewTemplate = {
  id: 2048,
  user: {
    login: 'login',
  },
  url: '',
  submitted_at: 0,
  updated_at: 0,
  body: 'body',
};

const issuesPayloadTemplate = {
  repository: repoTemplate,
  issue: issueTemplate,
  changes: {},
  action: 'opened',
};

const prPayloadTemplate = {
  repository: repoTemplate,
  pull_request: prTemplate,
  action: 'submitted',
};

const labelPayloadTemplate = {
  repository: repoTemplate,
  label: {
    name: 'label_name',
  },
  action: 'created',
};

const issueCommentPayloadTemplate = {
  repository: repoTemplate,
  issue: issueTemplate,
  comment: commentTemplate,
  action: 'created',
};

const reviewCommentPayloadTemplate = {
  repository: repoTemplate,
  pull_request: prTemplate,
  comment: commentTemplate,
  action: 'created',
};

const reviewPayloadTemplate = {
  repository: repoTemplate,
  pull_request: prTemplate,
  review: reviewTemplate,
  action: 'submitted',
};
