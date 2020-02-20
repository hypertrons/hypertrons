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
import { Application } from 'egg';
import { GitLabApp } from './GitLabApp';
import { GitLabClient } from './GitLabClient';
import { Gitlab } from 'gitlab';
import { GitLabConfig } from './GitLabConfig';
import { getConfigMeta } from '../../config-generator/decorators';

export class GitLabManager extends HostingManagerBase<GitLabApp, GitLabClient, Gitlab, GitLabConfig> {

  constructor(config: null, app: Application) {
    super(config, app);
    this.type = 'gitlab';
  }

  protected async getNewHostingPlatform(id: number, config: GitLabConfig): Promise<GitLabApp> {
    return new GitLabApp(id, config, this.app);
  }

  public getConfigType(): any {
    return getConfigMeta(GitLabConfig);
  }

}
