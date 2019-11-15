// Copyright 2019 Xlab
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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
