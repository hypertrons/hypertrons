// Copyright 2019 - present Xlab
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
import { AppPluginBase } from '../../basic/AppPluginBase';
import { JenkinsConfig } from '../../component/ci/config';
import { join } from 'path';
// tslint:disable-next-line: no-var-requires
const Jenkins = require('../../third_party/jenkins/index');

export class AppCIManager extends AppPluginBase<null> {

  constructor(config: null, app: Application) {
    super(config, app);
  }

  public async onReady(): Promise<void> { }

  public async onStart(): Promise<void> { }

  public async onClose(): Promise<void> { }

  public async runJenkins(jobName: string, pullNum: string, config: JenkinsConfig): Promise<void> {
    try {

      if (!jobName || !pullNum ||
        !config || !config.endpoint || !config.user || !config.token) return;

      if (!config.endpoint.endsWith('/')) config.endpoint = config.endpoint + '/';
      const url = config.endpoint + join('job', jobName, 'view/change-requests', 'job', 'PR-' + pullNum);
      this.logger.info(url);

      const jenkinsCli = new Jenkins(config.user, config.token, config.endpoint, { timeout: config.timeout });
      await jenkinsCli.build(url).then(res => {
        this.logger.info(res.status);
      }).catch(e => {
        this.logger.error(e);
      });

    } catch (e) {
      this.logger.error(e);
    }
  }
}
