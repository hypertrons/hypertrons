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

import { AppPluginBase } from '../../basic/AppPluginBase';
import { Application } from 'egg';
import { Repo } from '../../basic/DataTypes';
import { AutoCreateMap } from '../../basic/Utils';
import { GitHubDataManagerConfig } from './GitHubDataManagerConfig';
import { GitHubManagerDataLoadedEvent } from '../event-manager/events';
import { GitHubRepoInitEvent } from '../github-client-manager/events';

export class AppGitHubDataManager extends AppPluginBase<GitHubDataManagerConfig> {

  private repoData: AutoCreateMap<number, Map<string, Repo>>;

  constructor(config: GitHubDataManagerConfig, app: Application) {
    super(config, app);
    this.repoData = new AutoCreateMap<number, Map<string, Repo>>(() => new Map<string, Repo>());
  }

  public async onReady(): Promise<void> {
    this.app.event.subscribeOne(GitHubRepoInitEvent, async e => {
      this.LoadRepoData(e.installationId, e.fullName);
    });
    this.app.event.subscribeAll(AppGitHubDataManagerInteranlLoadedEvent, async e => {
      this.logger.info(`Start to update data for ${e.fullName}.`);
      this.repoData.get(e.installationId).set(e.fullName, e.data);
    });
  }

  public async onStart(): Promise <void> { }

  public async onClose(): Promise <void> { }

  private async LoadRepoData(installationId: number, name: string): Promise <void> {
    this.logger.info(`Start to load repo data for ${name}`);
    const data: Repo = {} as any;
    this.app.event.publish('workers', AppGitHubDataManagerInteranlLoadedEvent, {
      installationId,
      fullName: name,
      data,
    });
    this.app.event.publish('all', GitHubManagerDataLoadedEvent, {
      installationId,
      fullName: name,
    });
  }

  /**
   * Get full repo data by installation id and repo name
   * @param installationId installation id
   * @param fullName repo name
   */
  public GetRepoData(installationId: number, fullName: string): Repo | undefined {
    if (!this.repoData.has(installationId)) {
      return undefined;
    }
    return this.repoData.get(installationId).get(fullName);
  }
}

class AppGitHubDataManagerInteranlLoadedEvent {
  installationId: number;
  fullName: string;
  data: Repo;
}
