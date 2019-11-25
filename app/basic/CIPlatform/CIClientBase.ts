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

import { BotLogger, loggerWrapper } from '../Utils';
import { Application } from 'egg';
import { CIConfigBase } from './CIConfigBase';
import { NewCheckRunEvent, PullRequestEvent } from '../../plugin/event-manager/events';

export abstract class CIClientBase<TCIConfig extends CIConfigBase> {

  protected logger: BotLogger;
  protected app: Application;
  protected name: string;

  constructor(name: string, app: Application) {
    this.app = app;
    this.name = name;
    this.logger = loggerWrapper(app.logger, `[ci-client-${this.name}]`);

    this.logger.info('new client');
  }

  protected abstract async runInternal(pr: PullRequestEvent, config: TCIConfig): Promise<any>;

  protected abstract async convert(pr: PullRequestEvent, ret: any): Promise<NewCheckRunEvent>;

  public async run(pr: PullRequestEvent, config: TCIConfig | undefined): Promise<void> {
    try {
      if (config !== undefined) {
        const ret = await this.runInternal(pr, config);
        this.app.event.publish('all', NewCheckRunEvent, await this.convert(pr, ret));
      }
    } catch (error) {
      this.logger.error(error);
    }
  }
}
