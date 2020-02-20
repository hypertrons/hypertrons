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
import { GiteeApp } from './gitee-app';
import { GiteeClient } from './gitee-client';
import { GiteeConfig } from './gitee-config';
import { getConfigMeta } from '../../config-generator/decorators';
import { GiteeRawClient } from './gitee-raw-client/gitee-raw-client';

export class GiteeManager extends HostingManagerBase<GiteeApp, GiteeClient, GiteeRawClient, GiteeConfig> {

  constructor(config: null, app: Application) {
    super(config, app);
    this.type = 'gitee';
  }

  protected async getNewHostingPlatform(id: number, config: GiteeConfig): Promise<GiteeApp> {
    return new GiteeApp(id, config, this.app);
  }

  public getConfigType(): any {
    return getConfigMeta(GiteeConfig);
  }

}
