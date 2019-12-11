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

import { HostingClientBase } from '../../basic/HostingPlatform/HostingClientBase';
import { parseRepoName, ParseDate, waitUntil } from '../../basic/Utils';
import Octokit = require('@octokit/rest');
import { CheckRun } from '../../basic/DataTypes';
import { Application } from 'egg';
import { DataCat } from 'github-data-cat';
import { RepoData } from '../../basic/HostingPlatform/RepoData';

export class GitHubClient extends HostingClientBase<Octokit> {

  private owner: string;
  private repo: string;
  private repoName: {owner: string, repo: string};
  private dataCat: DataCat;

  constructor(name: string, hostId: number, app: Application, dataCat: DataCat) {
    super(name, hostId, app);
    this.repoName = parseRepoName(name);
    ({ owner: this.owner, repo: this.repo } = this.repoName);
    this.dataCat = dataCat;
  }

  protected async updateData(): Promise<void> {
    this.logger.info(`Start to update data for ${this.name}`);

    const dataCat = this.dataCat;
    await waitUntil(() => dataCat.inited);

    const full = await dataCat.repo.full(this.owner, this.repo, {
        contributors: true,
        issues: true,
        stars: true,
        forks: true,
        pulls: true,
      });

    this.repoData.setRepoData({
      ...full,
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
          createdAt: new Date(issue.createdAt),
          updatedAt: new Date(issue.updatedAt),
          closedAt: ParseDate(issue.closedAt),
          comments: issue.comments.map(comment => {
            return {
              ...comment,
              createdAt: new Date(comment.createdAt),
            };
          }),
        };
      }),
      pulls: full.pulls.map(pull => {
        return {
          ...pull,
          createdAt: new Date(pull.createdAt),
          updatedAt: new Date(pull.updatedAt),
          closedAt: ParseDate(pull.closedAt),
          mergedAt: ParseDate(pull.mergedAt),
          comments: pull.comments.map(c => {
            return {
              ...c,
              createdAt: new Date(c.createdAt),
            };
          }),
          reviewComments: pull.reviewComments.map(rc => {
            return {
              ...rc,
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

  public async getFileContent(path: string): Promise<string | undefined> {
    try {
      const res = await this.rawClient.repos.getContents({
        ...this.repoName,
        path,
      });
      const content = (res.data as any).content;
      return Buffer.from(content, 'base64').toString('ascii');
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

  public async listLabels(): Promise<Array<{name: string, description: string, color: string}>> {
    const res = await this.rawClient.issues.listLabelsForRepo({
      ...this.repoName,
      per_page: 100,
    });
    return res.data.map(r => {
      return {
        name: r.name,
        description: r.description,
        color: r.color,
      };
    });
  }

  public async updateIssue(number: number, update: {title?: string, body?: string, state?: 'open' | 'closed'}): Promise<void> {
    await this.rawClient.issues.update({
      ...this.repoName,
      issue_number: number,
      ...update,
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

  public async createLabels(labels: Array<{name: string, description: string, color: string}>): Promise<void> {
    await Promise.all(labels.map(label => {
      return this.rawClient.issues.createLabel({
        ...this.repoName,
        ...label,
      });
    }));
  }

  public async updateLabels(labels: Array<{ current_name: string; name?: string; description?: string; color?: string; }>): Promise<void> {
    await Promise.all(labels.map(label => {
      if (!label.description && !label.color) return;
      return this.rawClient.issues.updateLabel({
        ...this.repoName,
        ...label,
      });
    }));
  }

  public async createCheckRun(check: CheckRun): Promise<void> {
    const res = await this.rawClient.checks.create(check);
    this.logger.info(`new check result ${res.status}`);
  }

  public async merge(num: number): Promise<void> {
    await this.rawClient.pulls.merge({
      ...this.repoName,
      pull_number: num,
      merge_method: 'squash',
    });
  }

  public getData(): RepoData {
    return this.repoData;
  }

}
