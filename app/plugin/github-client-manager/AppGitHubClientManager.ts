import { Application } from 'egg';
import { ClientRetrieveInstalledReposDoneEvent, InstalltaionRepoAddEvent, InstallationRepoRemoveEvent } from './events';
import Webhooks from '@octokit/webhooks';
import { AppPluginBase } from '../../basic/AppPluginBase';
import * as Utils from '../../basic/Utils';
import { IClient } from '../installation-manager/IClient';

export class AppGitHubClientManager extends AppPluginBase<null> {

  private clients: Map<number, Map<string, IClient>>;

  constructor(config: null, app: Application) {
    console.log(config);
    super(config, app);
    this.clients = new Map<number, Map<string, IClient>>();
  }

  public async onReady(): Promise<void> {
    this.clients.set(0, new Map<string, IClient>());
  }

  public async onStart() {
    this.app.event.subscribeAll(ClientRetrieveInstalledReposDoneEvent, async e => {
      this.logger.info('Recieve installed repos from agent, update data.');
      e.repos.forEach(async r => {
        const { owner, repo } = Utils.parseRepoName(r.fullName);
        this.setRepoToken(owner, repo, r.token);
      });
    });
    const webhook: Webhooks = this.app.githubWebhook.webhooks;
    this.sendNewRepoInstallEvent(webhook);
    this.sendRepoUninstallEvent(webhook);
  }

  public async onClose(): Promise<void> { }

  private setRepoToken(_: string, ___: string, __: string) {
    // const fullName = Utils.getRepoFullName(owner, repo);
    // this.clients.set(installationId, new Octokit({
    //   auth: `token ${token}`
    // }));
    throw new Error('Method not implemented.');
  }

  public getInstalledRepos(): Array<{ owner: string, repo: string }> {
    // return Array.from(this.clients.keys()).map(Utils.parseRepoName);
    return [{
      owner: '',
      repo: '',
    }];
  }

  public getClient(_: string, __: string): any {
    // return <any>this.clients.get(Utils.getRepoFullName(owner, repo));
  }

  private sendNewRepoInstallEvent(webhook: Webhooks) {
    const sendEvent = (fullName: string, installationId: number) => {
      const repoName = Utils.parseRepoName(fullName);
      this.app.event.publish('agent', InstalltaionRepoAddEvent, {
        owner: repoName.owner,
        repo: repoName.repo,
        installationId,
      });
    };
    webhook.on('installation.created', e => {
      e.payload.repositories.forEach(r => {
        sendEvent(r.full_name, e.payload.installation.id);
      });
    });
    webhook.on('installation_repositories.added', e => {
      e.payload.repositories_added.forEach(r => {
        sendEvent(r.full_name, e.payload.installation.id);
      });
    });
  }

  private sendRepoUninstallEvent(webhook: Webhooks) {
    const sendEvent = (fullName: string, installationId: number) => {
      const repoName = Utils.parseRepoName(fullName);
      this.app.event.publish('agent', InstallationRepoRemoveEvent, {
        owner: repoName.owner,
        repo: repoName.repo,
        installationId,
      });
    };
    webhook.on('installation.deleted', e => {
      e.payload.repositories.forEach(r => {
        sendEvent(r.full_name, e.payload.installation.id);
      });
    });
    webhook.on('installation_repositories.removed', e => {
      e.payload.repositories_removed.forEach(r => {
        sendEvent(r.full_name, e.payload.installation.id);
      });
    });
  }
}
