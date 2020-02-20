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

import { HostingManagerBase } from '../../basic/HostingPlatform/HostingManagerBase';
import { GitHubApp } from './GitHubApp';
import { GitHubClient } from './GitHubClient';
import Octokit = require('@octokit/rest');
import { GitHubConfig } from './GitHubConfig';
import { Application } from 'egg';
import { getConfigMeta } from '../../config-generator/decorators';

export class GitHubManager extends HostingManagerBase<GitHubApp, GitHubClient, Octokit, GitHubConfig> {

  constructor(config: null, app: Application) {
    super(config, app);
    this.type = 'github';
  }

  protected async getNewHostingPlatform(id: number, config: GitHubConfig): Promise<GitHubApp> {
    return new GitHubApp(id, config, this.app);
  }

  public getConfigType(): any {
    return getConfigMeta(GitHubConfig);
  }

}
