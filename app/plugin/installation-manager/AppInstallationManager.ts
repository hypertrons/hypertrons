import { AppPluginBase } from '../../basic/AppPluginBase';
import { IClient } from './IClient';
import { Application } from 'egg';
import { InstallationType, InstallationInitEvent } from './types';

export class AppInstallationManager extends AppPluginBase<Config> {

  private clientMap: Map<number, InstallationType>;

  constructor(config: Config, app: Application) {
    super(config, app);
    this.clientMap = new Map<number, InstallationType>();
  }

  public async onReady(): Promise<void> {

  }

  public async onStart(): Promise<void> {
    this.config.configs.forEach((c, index) => {
      this.app.event.publish('all', InstallationInitEvent, {
        installationId: index,
        ...c,
      });
    });
  }

  public async onClose(): Promise<void> { }

  public async getClient(installationId: number, name: string): Promise<IClient | undefined> {
    const type = this.clientMap.get(installationId);
    if (type) {
      switch (type) {
        case 'github':
          return this.app.githubClient.getClient(installationId, name);
        case 'gitlab':
          break;
        default:
          break;
      }
    }
    return undefined;
  }

  public getInstallationType(installationId: number): InstallationType {
    return this.clientMap.get(installationId);
  }

}

interface Config {
  configs: Array<{
    type: InstallationType,
    name: string,
    config: any,
  }>;
}
