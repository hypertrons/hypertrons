import { Agent } from 'egg';
import { AgentSchedulerManager } from './AgentSchedulerManager';
import { AgentPluginBase } from '../../basic/AgentPluginBase';

declare module 'egg' {
  interface Agent {
    sched: AgentSchedulerManager;
  }
}

module.exports = (agent: Agent) => {
  AgentPluginBase.LoadToAgent('sched', AgentSchedulerManager, agent);
};
