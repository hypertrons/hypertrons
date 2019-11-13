import { Agent } from 'egg';
import { App } from '@octokit/app';
import Octokit from '@octokit/rest';
import { join } from 'path';
import { existsSync, readFileSync } from 'fs';
import { ClientRetrieveInstalledReposDoneEvent } from './events';
import { AgentPluginBase } from '../../basic/AgentPluginBase';
import * as Utils from '../../basic/Utils';
import { InstallationInitEvent } from '../installation-manager/types';
import { GitHubClientConfig } from './GitHubInstallationConfig';

interface Installation {
  token: string;
  repos: Set<string>;
}

export class AgentGitHubClientManager extends AgentPluginBase<null> {

  private githubApp: App;
  private installations: Map<number, Installation>;

  constructor(config: null, agent: Agent) {
    super(config, agent);
    this.installations = new Map<number, Installation>();
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

  private async initInstallation(config: GitHubClientConfig, _: number) {
    this.logger.info('Server started, start to init client manager.');
    const id = config.appId;
    const privateKeyPath = config.privateKeyPath;
    const privateKeyFilePath = config.privateKeyPathAbsolute ?
      privateKeyPath : join(this.agent.baseDir, privateKeyPath);
    if (!existsSync(privateKeyFilePath)) {
      this.logger.error(`Private key path ${privateKeyFilePath} not exist.`);
      return;
    }
    const privateKey = readFileSync(privateKeyFilePath).toString();
    this.githubApp = new App({ id, privateKey });
    this.logger.info('Gen jwt succeed, start to get installations and repos.');

    await this.getInstallationsAndRepos();
    this.logger.info(`Get installations and repos done. installation' count = ${this.installations.size}`);

    this.sendRepoToken();
  }

  // get all installations
  private async getInstallationsAndRepos() {
    const octokit = new Octokit({
      auth: `Bearer ${this.githubApp.getSignedJsonWebToken()}`,
    });
    const installations = await octokit.apps.listInstallations();
    await Promise.all(installations.data.map(async i => {
      const installationAccessToken = await this.githubApp.getInstallationAccessToken({
        installationId: i.id,
      });
      const octokit = new Octokit({
        auth: `Bearer ${installationAccessToken}`,
      });
      const repos = await octokit.apps.listRepos();
      repos.data.repositories.forEach(r => {
        this.addRepoToInstallation(i.id, Utils.getRepoFullName(r.owner.login, r.name));
      });
    }));
  }

  private async addRepoToInstallation(installationId: number, repo: string) {
    const installation = this.installations.get(installationId);
    if (!installation) {
      const token = await this.githubApp.getInstallationAccessToken({
        installationId,
      });
      this.installations.set(installationId, {
        token,
        repos: new Set<string>(repo),
      });
    } else {
      installation.repos.add(repo);
    }
  }

  private sendRepoToken(installationId?: number, repo?: string) {
    if (installationId && repo) {
      const installation = this.installations.get(installationId);
      if (!installation || !installation.repos.has(repo)) {
        return;
      }
      this.agent.event.publish('workers', ClientRetrieveInstalledReposDoneEvent, {
        repos: Array.of({
          fullName: repo,
          token: installation.token,
        }),
      });
    } else {
      const p: ClientRetrieveInstalledReposDoneEvent = {
        repos: [],
      };
      for (const i of this.installations.values()) {
        i.repos.forEach(r => {
          p.repos.push({
            fullName: r,
            token: i.token,
          });
        });
      }
      this.agent.event.publish('workers', ClientRetrieveInstalledReposDoneEvent, p);
    }
  }

}
