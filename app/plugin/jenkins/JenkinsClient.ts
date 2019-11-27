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
import { Application } from 'egg';
import { CIRunFinishedEvent } from '../event-manager/events';
import { JenkinsConfig } from './JenkinsConfig';
import { PullRequest } from '../../basic/DataTypes';

export class JenkinsClient extends CIClientBase<JenkinsConfig> {

  constructor(name: string, app: Application) {
    super(name, app);
  }

  protected runInternal(pr: PullRequest, config: JenkinsConfig): Promise<any> {
    this.logger.info(pr, config);
    throw new Error('runInternal method not implemented.');
  }

  protected convert(pr: PullRequest, config: JenkinsConfig, ret: any): Promise<CIRunFinishedEvent> {
    this.logger.info(pr, config, ret);
    throw new Error('Method not implemented.');
  }

}
