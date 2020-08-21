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
import { GiteeConfig } from './gitee-config';
import { GiteeRawClient } from './gitee-raw-client/gitee-raw-client';
import { Application } from 'egg';
import { HostingBase } from '../../basic/HostingPlatform/HostingBase';
import { parseRepoName } from '../../basic/Utils';
import { convertIssueNumber2Number, convertIssueNumber2String } from './util';
import { CreatePullRequestOption, RepoFile, RepoDir } from '../../basic/DataTypes';

export class GiteeClient extends HostingClientBase<GiteeConfig, GiteeRawClient> {

  private repoName: { owner: string, repo: string };

  constructor(name: string, hostId: number, app: Application, client: GiteeRawClient, hostBase: HostingBase<GiteeConfig, HostingClientBase<GiteeConfig, GiteeRawClient>, GiteeRawClient>) {
    super(name, hostId, app, hostBase);
    this.repoName = parseRepoName(this.fullName);
    this.rawClient = client;
  }

  public async updateData() {
    this.logger.info(`Start to update data for ${this.fullName}`);
    // get neccessary data from all API
    const rawRepoData = await this.rawClient.repos.getRepoData(this.repoName);
    const contributors = await this.rawClient.repos.getContributors(this.repoName);
    const issues = await this.rawClient.issues.all(this.repoName);
    const issueComments = await this.rawClient.issues.allComments(this.repoName);
    // starts has no data source
    // const stars;
    const forks = await this.rawClient.repos.getForks(this.repoName);
    const pulls = await this.rawClient.pulls.all(this.repoName);
    const pullComments = await this.rawClient.pulls.allComments(this.repoName);
    // set format repo data
    const formatRepoData = {
      id: rawRepoData.id,
      owner: rawRepoData.full_name.split('/')[0],
      ownerInfo: {
        login: rawRepoData.owner.login,
        __typename: rawRepoData.owner.type,
        name: rawRepoData.owner.name,
        bio: '',
        description: '',
        createdAt: null,
        company: '',
        location: '',
        websiteUrl: null,
        repositories: {
          totalCount: 0,
        },
        membersWithRole: {
          totalCount: 0,
        },
      },
      name: rawRepoData.name,
      license: rawRepoData.license,
      codeOfConduct: null,
      createdAt: new Date(rawRepoData.created_at),
      updatedAt: new Date(rawRepoData.updated_at),
      pushedAt: new Date(rawRepoData.pushed_at),
      isFork: rawRepoData.fork,
      description: rawRepoData.description,
      language: rawRepoData.language,
      starCount: rawRepoData.stargazers_count,
      // stars
      stars: [],
      watchCount: rawRepoData.watchers_count,
      forkCount: rawRepoData.forks_count,
      directForkCount: 0,
      // forks
      forks: forks.map(f => {
        return {
          login: f.owner.login,
        };
      }),
      branchCount: 1,
      defaultBranchName: 'master',
      defaultBranchCommitCount: 1,
      releaseCount: 0,
      // issues
      issues: issues.map(i => {
        return {
          id: i.id,
          author: i.user.login,
          number: convertIssueNumber2Number(i.number),
          createdAt: new Date(i.created_at),
          updatedAt: new Date(i.updated_at),
          closedAt: new Date(i.closed_at),
          title: i.title,
          body: i.body,
          labels: i.labels,
          // based on all issues' comments, set specific issue comments
          comments: issueComments.filter(ic => {
            return ic.target.issue.number === i.number;
          }).map(ic => {
            return {
              id: ic.id,
              author: ic.user.login,
              body: ic.body,
              url: '',
              createdAt: new Date(ic.created_at),
            };
          }),
        };
      }),
      // pulls
      pulls: pulls.map(p => {
        return {
          id: p.id,
          author: p.user.login,
          number: p.number,
          createdAt: new Date(p.created_at),
          updatedAt: new Date(p.updated_at),
          closedAt: new Date(p.closed_at),
          mergedAt: new Date(p.merged_at),
          title: p.title,
          body: p.body,
          labels: p.labels,
          comments: pullComments.filter(pc => {
            return pc.target.issue.number === p.number;
          }).map(pc => {
            return {
              id: pc.id,
              author: pc.user.login,
              body: pc.body,
              createdAt: new Date(pc.created_at),
            };
          }),
          reviewComments: [],
          additions: 0,
          deletions: 0,
        };
      }),
      // contributors
      contributors: contributors.map(c => {
        return {
          login: c.name,
          email: c.email,
        };
      }),
    };
    this.repoDataService.setRepoData(formatRepoData);
  }

  public async getFileContent(path: string): Promise<RepoFile | undefined> {
    /// API doc: https://gitee.com/api/v5/swagger#/getV5ReposOwnerRepoContents(Path)
    try {
      const res = await this.rawClient.repos.getContents({
        ...this.repoName,
        path,
      });
      if (res.content && res.encoding === 'base64') {
        res.content = Buffer.from(res.content, 'base64').toString('ascii');
        delete res.encoding;
      }
      return res;
    } catch (e) {
      return undefined;
    }
  }

  public getDirectoryContent(_: string): Promise<RepoDir[] | undefined> {
    // TODO
    throw new Error('Method not implemented.');
  }

  public async addIssueComment(number: number, body: string): Promise<void> {
    // API doc: https://gitee.com/api/v5/swagger#/postV5ReposOwnerRepoIssuesNumberComments
    await this.rawClient.issues.createComment({
      ...this.repoName,
      number: convertIssueNumber2String(number),
      body,
    });
  }

  public async updateIssueComment(_comment_id: number, _body: string): Promise<void> {
    return;
  }

  public async addIssue(title: string, body: string, labels?: string[] | undefined): Promise<void> {
    // API doc: https://gitee.com/api/v5/swagger#/postV5ReposOwnerIssues
    await this.rawClient.issues.create({
      ...this.repoName,
      title,
      body,
      labels,
    });
  }

  // notice: issue number in gitee is a string like 'I18O1N', not a real number.
  public async updateIssue(number: number, update: { title?: string, body?: string, state?: 'open' | 'closed' }): Promise<void> {
    // API doc: https://gitee.com/api/v5/swagger#/patchV5ReposOwnerIssuesNumber
    await this.rawClient.issues.update({
      ...this.repoName,
      number: convertIssueNumber2String(number),
      ...update,
    });
  }

  public async assign(number: number, login: string): Promise<void> {
    // API doc: https://gitee.com/api/v5/swagger#/patchV5ReposOwnerIssuesNumber
    await this.rawClient.issues.update({
      ...this.repoName,
      number: convertIssueNumber2String(number),
      assignee: login,
    });
  }

  // notice: pull number in gitee is a ordinal number, different from issue number.
  public async updatePull(number: number, update: {
    title?: string;
    body?: string;
    state?: 'open' | 'closed'
  }): Promise<void> {
    // API doc: https://gitee.com/api/v5/swagger#/patchV5ReposOwnerRepoPullsNumber
    await this.rawClient.pulls.update({
      ...this.repoName,
      number,
      ...update,
    });
  }

  public async listLabels(): Promise<Array<{ name: string, description: string, color: string }>> {
    // API doc: https://gitee.com/api/v5/swagger#/getV5ReposOwnerRepoLabels
    const res = await this.rawClient.issues.listLabelsForRepo({
      ...this.repoName,
    });
    return res.map(r => {
      return {
        name: r.name,
        description: r.description,
        color: r.color,
      };
    });
  }

  public async addLabels(number: number, labels: string[]): Promise<void> {
    // Notice: transformed issue number have 12 digits,
    // must be greater than 10000
    if (number > 10000) {
      // For issues, API doc: https://gitee.com/api/v5/swagger#/postV5ReposOwnerRepoIssuesNumberLabels
      await this.rawClient.issues.addLabel({
        ...this.repoName,
        number: convertIssueNumber2String(number),
        labels,
      });
    } else {
      // For MRs, API doc: https://gitee.com/api/v5/swagger#/putV5ReposOwnerRepoPullsNumberLabels
      const pull = this.getRepoData().pulls.find(p => {
        p.number = number;
      });
      if (!pull) return;
      labels.push(...pull.labels);
      await this.rawClient.pulls.addLabel({
        ...this.repoName,
        number,
        labels,
      });
    }
  }

  public async updateLabels(labels: Array<{ current_name: string; name?: string; description?: string; color?: string; }>): Promise<void> {
    // API doc: https://gitee.com/api/v5/swagger#/patchV5ReposOwnerRepoLabelsOriginalName
    await Promise.all(labels.map(label => {
      // gitee's labels have no description
      if (!label.color) return;
      return this.rawClient.issues.updateLabel({
        ...this.repoName,
        ...label,
      });
    }));
  }

  public async removeLabel(_number: number, _label: string): Promise<void> {
    return;
  }

  public async createLabels(labels: Array<{ name: string, description: string, color: string }>): Promise<void> {
    // API doc: https://gitee.com/api/v5/swagger#/postV5ReposOwnerRepoLabels
    await Promise.all(labels.map(label => {
      return this.rawClient.issues.createLabel({
        ...this.repoName,
        ...label,
      });
    }));
  }

  public async createCheckRun() {
    return;
  }

  public async merge(number: number): Promise<void> {
    // API doc: https://gitee.com/api/v5/swagger#/putV5ReposOwnerRepoPullsNumberMerge
    await this.rawClient.pulls.merge({
      ...this.repoName,
      number,
      merge_method: 'squash',
    });
  }

  public async newBranch(newBranchName: string, baseBranchName: string, cb?: () => void): Promise<void> {
    // TODO
    this.logger.info(newBranchName, baseBranchName);
    if (cb) cb();
    return new Promise(() => {});
  }

  public async createOrUpdateFile(filePath: string, content: string, commitMessgae: string, branchName: string, cb?: () => void): Promise<void> {
    // TODO
    this.logger.info(filePath, content, commitMessgae, branchName);
    if (cb) cb();
    return new Promise(() => {});
  }

  public async newPullRequest(option: CreatePullRequestOption): Promise<void> {
    // TODO
    this.logger.info(option);
    return new Promise(() => { });
  }

}
