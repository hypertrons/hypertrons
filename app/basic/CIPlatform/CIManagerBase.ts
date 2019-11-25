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

import { Application } from 'egg';
import { AppPluginBase } from '../AppPluginBase';
import { CIConfigBase } from './CIConfigBase';
import { CIClientBase } from './CIClientBase';
import { PullRequestEvent } from '../../plugin/event-manager/events';
import { loggerWrapper } from '../Utils';

export abstract class CIManagerBase<TConfig extends CIConfigBase> extends AppPluginBase<TConfig> {

  protected client: CIClientBase<TConfig>;
  protected id: string;

  constructor(id: string, config: TConfig, app: Application) {
    super(config, app);
    this.id = id;
    this.logger = loggerWrapper(app.logger, `[ci-manager-${this.id}]`);
  }

  public async onReady(): Promise<void> {
    this.app.event.subscribeOne(PullRequestEvent, async e => {
      if (e.action === 'opened' && e.client !== undefined) {
        const ciConfig = e.client.getCompConfig<TConfig>('ci');
        if (ciConfig !== undefined && ciConfig.enable && ciConfig.id === this.id) {
          this.client.run(e, ciConfig);
        }
      }
    });
  }

  public async onStart(): Promise<void> { }

  public async onClose(): Promise<void> { }

}
