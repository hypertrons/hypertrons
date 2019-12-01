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

export abstract class IMClientBase<TMessage, TConfig> {

  protected logger: BotLogger;
  protected app: Application;

  constructor(imName: string, app: Application) {
    this.app = app;
    this.logger = loggerWrapper(app.logger, `[im-client-${imName}]`);
    this.logger.info('new im client');
  }

  public abstract async send(message: TMessage, config: TConfig): Promise<void>;

}
