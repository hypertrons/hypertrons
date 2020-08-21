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

import { HostingClientBase } from '../../basic/HostingPlatform/HostingClientBase';
import { Gitlab } from 'gitlab';
import { Application } from 'egg';
import { CheckRun, CreatePullRequestOption, RepoDir, RepoFile } from '../../basic/DataTypes';
import { getAll } from './data/getAll';
import { GitlabGraphqlClient } from './client/GitlabGraphqlClient';
import { GitLabConfig } from './GitLabConfig';
import { HostingBase } from '../../basic/HostingPlatform/HostingBase';

export class GitLabClient extends HostingClientBase<GitLabConfig, Gitlab> {

  private id: number;
  private gitlabGraphqlClient: GitlabGraphqlClient;

  constructor(name: string, hostId: number, app: Application, id: number, client: Gitlab,
              gitlabGraphqlClient: GitlabGraphqlClient,
              hostBase: HostingBase<GitLabConfig, HostingClientBase<GitLabConfig, Gitlab>, Gitlab>) {
    super(name, hostId, app, hostBase);
    this.id = id;
    this.rawClient = client;
    this.gitlabGraphqlClient = gitlabGraphqlClient;
  }

  protected async updateData(): Promise<void> {
    this.repoDataService.setRepoData(await getAll(this.gitlabGraphqlClient, this.fullName));
  }

  public async getFileContent(path: string, ref?: string): Promise<RepoFile | undefined> {
    const res: any = await this.rawClient.RepositoryFiles.show(this.id, path, ref ?? 'master');
    if (res.content && res.encoding === 'base64') {
      res.content = Buffer.from(res.content, 'base64').toString('ascii');
      delete res.encoding;
    }
    return res;
  }

  public async getDirectoryContent(): Promise<RepoDir[] | undefined> {
    throw new Error('Method not implemented.');
  }

  public async addIssue(title: string, body: string, labels?: string[] | undefined): Promise<void> {
    // API doc: https://docs.gitlab.com/ee/api/issues.html#new-issue
    await this.rawClient.Issues.create(this.id, {
      title,
      description: body,
      labels: labels ? labels.join(',') : undefined,
    });
  }

  public async listLabels(): Promise<Array<{name: string, description: string, color: string}>> {
    // API doc: https://docs.gitlab.com/ee/api/labels.html#list-labels
    const res = await this.rawClient.Labels.all(this.id) as any[];
    if (!res) return [];
    return res.map(r => {
      return {
        name: r.name,
        description: r.description,
        color: r.color,
      };
    });
  }

  public async addLabels(number: number, labels: string[]): Promise<void> {
    // For issues, API doc: https://docs.gitlab.com/ee/api/issues.html#new-issue
    // For MRs, API doc: https://docs.gitlab.com/ee/api/merge_requests.html#update-mr
    await this.rawClient.Issues.edit(this.id, number, {
      labels: labels.join(','),
    });
  }

  public async removeLabel(number: number, label: string): Promise<void> {
    this.logger.info(number, label);
    // TODO
    await this.rawClient.Issues.edit(this.id, number, {
      labels: [], // just do nothing to pass compile
    });
  }

  public async updateIssue(number: number, update: {title?: string | undefined; body?: string | undefined; state?: 'open' | 'closed' | undefined; }): Promise<void> {
    // API doc: https://docs.gitlab.com/ee/api/issues.html#edit-issue
    let state_event: any;
    if (update.state === 'open') state_event = 'reopen';
    if (update.state === 'closed') state_event = 'close';
    await this.rawClient.Issues.edit(this.id, number, {
      title: update.title,
      description: update.body,
      state_event,
    });
  }

  // TODO please add test cases
  public async updatePull(number: number, update: { title?: string;
                                                    body?: string;
                                                    state?: 'open' | 'closed';
                                                   }): Promise<void> {
    let state_event: any;
    if (update.state === 'open') state_event = 'reopen';
    if (update.state === 'closed') state_event = 'close';
    await this.rawClient.MergeRequests.edit(this.id, number, {
      title: update.title,
      description: update.body,
      state_event,
    });
  }

  public async addIssueComment(number: number, body: string): Promise<void> {
    await this.rawClient.IssueNotes.create(this.id, number, body);
  }

  public async updateIssueComment(comment_id: number, body: string): Promise<void> {
    // Wrong just to pass compile.
    this.logger.info(comment_id, body);
    await this.rawClient.Labels.all(this.id); // nonsense.
  }

  public async updateLabels(labels: Array<{ current_name: string; description?: string | undefined; color?: string | undefined }>): Promise<void> {
    // API doc: https://docs.gitlab.com/ee/api/labels.html#edit-an-existing-label
    await Promise.all(labels.map(label => {
      return this.rawClient.Labels.edit(this.id, label.current_name, {
        color: this.parseColor(label.color),
        description: label.description,
      });
    }));
  }

  public async createLabels(labels: Array<{ name: string; description: string; color: string; }>): Promise<void> {
    // API doc: https://docs.gitlab.com/ee/api/labels.html#create-a-new-label
    await Promise.all(labels.map(async label => {
      return this.rawClient.Labels.create(this.id, label.name, this.parseColor(label.color), {
        description: label.description,
      });
    }));
  }

  public async merge(num: number): Promise<void> {
    await this.rawClient.MergeRequests.accept(this.id, num, {
      squash: true,
    });
  }

  public async assign(num: number, login: string): Promise<void> {
    // Need to get user id by login first
    try {
      const user = await this.rawClient.Users.search(login) as any;
      if (user && Array.isArray(user) && user.length > 0) {
        const userId = user[0].id;
        // API doc: https://docs.gitlab.com/ee/api/issues.html#edit-issue
        await this.rawClient.Issues.edit(this.id, num, {
          assignee_ids: [ userId ],
        });
      }
    } catch (e) {
      this.logger.error(e);
    }
  }

  private parseColor<T>(color: T): T {
    if (!color) return color;
    if (!(color as any).startsWith('#')) {
      color = `#${color}` as any;
    }
    return (color as any).toUpperCase();
  }

  public createCheckRun(check: CheckRun): Promise<void> {
    this.logger.info(check);
    return new Promise(() => {});
  }

  public async newBranch(newBranchName: string, baseBranchName: string, cb?: () => void): Promise<void> {
    // todo: test
    this.logger.info(newBranchName, baseBranchName);
    await this.rawClient.Branches.create(this.id, newBranchName, baseBranchName);
    if (cb) cb();
  }

  public async createOrUpdateFile(filePath: string, content: string, commitMessgae: string, branchName: string, cb?: () => void): Promise<void> {
    // todo: test
    this.logger.info(filePath, content, commitMessgae, branchName);
    await this.rawClient.RepositoryFiles.create(this.id, filePath, branchName, content, commitMessgae);
    if (cb) cb();
  }

  public async newPullRequest(option: CreatePullRequestOption): Promise<void> {
    // todo: test
    this.logger.info('New pull request', option);
    this.rawClient.MergeRequests.create(this.id, option.head, option.base, option.title, {
      description: option.body,
      allow_collaboration: option.allowModify,
    });
    return new Promise(() => { });
  }
}
