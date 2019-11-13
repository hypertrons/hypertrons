import { Agent } from 'egg';
import { AgentEventManager } from './AgentEventManager';
import { AgentPluginBase } from '../../basic/AgentPluginBase';

declare module 'egg' {
  interface Agent {
    event: AgentEventManager;
  }
}

module.exports = (agent: Agent) => {
  AgentPluginBase.LoadToAgent('event', AgentEventManager, agent);
};
