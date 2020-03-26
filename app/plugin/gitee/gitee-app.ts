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
import { GiteeConfig } from './gitee-config';
import { GiteeClient } from './gitee-client';
import { GiteeRawClient } from './gitee-raw-client/gitee-raw-client';
import { Application, Context } from 'egg';
import SmeeClient from 'smee-client';
import { resolve } from 'url';
import { IssueEvent, PushEvent, PullRequestEvent, CommentUpdateEvent, ReviewCommentEvent } from '../event-manager/events';
import { parseRepoName } from '../../basic/Utils';
import { convertIssueNumber2Number } from './util';

export class GiteeApp extends HostingBase<GiteeConfig, GiteeClient, GiteeRawClient> {

  private client: GiteeRawClient;
  private webhooksPath: string;

  constructor(id: number, config: GiteeConfig, app: Application) {
    super('gitee', id, config, app);
    this.client = new GiteeRawClient(this.config.primaryToken, this.app.phManager.getPromiseHandler());
  }

  public async getInstalledRepos(): Promise<Array<{fullName: string, payload: any}>> {
    // list all repos that bot account is the admin
    const res = await this.client.repos.listUserRepos();
    return res.map(r => {
      return {
        fullName: r.full_name,
        payload: r.id,
      };
    });
  }

  public async addRepo(name: string, _payload: any): Promise<void> {
    const client = new GiteeClient(name, this.id, this.app, this.client, this);
    this.clientMap.set(name, async () => client);
    this.initWebhooksForRepo(name, this.webhooksPath);
  }

  protected async initWebhook(config: GiteeConfig): Promise<void> {
    this.logger.info('Init webhook for gitee');
    const webhookConfig = config.webhook;
    const subPath = this.post(webhookConfig.path, async (ctx: Context, next: any) => {
      ctx.body = 'ok';
      const secret = ctx.headers['x-gitee-token'];
      if (secret !== webhookConfig.secret) {
        await next();
        return;
      }
      const event = ctx.headers['x-gitee-event'];
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

  private async initWebhooksForRepo(name: string, webhooksPath: string) {
    const currentWebhooks = await this.client.webhooks.all(parseRepoName(name));
    const hook = currentWebhooks.find(h => h.url === webhooksPath);
    if (!hook) {
      this.logger.info(`Add webhook for ${name}, url=${webhooksPath}`);
      this.client.webhooks.addWebhook({
        ...parseRepoName(name),
        url: webhooksPath,
      });
    }
  }

  private triggerWebhook(event: string, payload: any): void {
    // very similar with gitlab
    // console.log('=== trigger webhook ===');
    // console.log(event);
    switch (event) {
      case 'Issue Hook':
        const parseAction = (
          o: string,
        ): 'opened' | 'reopened' | 'closed' => {
          switch (o) {
            case 'open':
              return 'opened';
            case 'reopen':
              return 'reopened';
            case 'close':
              return 'closed';
            default:
              return 'opened';
          }
        };
        const ie = {
          installationId: this.id,
          fullName: payload.repository.full_name,
          action: parseAction(payload.action),
          issue: {
            id: payload.issue.id,
            author: payload.issue.user.name,
            number: convertIssueNumber2Number(payload.issue.number),
            createdAt: new Date(payload.issue.created_at),
            updatedAt: new Date(payload.issue.updated_at),
            closedAt: null,
            title: payload.issue.title,
            body: payload.issue.body,
            labels: payload.issue.labels.map(l => l.title),
            comments: [],
          },
          changes: {},
        };
        this.app.event.publish('all', IssueEvent, ie);
        // console.log(ie);
        break;
      case 'Push Hook':
      case 'Tag Hook':
        const pe = {
          installationId: this.id,
          fullName: payload.repository.full_name,
          push: {
            ref: payload.ref,
            before: payload.before,
            after: payload.after,
            created: true,
            deleted: false,
            forced: false,
            base_ref: null,
            compare: payload.compare,
            head_commit: null,
            repository: undefined,
            pusher: {
              name: payload.pusher.user_name,
              email: payload.pusher.email,
            },
            commits: payload.commits.map(c => {
              return {
                added: c.added,
                removed: c.removed,
                modified: c.modified,
              };
            }),
          },
        };
        this.app.event.publish('all', PushEvent, pe);
        // console.log(pe);
        break;
      case 'Merge Request Hook':
        const parsePullRequest = (
          o: string,
        ): 'opened' | 'reopened' | 'closed' => {
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
              return 'opened';
          }
        };
        const mre = {
          installationId: this.id,
          fullName: payload.repository.full_name,
          action: parsePullRequest(payload.action), // least used.
          pullRequest: {
            id: payload.pull_request.id,
            author: payload.author.name,
            number: payload.pull_request.number,
            createdAt: new Date(payload.pull_request.created_at),
            updatedAt: new Date(payload.pull_request.updated_at),
            closedAt: new Date(payload.pull_request.closed_at),
            mergedAt: new Date(payload.pull_request.merged_at),
            title: payload.pull_request.title,
            body: payload.pull_request.body,
            labels: [], // `labels: string[];`
            comments: [],
            reviewComments: [],
            additions: 0,
            deletions: 0,
          },
        };
        this.app.event.publish('all', PullRequestEvent, mre);
        // console.log(mre);
        break;
      case 'Note Hook':
        // Comment on merge request
        // Comment on issue
        const parseComment = (
          o: string,
        ): 'created' | 'deleted' | 'edited' => {
          switch (o) {
            case 'comment':
              return 'created';
            case 'edited':
              return 'edited';
            case 'deleted':
              return 'deleted';
            default:
              return 'created';
          }
        };
        const ce: CommentUpdateEvent = {
          installationId: this.id,
          fullName: payload.repository.full_name,
          // issue's number is like I192YQ
          // pr's number is a ordinal number
          issueNumber: payload.noteable_type === 'Issue' ? convertIssueNumber2Number(payload.issue.number) : payload.pull_request.number,
          action: parseComment(payload.action),
          comment: {
            id: payload.comment.id,
            login: payload.comment.user.login,
            body: payload.comment.body,
            url: payload.comment.html_url,
            createdAt: new Date(payload.comment.created_at),
          },
          isIssue: payload.noteable_type === 'Issue',
        };
        if (ce.isIssue) {
          this.app.event.publish('all', CommentUpdateEvent, ce);
        } else {
          this.app.event.publish('all', ReviewCommentEvent, ce);
        }
        // console.log(ce);
        break;
      default:
        break;
    }
  }

}
