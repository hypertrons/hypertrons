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

import { ComponentContext } from '../../basic/ComponentHelper';
import Config, { JenkinsConfig } from './config';
import { CIRunEvent } from '../../plugin/event-manager/events';
import { CIPlatform } from '../../basic/DataTypes';
import { parseRepoName } from '../../basic/Utils';

export default async (ctx: ComponentContext<Config>) => {
  ctx.app.event.subscribeOne(CIRunEvent, async e => {

    if (!e.client || !e.pullNumber) return;

    const ciConfigs = e.client.getCompConfig<Config>('ci');
    if (!ciConfigs ||
        !ciConfigs.enable || ciConfigs.enable !== true ||
        !ciConfigs.configs || ciConfigs.configs.length === 0) return;

    const repoName = parseRepoName(e.fullName).repo;
    if (e.ciName) { // exact match
      ciConfigs.configs.forEach(c => {
        if (c.name === e.ciName && c.repoToJobMap && c.repoToJobMap.length > 0) {
          doCIRun(ctx, repoName, e.pullNumber, c);
          return;
        }
      });
    } else {  // first match
      ciConfigs.configs.forEach(c => {
        if (c.repoToJobMap && c.repoToJobMap.length > 0) {
          doCIRun(ctx, repoName, e.pullNumber, c);
          return;
        }
      });
    }
  });
};

function doCIRun(ctx: ComponentContext<Config>, repo: string, pullNum: number, config: JenkinsConfig) {
  config.repoToJobMap.forEach(r2j => {
    if (r2j.repo === repo && r2j.job) {
      if (config.platform === CIPlatform.Jenkins) {
        ctx.app.ciManager.runJenkins(r2j.job, pullNum.toString(), config);
        return;
      }
    }
  });
}
