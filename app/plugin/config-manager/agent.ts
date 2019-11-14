import { Agent } from 'egg';
import { AgentPluginBase } from '../../basic/AgentPluginBase';
import { AgentConfigManager } from './AgentConfigManager';

declare module 'egg' {
  interface Agent {
    configManager: AgentConfigManager;
  }
}

module.exports = (agent: Agent) => {
  AgentPluginBase.LoadToAgent('configManager', AgentConfigManager, agent);
};
