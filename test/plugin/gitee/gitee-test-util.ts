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

import { GiteeApp } from '../../../app/plugin/gitee/gitee-app';
import { GiteeConfig } from '../../../app/plugin/gitee/gitee-config';
import { Application } from 'egg';
import { GiteeClient } from '../../../app/plugin/gitee/gitee-client';
import { GiteeRawClient } from '../../../app/plugin/gitee/gitee-raw-client/gitee-raw-client';
import { HostingBase } from '../../../app/basic/HostingPlatform/HostingBase';
import { HostingClientBase } from '../../../app/basic/HostingPlatform/HostingClientBase';
import { MockApplication } from 'egg-mock';
import { HostingPlatformInitEvent } from '../../../app/basic/HostingPlatform/event';
import { waitFor } from '../../Util';
import { waitUntil } from '../../../app/basic/Utils';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Repo, RepoFile } from '../../../app/basic/DataTypes';

/**
 * Mock Gitee App
 * Only replace some methods that need to connect to Internet
 */
export class MockGiteeApp extends GiteeApp {
  mockRepoData: Repo;

  constructor(id: number, config: GiteeConfig, app: Application, repoData: any) {
    super(id, config, app);
    this.mockRepoData = repoData;
  }

  public async getInstalledRepos(): Promise<Array<{ fullName: string, payload: any }>> {
    const ret: Array<{ fullName: string, payload: any }> = [];
    ret.push(
      {
        fullName: this.mockRepoData.owner + '/' + this.mockRepoData.name,
        payload: 0,
      },
    );
    return ret;
  }

  public async addRepo(name: string, _payload: any): Promise<void> {
    // set token before any request
    const giteeClient = new MockGiteeClient(name, this.id, this.app, this, this.mockRepoData);
    this.clientMap.set(name, async () => giteeClient);
  }
}

export class MockGiteeClient extends GiteeClient {
  testResult: any[] = [];
  mockRepoData: any;

  constructor(name: string, hostId: number, app: Application, hostBase: HostingBase<GiteeConfig, HostingClientBase<GiteeConfig, GiteeRawClient>, GiteeRawClient>, mockRepoData: any) {
    super(name, hostId, app, {} as any, hostBase);
    this.mockRepoData = mockRepoData;
  }

  public async updateData() {
    this.testResult.push([ 'updateData' ]);
    this.repoDataService.setRepoData(this.mockRepoData);
  }

  public async getFileContent(path: string): Promise<RepoFile | undefined> {
    this.testResult.push([ 'getFileContent', path ]);
    return;
  }

  public async listIssues() {
    this.testResult.push([ 'listIssues' ]);
    return;
  }

  public async addIssueComment(number: number, body: string): Promise<void> {
    this.testResult.push([ 'addIssueComment', number, body ]);
    return;
  }

  public async addIssue(title: string, body: string, labels?: string[] | undefined): Promise<void> {
    this.testResult.push([ 'addIssue', title, body, labels ]);
    return;
  }

  // notice: issue number in gitee is a string like 'I18O1N', not a real number.
  public async updateIssue(number: number, update: {title?: string, body?: string, state?: 'open' | 'closed'}): Promise<void> {
    this.testResult.push([ 'updateIssue', number, update ]);
    return;
  }

  public async assign(number: number, login: string): Promise<void> {
    this.testResult.push([ 'assign', number, login ]);
    return;
  }

  // notice: pull number in gitee is a ordinal number, different from issue number.
  public async updatePull(number: number, update: { title?: string;
                                                    body?: string;
                                                    state?: 'open' | 'closed'
  }): Promise<void> {
    this.testResult.push([ 'updatePull', number, update ]);
    return;
  }

  public async listLabels(): Promise<Array<{name: string, description: string, color: string}>> {
    this.testResult.push([ 'listLabels' ]);
    return [];
  }

  public async addLabels(number: number, labels: string[]): Promise<void> {
    this.testResult.push([ 'addLabels', number, labels ]);
    return;
  }

  public async updateLabels(labels: Array<{ current_name: string; name?: string; description?: string; color?: string; }>): Promise<void> {
    this.testResult.push([ 'updateLabels', labels ]);
    return;
  }

  public async createLabels(labels: Array<{name: string, description: string, color: string}>): Promise<void> {
    this.testResult.push([ 'createLabels', labels ]);
    return;
  }

  public async createCheckRun() {
    this.testResult.push([ 'createCheckRun' ]);
    return;
  }

  public async merge(number: number): Promise<void> {
    this.testResult.push([ 'merge', number ]);
    return;
  }

}

// init gitee webhooks
export async function initWebhooks(app: Application, custom: {
  giteeConfig?: any,
  repoData?: Repo,
} = {}): Promise<any[]> {

  // init custom data
  /**
   * Notice: The webhook payload's owner and repo data, have to keep in line
   * with that in custom.repoData. Or the test won't work correctly
   * VERY IMPORTANT!!!
   */
  if (!custom.giteeConfig) {
    custom.giteeConfig = JSON.parse(readFileSync(join(__dirname, './data/global-config.json')).toString()).installation.client.configs[0];
  }
  if (!custom.repoData) {
    custom.repoData = JSON.parse(readFileSync(join(__dirname, './data/repo-data.json')).toString());
  }

  // replace getNewHostingPlatform method, generate mock gitee app
  (app.gitee as any).getNewHostingPlatform = async function (id: number, config: GiteeConfig): Promise<GiteeApp> {
    return new MockGiteeApp(id, config, this.app, custom.repoData);
  };
  // manually add hosting platform
  (app as any).agent.event.publish('all', HostingPlatformInitEvent, {
    id: 0,
    ...custom.giteeConfig,
  });

  // wait until client inited
  let giteeClient;
  let retryTime = 0;
  while (!giteeClient) {
    if (retryTime >= 10) {
      throw new Error('init webhook timeout');
    }
    await waitFor(100);
    giteeClient = await app.gitee.getClient(0, (custom.repoData as any).owner + '/' + (custom.repoData as any).name);
    retryTime++;
  }
  const testResult = (giteeClient as any).testResult;

  // make sure service start successfully
  await waitFor(500);

  // wait for pre calling finished
  await waitUntil(() => testResult.length !== 0, { interval: 100 });
  await waitFor(200);
  // clear pre calling record (like create labels)
  testResult.length = 0;

  return testResult;
}

// send to webhooks with specified event type
export async function sendToWebhooks(app: Application, headers: any, payload: any) {
  await (app as MockApplication).httpRequest()
    .post('/installation/0/')
    .set('X-Gitee-Event', headers['X-Gitee-Event'])
    .set('X-Gitee-Token', headers['X-Gitee-Token'])
    .send(payload);
}
