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
import { parseRepoName, ParseDate } from '../../basic/Utils';
import { Octokit } from '@octokit/rest';
import { CheckRun, CreatePullRequestOption, RepoDir, RepoFile } from '../../basic/DataTypes';
import { Application } from 'egg';
import { DataCat } from 'github-data-cat';
import { RepoDataService } from '../../basic/HostingPlatform/HostingClientService/RepoDataService';
import { GitHubConfig } from './GitHubConfig';
import { GitHubApp } from './GitHubApp';
import { HostingBase } from '../../basic/HostingPlatform/HostingBase';

export class GitHubClient extends HostingClientBase<GitHubConfig, Octokit> {

  private owner: string;
  private repo: string;
  private repoName: { owner: string, repo: string };
  private githubApp: GitHubApp;
  private id: number;
  private installationId: number;

  constructor(name: string, hostId: number, app: Application, installationId: number, id: number,
    hostBase: HostingBase<GitHubConfig, HostingClientBase<GitHubConfig, Octokit>, Octokit>) {
    super(name, hostId, app, hostBase);
    this.githubApp = hostBase as unknown as GitHubApp;
    this.id = id;
    this.installationId = installationId;
    this.repoName = parseRepoName(name);
    // setup client and reset token before every request
    this.rawClient = this.githubApp.getOctokitInstance(this.installationId);
    ({ owner: this.owner, repo: this.repo } = this.repoName);
  }

  protected async updateData(): Promise<void> {
    this.logger.info(`Start to update data for ${this.fullName}`);

    // generate 4 tokens to get data in case insufficient rate limit
    const tokens = [
      await this.githubApp.getAccessToken(this.installationId, this.id),
      await this.githubApp.getAccessToken(this.installationId, this.id),
      await this.githubApp.getAccessToken(this.installationId, this.id),
      await this.githubApp.getAccessToken(this.installationId, this.id),
    ];
    const dataCat = new DataCat({
      tokens,
      maxConcurrentReqNumber: 1, // use a minimal concurrent request to avoid API abuse
    });
    await dataCat.init();

    const full = await dataCat.repo.full(this.owner, this.repo, {
      contributors: true,
      issues: true,
      stars: true,
      forks: true,
      pulls: true,
      withOwner: false,
    });

    this.repoDataService.setRepoData({
      ...full,
      id: parseInt(full.id),
      stars: full.stars.map(star => {
        return {
          ...star,
          time: new Date(star.time),
        };
      }),
      forks: full.forks.map(fork => {
        return {
          ...fork,
          time: new Date(fork.time),
        };
      }),
      issues: full.issues.map(issue => {
        return {
          ...issue,
          id: parseInt(issue.id),
          createdAt: new Date(issue.createdAt),
          updatedAt: new Date(issue.updatedAt),
          closedAt: ParseDate(issue.closedAt),
          comments: issue.comments.map(comment => {
            return {
              ...comment,
              id: parseInt(comment.id),
              createdAt: new Date(comment.createdAt),
            };
          }),
        };
      }),
      pulls: full.pulls.map(pull => {
        return {
          ...pull,
          id: parseInt(pull.id),
          createdAt: new Date(pull.createdAt),
          updatedAt: new Date(pull.updatedAt),
          closedAt: ParseDate(pull.closedAt),
          mergedAt: ParseDate(pull.mergedAt),
          comments: pull.comments.map(c => {
            return {
              ...c,
              id: parseInt(c.id),
              createdAt: new Date(c.createdAt),
            };
          }),
          reviewComments: pull.reviewComments.map(rc => {
            return {
              ...rc,
              id: parseInt(rc.id),
              createdAt: new Date(rc.createdAt),
            };
          }),
        };
      }),
      contributors: full.contributors.map(c => {
        return {
          ...c,
          time: new Date(c.time),
        };
      }),
    });
  }

  public async getFileContent(path: string, ref?: string): Promise<RepoFile | undefined> {
    try {
      let res;
      if (ref) {
        res = await this.rawClient.repos.getContent({
          ...this.repoName,
          path,
          ref,
        });
      } else {
        res = await this.rawClient.repos.getContent({
          ...this.repoName,
          path,
        });
      }
      res = res.data;
      if (res.content && res.encoding === 'base64') {
        res.content = Buffer.from(res.content, 'base64').toString('ascii');
        delete res.encoding;
      }
      return res;
    } catch (e) {
      return undefined;
    }
  }

  public async getDirectoryContent(path: string, ref?: string): Promise<RepoDir[] | undefined> {
    try {
      let res;
      if (ref) {
        res = await this.rawClient.repos.getContent({
          ...this.repoName,
          path,
          ref,
        });
      } else {
        res = await this.rawClient.repos.getContent({
          ...this.repoName,
          path,
        });
      }
      return res.data;
    } catch (e) {
      return undefined;
    }
  }

  public async addIssue(title: string, body: string, labels?: string[] | undefined): Promise<void> {
    await this.rawClient.issues.create({
      ...this.repoName,
      title,
      body,
      labels,
    });
  }

  public async listLabels(): Promise<Array<{ name: string, description: string, color: string }>> {
    const res = await this.rawClient.issues.listLabelsForRepo({
      ...this.repoName,
      per_page: 100,
    });
    return res.data.map(r => {
      return {
        name: r.name,
        description: r.description ?? '',
        color: r.color,
      };
    });
  }

  public async updateIssue(number: number, update: { title?: string, body?: string, state?: 'open' | 'closed' }): Promise<void> {
    await this.rawClient.issues.update({
      ...this.repoName,
      issue_number: number,
      ...update,
    });
  }

  public async updatePull(number: number, update: {
    title?: string;
    body?: string;
    state?: 'open' | 'closed'
  }): Promise<void> {
    await this.rawClient.issues.update({
      ...this.repoName,
      issue_number: number,
      ...update,
    });
  }

  public async updateIssueComment(comment_id: number, body: string): Promise<void> {
    await this.rawClient.issues.updateComment({
      ...this.repoName,
      comment_id,
      body,
    });
  }

  public async addIssueComment(number: number, body: string): Promise<void> {
    await this.rawClient.issues.createComment({
      ...this.repoName,
      issue_number: number,
      body,
    });
  }

  public async addAssignees(number: number, assignees: string[]): Promise<void> {
    await this.rawClient.issues.addAssignees({
      ...this.repoName,
      issue_number: number,
      ...assignees,
    });
  }

  public async addLabels(number: number, labels: string[]): Promise<void> {
    await this.rawClient.issues.addLabels({
      ...this.repoName,
      issue_number: number,
      labels,
    });
  }

  public async removeLabel(number: number, label: string): Promise<void> {
    await this.rawClient.issues.removeLabel({
      owner: this.owner,
      repo: this.repo,
      issue_number: number,
      name: label,
    });
  }

  public async createLabels(labels: Array<{ name: string, description: string, color: string }>): Promise<void> {
    await Promise.all(labels.map(label => {
      return this.rawClient.issues.createLabel({
        ...this.repoName,
        ...label,
      });
    }));
  }

  public async updateLabels(labels: Array<{ current_name: string; name?: string; description?: string; color?: string; }>): Promise<void> {
    await Promise.all(labels.map(label => {
      if (!label.description && !label.color) return null;
      return this.rawClient.issues.updateLabel({
        ...this.repoName,
        ...label,
        name: label.current_name,
      });
    }));
  }

  public async createCheckRun(check: CheckRun): Promise<void> {
    // const res = await this.rawClient.checks.create(check);
    this.logger.info(`new check result ${check}`);
  }

  public async merge(num: number): Promise<void> {
    await this.rawClient.pulls.merge({
      ...this.repoName,
      pull_number: num,
      merge_method: 'squash',
    });
  }

  public async assign(num: number, login: string): Promise<void> {
    await this.rawClient.issues.addAssignees({
      ...this.repoName,
      issue_number: num,
      assignees: [
        login,
      ],
    });
  }

  public getData(): RepoDataService<GitHubConfig, Octokit> {
    return this.repoDataService;
  }

  public async getCommits(path: string): Promise<string[]> {
    const res = await this.rawClient.repos.listCommits({
      ...this.repoName,
      path,
      per_page: 100,
    });
    return res.data.map(r => {
      return r.sha;
    });
  }

  public async newBranch(newBranchName: string, baseBranchName: string, cb?: () => void): Promise<void> {
    this.logger.info('new a branch', newBranchName, 'from', baseBranchName);
    const res = await this.rawClient.git.getRef({
      repo: this.repo,
      owner: this.owner,
      ref: 'heads/' + baseBranchName,
    });

    await this.rawClient.git.createRef({
      repo: this.repo,
      owner: this.owner,
      ref: 'refs/heads/' + newBranchName,
      sha: res.data.object.sha,
    });

    if (cb) {
      cb();
    }
  }

  public async createOrUpdateFile(filePath: string, content: string, commitMessgae: string, branchName: string, cb?: () => void): Promise<void> {
    this.logger.info('createOrUpdateFile:', filePath);
    const content64 = Buffer.from(content).toString('base64');

    // need to get file first, if exist, need to pass sha in
    const originFile = await this.getFileContent(filePath);
    let sha: string | undefined;
    if (originFile) {
      sha = originFile.sha;
    }
    await this.rawClient.repos.createOrUpdateFileContents({
      repo: this.repo,
      owner: this.owner,
      content: content64,
      message: commitMessgae,
      path: filePath,
      branch: branchName,
      sha,
    });

    if (cb) {
      cb();
    }
  }

  public async newPullRequest(option: CreatePullRequestOption): Promise<void> {
    this.logger.info(option);
    await this.rawClient.pulls.create({
      owner: this.owner,
      repo: this.repo,
      base: option.base,
      head: option.head,
      maintainer_can_modify: option.allowModify,
      title: option.title,
      body: option.body,
    });
  }

}
