import { Agent } from 'egg';
import { InstallationType, InstallationInitEvent } from './types';
import { AgentPluginBase } from '../../basic/AgentPluginBase';

export class AgentInstallationManager extends AgentPluginBase<Config> {

  constructor(config: Config, agent: Agent) {
    super(config, agent);
  }

  public async onReady(): Promise<void> { }

  public async onStart(): Promise<void> {
    this.config.configs.forEach((c, index) => {
      this.agent.event.publish('agent', InstallationInitEvent, {
        installationId: index,
        ...c,
      });
    });
  }

  public async onClose(): Promise<void> { }

}

interface Config {
  configs: Array<{
    type: InstallationType,
    config: any,
  }>;
}
