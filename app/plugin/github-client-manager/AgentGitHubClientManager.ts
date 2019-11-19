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

import { Agent } from 'egg';
import { App } from '@octokit/app';
import Octokit from '@octokit/rest';
import { join } from 'path';
import { existsSync, readFileSync } from 'fs';
import { AgentPluginBase } from '../../basic/AgentPluginBase';
import { InstallationInitEvent } from '../installation-manager/types';
import { GitHubClientConfig } from './GitHubInstallationConfig';
import { GitHubRepoInitEvent } from './events';

export class AgentGitHubClientManager extends AgentPluginBase<null> {

  private installationIdSet: Set<number>;

  constructor(config: null, agent: Agent) {
    super(config, agent);
    this.installationIdSet = new Set<number>();
  }

  public async onReady(): Promise<void> {
    this.agent.event.subscribe(InstallationInitEvent, async e => {
      if (e.type === 'github') {
        this.initInstallation(e.config, e.installationId);
      }
    });
  }

  public async onStart(): Promise<void> { }

  public async onClose(): Promise<void> { }

  private async initInstallation(config: GitHubClientConfig, installationId: number) {
    this.logger.info(`Start to init client manager for installation ${config.name}.`);
    this.installationIdSet.add(installationId);
    const id = config.appId;
    const privateKeyPath = config.privateKeyPath;
    const privateKeyFilePath = config.privateKeyPathAbsolute ?
      privateKeyPath : join(this.agent.baseDir, privateKeyPath);
    if (!existsSync(privateKeyFilePath)) {
      this.logger.error(`Private key path ${privateKeyFilePath} not exist.`);
      return;
    }
    const privateKey = readFileSync(privateKeyFilePath).toString();
    const githubApp = new App({ id, privateKey });

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
      repos.data.repositories.forEach(async r => {
        // for any repo, send repo init event to all workers
        this.agent.event.publish('all', GitHubRepoInitEvent, {
          appId: config.appId,
          privateKey,
          fullName: r.full_name,
          installationId,
          githubInstallationId: i.id,
          installationName: config.name,
        });
      });
    }));
  }

}
