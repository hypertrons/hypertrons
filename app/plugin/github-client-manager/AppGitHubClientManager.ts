import { Application } from 'egg';
import { GitHubRepoInitEvent, InstallationRepoAddEvent, InstallationRepoRemoveEvent } from './events';
import { AppPluginBase } from '../../basic/AppPluginBase';
import { AutoCreateMap } from '../../basic/Utils';
import { App } from '@octokit/app';
import { AppGitHubClient } from './AppGitHubClient';
import { InstallationClientReadyEvent } from '../installation-manager/types';
import Octokit = require('@octokit/rest');

type GenClient = () => Promise<AppGitHubClient>;

export class AppGitHubClientManager extends AppPluginBase<null> {

  private appMap: AutoCreateMap<number, App>;
  private clientGenerator: AutoCreateMap<number, Map<string, GenClient>>;

  constructor(config: null, app: Application) {
    super(config, app);
    this.appMap = new AutoCreateMap<number, App>(() => new App({ id: 0, privateKey: '' }));
    this.clientGenerator = new AutoCreateMap<number, Map<string, GenClient>>(() => new Map<string, GenClient>());
  }

  public async onReady(): Promise<void> {
    this.app.event.subscribeAll(GitHubRepoInitEvent, async e => {
      this.logger.info(`Start to init client for installation ${e.installationId} and repo ${e.fullName}`);
      const githubApp = this.appMap.get(e.installationId, () => new App({
        id: e.appId,
        privateKey: e.privateKey,
      }));
      this.setupNewClientGenerator(e.installationId, e.githubInstallationId, e.fullName, githubApp);
    });

    this.app.event.subscribeAll(InstallationRepoAddEvent, async e => {
      if (this.appMap.has(e.installationId)) {
        this.logger.info(`Start to init client for installation ${e.installationId} and repo ${e.fullName}`);
        const githubApp = this.appMap.get(e.installationId);
        this.setupNewClientGenerator(e.installationId, e.githubInstallationId, e.fullName, githubApp);
      }
    });

    this.app.event.subscribeAll(InstallationRepoRemoveEvent, async e => {
      if (this.clientGenerator.has(e.installationId)) {
        this.clientGenerator.get(e.installationId).delete(e.fullName);
      }
    });
  }

  private setupNewClientGenerator(installationId: number, githubInstallationId: number, fullName: string, app: App): void {
      const client = new AppGitHubClient(installationId, fullName);
      this.clientGenerator.get(installationId).set(fullName, async () => {
      const token = await app.getInstallationAccessToken({
        installationId: githubInstallationId,
      });
      client.rawClient = new Octokit({
        auth: `token ${token}`,
      });
      return client;
    });
    // immediately send client ready event to self
      this.app.event.publish('worker', InstallationClientReadyEvent, {
      installationId,
      installationType: 'github',
      name: fullName,
    });
  }

  public async onStart(): Promise<void> {
    this.app.githubWebhook.register(async (installationId, webhooks) => {
      webhooks.on('installation.created', e => {
        e.payload.repositories.forEach(r => {
          this.app.event.publish('workers', InstallationRepoAddEvent, {
            installationId,
            githubInstallationId: e.payload.installation.id,
            fullName: r.full_name,
          });
        });
      });
      webhooks.on('installation_repositories.added', e => {
        e.payload.repositories_added.forEach(r => {
          this.app.event.publish('workers', InstallationRepoAddEvent, {
            installationId,
            githubInstallationId: e.payload.installation.id,
            fullName: r.full_name,
          });
        });
      });
      webhooks.on('installation.deleted', e => {
        e.payload.repositories.forEach(r => {
          this.app.event.publish('workers', InstallationRepoRemoveEvent, {
            installationId,
            fullName: r.full_name,
          });
        });
      });
      webhooks.on('installation_repositories.removed', e => {
        e.payload.repositories_removed.forEach(r => {
          this.app.event.publish('workers', InstallationRepoRemoveEvent, {
            installationId,
            fullName: r.full_name,
          });
        });
      });
    });
  }

  public async onClose(): Promise<void> { }

  public async getClient(installationId: number, name: string): Promise<AppGitHubClient | undefined> {
    if (!this.clientGenerator.has(installationId)) {
      return undefined;
    }
    const gen = this.clientGenerator.get(installationId).get(name);
    if (!gen) {
      return undefined;
    }
    return await gen();
  }
}
