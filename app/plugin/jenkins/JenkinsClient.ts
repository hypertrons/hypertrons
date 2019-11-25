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

import { CIClientBase } from '../../basic/CIPlatform/CIClientBase';
import { PullRequestEvent, NewCheckRunEvent } from '../event-manager/events';
import { Application } from 'egg';
import { JenkinsConfig } from './JenkinsConfig';

export class JenkinsClient extends CIClientBase<JenkinsConfig> {

  constructor(name: string, app: Application) {
    super(name, app);
  }

  protected async runInternal(pr: PullRequestEvent, config: JenkinsConfig): Promise<any> {
    // TODO run ci pipeline
    this.logger.info(pr, config);
    return null;
  }

  protected async convert(pr: PullRequestEvent, ret: any): Promise<NewCheckRunEvent> {
    // TODO convert ci ret to NewCheckRunEvent
    this.logger.info(pr, ret);
    throw new Error('');
  }

}
