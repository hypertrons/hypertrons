
import { ClientReadyEvent, RepoPushEvent, RepoRemovedEvent } from '../event-manager/events';
import { ConfigManagerInternalReLoadConfigEvent } from './events';
import { Agent } from 'egg';
import { AgentPluginBase } from '../../basic/AgentPluginBase';

export class AgentConfigManager extends AgentPluginBase<null> {

  constructor(config: null, agent: Agent) {
    super(config, agent);
  }

  public async onReady() {

    // load the configuration when client ready
    this.agent.event.subscribe(ClientReadyEvent, async event => {
      this.agent.event.publish('worker', ConfigManagerInternalReLoadConfigEvent, event);
    });

    // update the configuration when a repo was removed
    this.agent.event.subscribe(RepoRemovedEvent, async event => {
      this.agent.event.publish('worker', ConfigManagerInternalReLoadConfigEvent, event);
    });

    // update configuration when receive a push event
    this.agent.event.subscribe(RepoPushEvent, async event => {
      this.agent.event.publish('worker', ConfigManagerInternalReLoadConfigEvent, event);
    });
  }

  public async onStart() { }

  public async onClose() { }
}
