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
import { InstallationInitEvent } from '../installation-manager/types';
import { GitHubInstallationConfig } from './GitHubInstallationConfig';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import Octokit = require('@octokit/rest');
import { App } from '@octokit/app';
import { GitHubInstallation } from './github-installation/GitHubInstallation';
import { GithubWrapper } from '../../basic/DataWarpper';
import { PullRequestEvent, LabelUpdateEvent, CommentUpdateEvent, IssueEvent } from '../event-manager/events';
import { InstallationRepoRemoveEvent, InstallationRepoAddEvent } from '../installation-manager/events';
import { IClient } from '../installation-manager/IClient';

export class AppGitHubInstallationManager extends AppPluginBase<null> {

  private installationMap: Map<number, GitHubInstallation>;

  constructor(config: null, app: Application) {
    super(config, app);
    this.installationMap = new Map<number, GitHubInstallation>();
  }

  public async onReady(): Promise<void> {
    this.app.event.subscribeAll(InstallationInitEvent, async e => {
      if (e.type === 'github') {
        this.initInstallation(e.config, e.installationId);
      }
    });
  }

  public async onStart(): Promise<void> { }

  public async onClose(): Promise<void> { }

  public async getClient(installationId: number, name: string): Promise<IClient | undefined> {
    const installation = this.installationMap.get(installationId);
    if (installation) {
      return installation.getClient(name);
    }
    return undefined;
  }

  private async initInstallation(config: GitHubInstallationConfig, installationId: number): Promise<void> {
    try {
      this.logger.info(`Start to init client manager for installation ${config.name}.`);
      const id = config.appId;
      const privateKeyPath = config.privateKeyPath;
      const privateKeyFilePath = config.privateKeyPathAbsolute ?
        privateKeyPath : join(this.app.baseDir, privateKeyPath);
      if (!existsSync(privateKeyFilePath)) {
        this.logger.error(`Private key path ${privateKeyFilePath} not exist.`);
        return;
      }
      const privateKey = readFileSync(privateKeyFilePath).toString();
      const githubApp = new App({ id, privateKey });

      const installation = new GitHubInstallation(installationId, this, config);
      this.installationMap.set(installationId, installation);
      this.registerWebhooks(installation);

      const octokit = new Octokit({
        auth: `Bearer ${githubApp.getSignedJsonWebToken()}`,
      });
      const installations = await octokit.apps.listInstallations();
      await Promise.all(installations.data.map(async i => {
        const installationAccessToken = await githubApp.getInstallationAccessToken({
          installationId: i.id,
        });
        const octokit = new Octokit({
          auth: `Bearer ${installationAccessToken}`,
        });
        const repos = await octokit.apps.listRepos();
        repos.data.repositories.forEach(r => {
          installation.addRepo(r.full_name, () => githubApp.getInstallationAccessToken({ installationId: i.id, }));
        });
      }));
    } catch (e) {
      this.logger.error(`Error init installation ${installationId}, e = ${e}`);
    }
  }

  private registerWebhooks(installation: GitHubInstallation): void {
    this.logger.info('Start to init webhooks for ', installation.id);
    const webhooks = installation.webhooks;
    const installationId = installation.id;
    const githubWrapper = new GithubWrapper();
    webhooks.on('installation.created', e => {
      e.payload.repositories.forEach(r => {
        this.app.event.publish('all', InstallationRepoAddEvent, {
          installationId,
          fullName: r.full_name,
        });
      });
    });
    webhooks.on('installation_repositories.added', e => {
      e.payload.repositories_added.forEach(r => {
        this.app.event.publish('all', InstallationRepoAddEvent, {
          installationId,
          fullName: r.full_name,
        });
      });
    });
    webhooks.on('installation.deleted', e => {
      e.payload.repositories.forEach(r => {
        this.app.event.publish('all', InstallationRepoRemoveEvent, {
          installationId,
          fullName: r.full_name,
        });
      });
    });
    webhooks.on('installation_repositories.removed', e => {
      e.payload.repositories_removed.forEach(r => {
        this.app.event.publish('all', InstallationRepoRemoveEvent, {
          installationId,
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
        installationId,
        fullName: e.payload.repository.full_name,
        action: e.payload.action,
        issue: githubWrapper.issueWrapper(e.payload.issue),
        changes: e.payload.changes,
      };
      this.app.event.publish('all', IssueEvent, ie);
    });
    webhooks.on([ 'issue_comment.created', 'issue_comment.deleted', 'issue_comment.edited' ], e => {
      const ice = {
        installationId,
        fullName: e.payload.repository.full_name,
        issueNumber: e.payload.issue.number,
        action: e.payload.action,
        comment: githubWrapper.commentWrapper(e.payload.comment),
      };
      this.app.event.publish('all', CommentUpdateEvent, ice);
    });
    webhooks.on([ 'label.created', 'label.deleted' , 'label.edited' ], e => {
      const le = {
        installationId,
        fullName: e.payload.repository.full_name,
        action: e.payload.action,
        labelName: e.payload.label.name,
      };
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
        installationId,
        fullName: e.payload.repository.full_name,
        action: e.payload.action,
        pullRequest: githubWrapper.pullRequestWrapper(e.payload.pull_request),
      };
      this.app.event.publish('all', PullRequestEvent, pre);
    });
  }

}
