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
import { Repo } from '../../basic/DataTypes';
import { Application } from 'egg';
import { DataCat } from 'github-data-cat';

export class GitHubClient extends HostingClientBase<Octokit> {

  private owner: string;
  private repo: string;
  private dataCat: DataCat;
  private repoData: Repo;

  constructor(name: string, hostId: number, app: Application, dataCat: DataCat) {
    super(name, hostId, app);
    ({ owner: this.owner, repo: this.repo } = parseRepoName(name));
    this.dataCat = dataCat;
    this.updateData();
  }

  private async updateData(): Promise<void> {
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

    this.repoData = {
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
    };
  }

  public async getFileContent(path: string): Promise<string | undefined> {
    try {
      const res = await this.rawClient.repos.getContents({
        owner: this.owner,
        repo: this.repo,
        path,
      });
      const content = (res.data as any).content;
      return Buffer.from(content, 'base64').toString('ascii');
    } catch (e) {
      return undefined;
    }
  }

  public getData(): Repo {
    return this.repoData;
  }

  public getConfig<T>(comp: string): T {
    return this.config[comp];
  }
}
