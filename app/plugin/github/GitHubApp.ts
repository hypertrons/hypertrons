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
import { GitHubConfig } from './GitHubConfig';
import { GitHubClient } from './GitHubClient';
import Octokit = require('@octokit/rest');
import retry = require('@octokit/plugin-retry');
import { Application, Context } from 'egg';
import { App } from '@octokit/app';
import { join } from 'path';
import { existsSync, readFileSync } from 'fs';
import Webhooks = require('@octokit/webhooks');
import { GithubWrapper } from '../../basic/DataWrapper';
import {
  IssueEvent, CommentUpdateEvent, LabelUpdateEvent, PullRequestEvent, ReviewCommentEvent, PushEvent, ReviewEvent,
} from '../event-manager/events';
import { DataCat } from 'github-data-cat';
import EventSource from 'eventsource';
import {
  HostingPlatformRepoRemovedEvent, HostingPlatformRepoAddedEvent, HostingPlatformUninstallEvent,
} from '../../basic/HostingPlatform/event';

// add retry plugin into octokit
Octokit.plugin(retry);

export class GitHubApp extends HostingBase<GitHubConfig, GitHubClient, Octokit> {

  private githubApp: App;
  private webhooks: Webhooks;
  public dataCat: DataCat;

  constructor(id: number, config: GitHubConfig, app: Application) {
    super('github', id, config, app);
    const privateKeyPath = config.privateKeyPath;
    const privateKeyFilePath = config.privateKeyPathAbsolute ?
        privateKeyPath : join(this.app.baseDir, privateKeyPath);
    if (!existsSync(privateKeyFilePath)) {
      this.logger.error(`Private key path ${privateKeyFilePath} not exist.`);
      return;
    }
    const privateKey = readFileSync(privateKeyFilePath).toString();
    this.githubApp = new App({ id: this.config.appId, privateKey });
    this.dataCat = new DataCat({
      tokens: this.config.fetcher.tokens,
    });
    this.dataCat.init();
  }

  public async getInstalledRepos(): Promise<Array<{fullName: string, payload: any}>> {
    const octokit = new Octokit({
      auth: `Bearer ${this.githubApp.getSignedJsonWebToken()}`,
    });
    const installations = await octokit.apps.listInstallations();
    const repos = await Promise.all(installations.data.map(async i => {
      const installationAccessToken = await this.githubApp.getInstallationAccessToken({
        installationId: i.id,
      });
      const octokit = new Octokit({
        auth: `Bearer ${installationAccessToken}`,
      });
      const repos = await octokit.apps.listRepos();
      return {
        id: i.id,
        repos: repos.data.repositories,
      };
    }));
    const ret: Array<{fullName: string, payload: any}> = [];
    repos.forEach(repo => {
      repo.repos.forEach(r => {
        ret.push({
          fullName: r.full_name,
          payload: repo.id,
        });
      });
    });
    return ret;
  }

  public async addRepo(name: string, payload: any): Promise<void> {
    // set token before any request
    const githubClient = new GitHubClient(name, this.id, this.app, this.dataCat, this);
    const oct = new Octokit();
    githubClient.setRawClient(oct);
    oct.hook.before('request', async () => {
      const token = await this.githubApp.getInstallationAccessToken({
        installationId: payload,
      });
      githubClient.getRawClient().authenticate({
        type: 'token',
        token,
      });
    });
    this.clientMap.set(name, async () => githubClient);
  }

  protected async initWebhook(config: GitHubConfig): Promise<void> {
    this.webhooks = new Webhooks({
      secret: config.webhook.secret,
    });

    // setup proxy using smee.io
    if (config.webhook.proxyUrl && config.webhook.proxyUrl !== '') {
      const source = new EventSource(config.webhook.proxyUrl);
      source.onmessage = (event: any) => {
        const webhookEvent = JSON.parse(event.data);
        this.webhooks.verifyAndReceive({
          id: webhookEvent['x-request-id'],
          name: webhookEvent['x-github-event'],
          signature: webhookEvent['x-hub-signature'],
          payload: webhookEvent.body,
        }).catch(this.logger.error);
      };
    }

    // setup router
    const path = join(this.id.toString(), config.webhook.path);
    this.logger.info(`Gonna add webhook to "installation/${path}" for hosting ${this.name}`);
    this.app.installation.post(path, async (ctx: Context, next: any) => {
      // pass to webhooks
      this.webhooks.verifyAndReceive({
        id: ctx.headers['x-github-delivery'],
        name: ctx.headers['x-github-event'],
        signature: ctx.headers['x-hub-signature'],
        payload: ctx.request.body,
      }).catch(this.logger.error);
      ctx.body = 'ok';
      await next();
    });

    this.logger.info(`Start to init webhooks for ${this.name}`);
    const webhooks = this.webhooks;
    const githubWrapper = new GithubWrapper();
    webhooks.on('installation.created', e => {
      e.payload.repositories.forEach(r => {
        this.app.event.publish('all', HostingPlatformRepoAddedEvent, {
          id: this.id,
          fullName: r.full_name,
          payload: e.payload.installation.id,
        });
      });
    });
    webhooks.on('installation_repositories.added', e => {
      e.payload.repositories_added.forEach(r => {
        this.app.event.publish('all', HostingPlatformRepoAddedEvent, {
          id: this.id,
          fullName: r.full_name,
          payload: e.payload.installation.id,
        });
      });
    });
    webhooks.on('installation.deleted', e => {
      this.app.event.publish('all', HostingPlatformUninstallEvent, {
        id: this.id,
        owner: e.payload.installation.account.login,
      });
    });
    webhooks.on('installation_repositories.removed', e => {
      e.payload.repositories_removed.forEach(r => {
        this.app.event.publish('all', HostingPlatformRepoRemovedEvent, {
          id: this.id,
          fullName: r.full_name,
        });
      });
    });
    webhooks.on([ 'issues.assigned',
                  'issues.closed',
                  'issues.deleted',
                  'issues.demilestoned',
                  'issues.edited',
                  'issues.labeled',
                  'issues.locked',
                  'issues.opened',
                  'issues.milestoned',
                  'issues.pinned',
                  'issues.reopened',
                  'issues.transferred',
                  'issues.unassigned',
                  'issues.unlabeled',
                  'issues.unlocked',
                  'issues.unpinned', ], e => {
      const ie = {
        installationId: this.id,
        fullName: e.payload.repository.full_name,
        action: e.payload.action,
        issue: githubWrapper.issueWrapper(e.payload.issue),
        changes: e.payload.changes,
      };
      this.app.event.publish('all', IssueEvent, ie);
    });
    webhooks.on([ 'issue_comment.created', 'issue_comment.deleted', 'issue_comment.edited' ], async e => {
      const client = await this.getClient(e.payload.repository.full_name);
      if (!client) return;

      let isIssue = false;
      const repoData = client.getRepoData();
      if (repoData && repoData.issues &&
        repoData.issues.find(issue => issue.id === e.payload.issue.id)) {
          isIssue = true;
      }

      const ice = {
        installationId: this.id,
        fullName: e.payload.repository.full_name,
        issueNumber: e.payload.issue.number,
        action: e.payload.action,
        comment: githubWrapper.commentWrapper(e.payload.comment),
        isIssue,
      };
      this.app.event.publish('all', CommentUpdateEvent, ice);
    });
    webhooks.on([ 'label.created', 'label.deleted' , 'label.edited' ], e => {
      const le: LabelUpdateEvent = {
        installationId:  this.id,
        fullName: e.payload.repository.full_name,
        action: e.payload.action,
        labelName: e.payload.label.name,
      };
      if (e.payload.changes && e.payload.changes.name && e.payload.changes.name.from) {
        le.from = e.payload.changes.name.from;
      }
      this.app.event.publish('all', LabelUpdateEvent, le);
    });
    webhooks.on([ 'pull_request.assigned',
                  'pull_request.closed',
                  'pull_request.edited',
                  'pull_request.labeled',
                  'pull_request.locked',
                  'pull_request.opened',
                  'pull_request.ready_for_review',
                  'pull_request.reopened',
                  'pull_request.review_request_removed',
                  'pull_request.review_requested',
                  'pull_request.unassigned',
                  'pull_request.unlabeled',
                  'pull_request.unlocked',
                  'pull_request.synchronize' ], e => {
      const pre = {
        installationId: this.id,
        fullName: e.payload.repository.full_name,
        action: e.payload.action,
        pullRequest: githubWrapper.pullRequestWrapper(e.payload.pull_request),
      };
      this.app.event.publish('all', PullRequestEvent, pre);
    });
    webhooks.on([ 'pull_request_review.submitted',
                  'pull_request_review.edited',
                  'pull_request_review.dismissed' ], e => {
      const re = {
        installationId: this.id,
        fullName: e.payload.repository.full_name,
        action: e.payload.action,
        prNumber: e.payload.pull_request.number,
        review: githubWrapper.reviewWrapper(e.payload.review),
      };
      this.app.event.publish('all', ReviewEvent, re);
    });
    webhooks.on([ 'pull_request_review_comment.created',
                  'pull_request_review_comment.edited',
                  'pull_request_review_comment.deleted' ], e => {
      const rce = {
        installationId: this.id,
        fullName: e.payload.repository.full_name,
        action: e.payload.action,
        prNumber: e.payload.pull_request.number,
        comment: githubWrapper.reviewCommentWrapper(e.payload.comment),
      };
      this.app.event.publish('all', ReviewCommentEvent, rce);
    });
    webhooks.on('push', e => {
      const pe = {
        installationId: this.id,
        fullName: e.payload.repository.full_name,
        push: githubWrapper.pushWrapper(e.payload),
      };
      this.app.event.publish('all', PushEvent, pe);
    });
  }
}
