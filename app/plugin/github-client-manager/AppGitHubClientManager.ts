import { Application } from 'egg';
import { GitHubRepoInitEvent } from './events';
import { AppPluginBase } from '../../basic/AppPluginBase';
import { AutoCreateMap } from '../../basic/Utils';
import { App } from '@octokit/app';
import { AppGitHubClient } from './AppGitHubClient';
import { InstallationClientReadyEvent } from '../installation-manager/types';

type GenClient = () => Promise<AppGitHubClient>;

export class AppGitHubClientManager extends AppPluginBase<null> {

  private appMap: AutoCreateMap<number, App>;
  private clientGenerator: AutoCreateMap<number, Map<string, GenClient>>;

  constructor(config: null, app: Application) {
    console.log(config);
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
      const client = new AppGitHubClient(e.installationId, e.fullName);
      this.clientGenerator.get(e.installationId).set(e.fullName, async () => {
        const token = await githubApp.getInstallationAccessToken({
          installationId: e.installationId,
        });
        client.rawClient.authenticate({
          type: 'token',
          token,
        });
        return client;
      });
      // immediately send client ready event to all workers
      this.app.event.publish('worker', InstallationClientReadyEvent, {
        installationId: e.installationId,
        name: e.fullName,
      });
    });
  }

  public async onStart(): Promise<void> { }

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
