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

import { HostingBase } from '../../basic/HostingPlatform/HostingBase';
import { GitLabConfig } from './GitLabConfig';
import { GitLabClient } from './GitLabClient';
import { Gitlab } from 'gitlab';
import { Application, Context } from 'egg';
import SmeeClient from 'smee-client';
import { resolve } from 'url';
import { IssueEvent, PushEvent, CommentUpdateEvent, PullRequestEvent } from '../event-manager/events';
import { GitlabGraphqlClient } from './client/GitlabGraphqlClient';

export class GitLabApp extends HostingBase<GitLabConfig, GitLabClient, Gitlab> {

  private client: Gitlab;
  private webhooksPath: string;
  private gitlabGraphqlClient: GitlabGraphqlClient;
  constructor(id: number, config: GitLabConfig, app: Application) {
    super('gitlab', id, config, app);
    this.client = new Gitlab({
      host: this.config.host,
      token: this.config.primaryToken,
    });
    this.gitlabGraphqlClient = new GitlabGraphqlClient({
      host: this.config.host,
      token: this.config.primaryToken,
      logger: {
        error: console.log,
        info: console.log,
      } as any,
      maxConcurrentReqNumber: 20,
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

  public async addRepo(name: string, payload: any): Promise<void> {
    const client = new GitLabClient(name, this.id, this.app, payload, this.client, this.gitlabGraphqlClient, this);
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
    this.webhooksPath = webhookConfig.proxyUrl ? webhookConfig.proxyUrl : resolve(webhookConfig.host, subPath);
    if (webhookConfig.proxyUrl && webhookConfig.proxyUrl !== '') {
      const port = (this.app as any).server.address().port;
      const localPath = resolve(`http://localhost:${port}`, subPath);
      const smee = new SmeeClient({
        source: webhookConfig.proxyUrl,
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
    // Four types of WebHook is handled here.
    //  1. Issue Hook <gitlab think `label, assignee..` as update action>
    //  2. Push Hook
    //  3. Note Hook
    //  4. Merge Request Hook
    switch (event) {
      case 'Issue Hook':
        const {
          project: { path_with_namespace: fullName },
          object_attributes: issue,
        } = payload;
        const parseAction = (
          o: string,
        ): 'opened' | 'reopened' | 'closed' | undefined => {
          switch (o) {
            case 'open':
              return 'opened';
            case 'reopen':
              return 'reopened';
            case 'close':
              return 'closed';
            default:
              return undefined;
          }
        };
        const e = {
          installationId: this.id,
          fullName,
          action: parseAction(issue.action),
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
        } as any;
        this.app.event.publish('all', IssueEvent, e);
        break;
      case 'Push Hook':
        const {
          ref,
          before,
          after,
          user_username,
          user_email,
          project: { path_with_namespace: push_path },
          commits,
        } = payload;
        const re = {
          installationId: this.id,
          fullName: push_path,
          push: {
            ref,
            before,
            after,
            created: true,
            deleted: false,
            forced: false,
            base_ref: null,
            compare: '',
            head_commit: null,
            repository: undefined,
            pusher: {
              name: user_username,
              email: user_email,
            },
            commits: commits.map(c => {
              return {
                added: c.added,
                removed: c.removed,
                modified: c.modified,
              };
            }),
          },
        };
        this.app.event.publish('all', PushEvent, re);
        break;
      case 'Note Hook':
        // Comment on merge request
        // Comment on issue
        const {
          project: { path_with_namespace: note_path },
          object_attributes: {
            id: pr_issue_id,
            noteable_id,
            author_id,
            note,
            url,
            created_at,
            noteable_type,
          },
        } = payload;

        const ce: CommentUpdateEvent = {
          installationId: this.id,
          fullName: note_path,
          issueNumber: pr_issue_id,
          // gitlab won't send any notification when editing or deleting a comment...
          // We only get notification when create a new comment.
          action: 'created',
          comment: {
            id: noteable_id,
            login: author_id,
            body: note,
            url,
            createdAt: created_at,
          },
          isIssue: noteable_type === 'Issue',
        };
        this.app.event.publish('all', CommentUpdateEvent, ce);
        break;
      case 'Merge Request Hook':
        const {
          project: { path_with_namespace: mr_path },
          object_attributes: {
            iid: mr_id, // iid here, not id
            author_id: mr_author_id,
            created_at: mr_created_at,
            updated_at: mr_updated_at,
            title: mr_title,
            description: mr_description,
            action: mr_action,
          },
          labels: mr_labels,
        } = payload;
        const parsePullRequest = (
          o: string,
        ): 'opened' | 'reopened' | 'closed' | undefined => {
          switch (o) {
            case 'open':
              return 'opened';
            case 'reopen':
              return 'reopened';
            case 'close':
              return 'closed';
            case 'merge':
              return 'closed';
            default:
              return undefined;
          }
        };
        const mre = {
          installationId: this.id,
          fullName: mr_path,
          action: parsePullRequest(mr_action), // least used.
          pullRequest: {
            id: String(mr_id),
            author: mr_author_id,
            number: 0,
            createdAt: new Date(mr_created_at),
            updatedAt: new Date(mr_updated_at),
            closedAt: null,
            mergedAt: null,
            title: mr_title,
            body: mr_description,
            labels: mr_labels.map(x => x.title), // `labels: string[];`
            comments: [],
            reviewComments: [],
            additions: 0,
            deletions: 0,
          },
        } as any;
        this.app.event.publish('all', PullRequestEvent, mre);
        break;
      default:
        break;
    }
  }
}
