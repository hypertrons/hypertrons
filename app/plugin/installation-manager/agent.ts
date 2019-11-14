import { Agent } from 'egg';
import { AgentInstallationManager } from './AgentInstallationManager';
import { AgentPluginBase } from '../../basic/AgentPluginBase';

declare module 'egg' {
  interface Agent {
    installation: AgentInstallationManager;
  }
}

module.exports = (agent: Agent) => {
  AgentPluginBase.LoadToAgent('installation', AgentInstallationManager, agent);
};
