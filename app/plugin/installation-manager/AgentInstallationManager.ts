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
