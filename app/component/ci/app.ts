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
import { CIConfig } from './config';
import { CIRunEvent, PullRequestEvent } from '../../plugin/event-manager/events';

export default async (ctx: ComponentContext<CIConfig>) => {
  ctx.logger.info('Start to load ci component');

  ctx.app.event.subscribeOne(PullRequestEvent, async e => {
    if (e.client) {
      const config = e.client.getCompConfig<CIConfig>('ci');
      if (config !== undefined && config.enable && config.ciName === 'jenkins' && e.pullRequest) {
        ctx.app.event.publish('all', CIRunEvent, {
          ciName: config.ciName,
          ciConfig: config.ciConfig,
          pullRequest: e.pullRequest,
        });
      }
    }
  });
};
