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
import { CIClientBase } from './CIClientBase';
import { CIRunEvent } from '../../plugin/event-manager/events';
import { loggerWrapper } from '../Utils';

export abstract class CIManagerBase<TConfig> extends AppPluginBase<null> {

  protected client: CIClientBase<TConfig>;
  protected ciName: string;

  constructor(ciName: string, config: null, app: Application) {
    super(config, app);
    this.ciName = ciName;
    this.logger = loggerWrapper(app.logger, `[ci-manager-${this.ciName}]`);
  }

  public async onReady(): Promise<void> {
    this.app.event.subscribeOne(CIRunEvent, async e => {
      if (e.ciName === this.ciName) {
        this.client.run(e.pullRequest, e.ciConfig);
      }
    });
  }

  public async onStart(): Promise<void> { }

  public async onClose(): Promise<void> { }

}
