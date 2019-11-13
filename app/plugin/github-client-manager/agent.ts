import { Agent } from 'egg';
import { AgentGitHubClientManager } from './AgentGitHubClientManager';
import { AgentPluginBase } from '../../basic/AgentPluginBase';

declare module 'egg' {
  interface Agent {
    githubClient: AgentGitHubClientManager;
  }
}

module.exports = (agent: Agent) => {
  AgentPluginBase.LoadToAgent('githubClient', AgentGitHubClientManager, agent);
};
