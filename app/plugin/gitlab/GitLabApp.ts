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
import { Application, Context } from 'egg';
import SmeeClient from 'smee-client';
import { resolve } from 'url';
import { IssueEvent } from '../event-manager/events';

export class GitLabApp extends HostingBase<GitLabConfig, GitLabClient, Gitlab> {

  private client: Gitlab;
  private webhooksPath: string;

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
            fullName: p.path_with_namespace,
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
    this.initWebhooksForRepo(name, payload, this.webhooksPath);
  }

  protected async initWebhook(config: GitLabConfig): Promise<void> {
    const webhookConfig = config.webhook;
    const subPath = this.post(webhookConfig.path, async (ctx: Context, next: any) => {
      ctx.body = 'ok';
      const secret = ctx.headers['x-gitlab-token'];
      if (secret !== webhookConfig.secret) {
        await next();
        return;
      }
      const event = ctx.headers['x-gitlab-event'];
      const payload = ctx.request.body;
      this.triggerWebhook(event, payload);
      await next();
    });
    this.webhooksPath = config.webhook.proxy ? config.webhook.proxy : resolve(config.webhook.host, subPath);
    if (webhookConfig.proxy) {
      const port = (this.app as any).server.address().port;
      const localPath = resolve(`http://localhost:${port}`, subPath);
      const smee = new SmeeClient({
        source: webhookConfig.proxy,
        target: localPath,
        logger: this.logger,
      });
      smee.start();
    }
  }

  private async initWebhooksForRepo(name: string, id: number, webhooksPath: string) {
    // API doc: https://docs.gitlab.com/ee/user/project/integrations/webhooks.html
    // Webhooks doc: https://docs.gitlab.com/ee/user/project/integrations/webhooks.html
    const currentWebhooks = await this.client.ProjectHooks.all(id) as any[];
    const hook = currentWebhooks.find(h => h.url === webhooksPath);
    if (!hook) {
      this.logger.info(`Add webhook for ${name}, url=${webhooksPath}`);
      this.client.ProjectHooks.add(id, webhooksPath, {
        push_events: true,
        issues_events: true,
        confidential_issues_events: true,
        merge_requests_events: true,
        note_events: true,
        job_events: true,
        enable_ssl_verification: false,
        token: this.config.webhook.secret,
      });
    }
  }

  private triggerWebhook(event: string, payload: any): void {
    // IssueEvent
    switch (event) {
      case 'Issue Hook':
        const { project: { path_with_namespace: fullName }, object_attributes: issue } = payload;
        const e: IssueEvent = {
          installationId: this.id,
          fullName,
          action: 'opened',
          issue: {
            id: issue.id,
            author: issue.author_id,
            number: issue.iid,
            createdAt: new Date(issue.created_at),
            updatedAt: new Date(issue.updated_at),
            closedAt: null,
            title: issue.title,
            body: issue.description,
            labels: issue.labels.map(l => l.title),
            comments: [],
          },
          changes: {},
        };
        if (issue.action === 'reopen') e.action = 'reopened';
        if (issue.action === 'close') e.action = 'closed';
        this.app.event.publish('all', IssueEvent, e);
        break;
      default:
        break;
    }
  }

}
