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

import { HostingBase } from '../../basic/HostingPlatform/HostingBase';
import { GitLabConfig } from './GitLabConfig';
import { GitLabClient } from './GitLabClient';
import { Gitlab } from 'gitlab';
import { Application } from 'egg';

export class GitLabApp extends HostingBase<GitLabConfig, GitLabClient, Gitlab> {

  private client: Gitlab;

  constructor(id: number, config: GitLabConfig, app: Application) {
    super(id, config, app);
    this.client = new Gitlab({
      host: this.config.host,
      token: this.config.primaryToken,
    });
  }

  public async getInstalledRepos(): Promise<Array<{ fullName: string; payload: any; }>> {
    const projects = (await this.client.Projects.all()) as any[];
    if (!projects) return [];
    this.logger.info(`Get ${projects.length} raw repos for ${this.name}`);
    const ret: Array<{ fullName: string; payload: any; }> = [];
    await Promise.all(projects.map(async p => {
      try {
        const c = await this.client.RepositoryFiles.showRaw(p.id, this.config.config.remote.filePath, 'master');
        if (c) {
          ret.push({
            fullName: p.name,
            payload: p.id,
          });
        }
      // tslint:disable-next-line: no-empty
      } catch {}
    }));
    return ret;
  }

  protected async addRepo(name: string, payload: any): Promise<void> {
    const client = new GitLabClient(name, this.id, this.app, payload, this.client);
    this.clientMap.set(name, async () => client);
  }

  protected async initWebhook(_: GitLabConfig): Promise<void> { }

}
