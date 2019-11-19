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

import Octokit = require('@octokit/rest');
import { IClient } from '../../installation-manager/IClient';
import { parseRepoName, BotLogger } from '../../../basic/Utils';
import { GitHubInstallation } from '../github-installation/GitHubInstallation';
import { Repo } from '../../../basic/DataTypes';

export class GitHubClient implements IClient {

  public name: string;
  public owner: string;
  public repo: string;
  public rawClient: Octokit;
  public installation: GitHubInstallation;
  private repoData: Repo;
  private logger: BotLogger;

  constructor(name: string, installation: GitHubInstallation) {
    this.name = name;
    const { owner, repo } = parseRepoName(this.name);
    this.owner = owner;
    this.repo = repo;
    this.installation = installation;
    this.logger = this.installation.githubInstallationManager.logger;
    this.updateData();
  }

  private async updateData(): Promise<void> {
    this.logger.info(`Start to update data for ${this.name} in ${this.installation.id}`);
  }

  public async getFileContent(path: string): Promise<string | undefined > {
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

  public getRepoDate(): Repo {
    return this.repoData;
  }

}
