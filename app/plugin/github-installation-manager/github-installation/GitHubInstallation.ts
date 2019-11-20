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

import { GitHubClient } from '../github-client/GitHubClient';
import Octokit = require('@octokit/rest');
import { AppGitHubInstallationManager } from '../AppGitHubInstallationManager';
import Webhooks = require('@octokit/webhooks');
import { GitHubInstallationConfig } from '../GitHubInstallationConfig';
import { BotLogger } from '../../../basic/Utils';
import EventSource from 'eventsource';
import { join } from 'path';
import { Context } from 'egg';
import { DataCat } from 'github-data-cat';

type ClientGenerator = () => Promise<GitHubClient>;

export class GitHubInstallation {

  public id: number;
  public githubInstallationManager: AppGitHubInstallationManager;
  public webhooks: Webhooks;
  public dataCat: DataCat;

  private clients: Map<string, ClientGenerator>;
  private logger: BotLogger;

  constructor(installationId: number, mgr: AppGitHubInstallationManager, config: GitHubInstallationConfig) {
    this.id = installationId;
    this.githubInstallationManager = mgr;
    this.logger = mgr.logger;
    this.clients = new Map<string, ClientGenerator>();
    this.dataCat = new DataCat({
      tokens: config.fetcher.tokens,
    });
    this.dataCat.init();
    this.initWebhooks(config);
  }

  public async addRepo(name: string, tokenGenerator: () => Promise<string>): Promise<void> {
    const client = new GitHubClient(name, this);
    this.clients.set(name, async () => {
      const token = await tokenGenerator();
      client.rawClient = new Octokit({
        auth: `token ${token}`,
      });
      return client;
    });
  }

  public async getClient(name: string): Promise<GitHubClient | undefined> {
    const gen = this.clients.get(name);
    if (gen) {
      return gen();
    }
    return undefined;
  }

  private initWebhooks(config: GitHubInstallationConfig): void {
    this.webhooks = new Webhooks({
      secret: config.webhook.secret,
    });

    // setup proxy using smee.io
    if (config.webhook.proxyUrl) {
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
    const path = join(config.webhook.path, this.id.toString());
    this.githubInstallationManager.get(path, async (ctx: Context, next: any) => {
      // pass to webhooks
      this.webhooks.verifyAndReceive({
        id: ctx.headers['x-request-id'],
        name: ctx.headers['x-github-event'],
        signature: ctx.headers['x-hub-signature'],
        payload: ctx.body,
      }).catch(this.logger.error);
      ctx.body = 'ok';
      await next();
    });
  }

}
