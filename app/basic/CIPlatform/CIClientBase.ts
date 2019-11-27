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
import { CIRunFinishedEvent } from '../../plugin/event-manager/events';
import { PullRequest } from '../DataTypes';

export abstract class CIClientBase<TConfig> {

  protected logger: BotLogger;
  protected app: Application;

  constructor(ciName: string, app: Application) {
    this.app = app;
    this.logger = loggerWrapper(app.logger, `[ci-client-${ciName}]`);
    this.logger.info('new ci client');
  }

  protected abstract async runInternal(pr: PullRequest, config: TConfig): Promise<any>;

  protected abstract async convert(pr: PullRequest, config: TConfig, ret: any): Promise<CIRunFinishedEvent>;

  public async run(pr: PullRequest, config: TConfig): Promise<void> {
    try {
      const ret = await this.runInternal(pr, config);
      this.app.event.publish('all', CIRunFinishedEvent, await this.convert(pr, config, ret));
    } catch (error) {
      this.logger.error(error);
    }
  }
}
