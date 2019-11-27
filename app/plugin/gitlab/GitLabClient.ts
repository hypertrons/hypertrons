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
import { Gitlab } from 'gitlab';
import { Application } from 'egg';
import { CIRunOutput } from '../../basic/DataTypes';

export class GitLabClient extends HostingClientBase<Gitlab> {

  private id: number;

  constructor(name: string, hostId: number, app: Application, id: number, client: Gitlab) {
    super(name, hostId, app);
    this.id = id;
    this.rawClient = client;
  }

  public async getFileContent(path: string): Promise<string | undefined> {
    const res = await this.rawClient.RepositoryFiles.showRaw(this.id, path, 'master');
    return res as any;
  }

  public async addIssue(title: string, body: string, labels?: string[] | undefined): Promise<void> {
    // API doc: https://docs.gitlab.com/ee/api/issues.html#new-issue
    await this.rawClient.Issues.create(this.id, {
      title,
      description: body,
      labels: labels ? labels.join(',') : undefined,
    });
  }

  public async listLabels(): Promise<Array<{name: string, description: string, color: string}>> {
    // API doc: https://docs.gitlab.com/ee/api/labels.html#list-labels
    const res = await this.rawClient.Labels.all(this.id) as any[];
    if (!res) return [];
    return res.map(r => {
      return {
        name: r.name,
        description: r.description,
        color: r.color,
      };
    });
  }

  public async addLabels(number: number, labels: string[]): Promise<void> {
    // For issues, API doc: https://docs.gitlab.com/ee/api/issues.html#new-issue
    // For MRs, API doc: https://docs.gitlab.com/ee/api/merge_requests.html#update-mr
    await this.rawClient.Issues.edit(this.id, number, {
      labels: labels.join(','),
    });
  }

  public async updateIssue(number: number, update: {title?: string | undefined; body?: string | undefined; state?: 'open' | 'closed' | undefined; }): Promise<void> {
    // API doc: https://docs.gitlab.com/ee/api/issues.html#edit-issue
    let state_event: any;
    if (update.state === 'open') state_event = 'reopen';
    if (update.state === 'closed') state_event = 'close';
    await this.rawClient.Issues.edit(this.id, number, {
      title: update.title,
      description: update.body,
      state_event,
    });
  }

  public async updateLabels(labels: Array<{ current_name: string; description?: string | undefined; color?: string | undefined }>): Promise<void> {
    // API doc: https://docs.gitlab.com/ee/api/labels.html#edit-an-existing-label
    await Promise.all(labels.map(label => {
      return this.rawClient.Labels.edit(this.id, label.current_name, {
        color: this.parseColor(label.color),
        description: label.description,
      });
    }));
  }

  public async createLabels(labels: Array<{ name: string; description: string; color: string; }>): Promise<void> {
    // API doc: https://docs.gitlab.com/ee/api/labels.html#create-a-new-label
    await Promise.all(labels.map(async label => {
      return this.rawClient.Labels.create(this.id, label.name, this.parseColor(label.color), {
        description: label.description,
      });
    }));
  }

  private parseColor<T>(color: T): T {
    if (!color) return color;
    if (!(color as any).startsWith('#')) {
      color = `#${color}` as any;
    }
    return (color as any).toUpperCase();
  }

  public createCheckRun(check: CIRunOutput): Promise<void> {
    this.logger.info(check);
    return new Promise(() => {});
  }
}
