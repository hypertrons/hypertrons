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

import { IClient } from '../installation-manager/IClient';
import Octokit = require('@octokit/rest');
import { parseRepoName } from '../../basic/Utils';

export class AppGitHubClient implements IClient {
  public installationId: number;
  public name: string;
  public owner: string;
  public repo: string;
  public rawClient: Octokit;

  constructor(installationId: number, name: string) {
    this.installationId = installationId;
    this.name = name;
    const { owner, repo } = parseRepoName(name);
    this.owner = owner;
    this.repo = repo;
    this.rawClient = new Octokit();
  }

  public async getFileContent(filePath: string): Promise<string | undefined> {
    try {
      const res = await this.rawClient.repos.getContents({
        owner: this.owner,
        repo: this.repo,
        path: filePath,
      });
      const content = (res.data as any).content;
      return Buffer.from(content, 'base64').toString('ascii');
    } catch (e) {
      return undefined;
    }
  }

}
