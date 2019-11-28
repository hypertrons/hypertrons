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
import { Config } from './config';
import { IssueEvent } from '../../plugin/event-manager/events';
import { uniqueArray } from '../../basic/Utils';
import { LabelSetupConfig } from '../label-setup/config';

export default async (ctx: ComponentContext<Config>) => {
  ctx.logger.info('Start to load issue auto label component');

  ctx.app.event.subscribeOne(IssueEvent, async p => {
    labelIssue(p);
  });

  async function labelIssue(e: IssueEvent): Promise<void> {
    // config check
    if (e.action !== 'opened' && e.action !== 'edited') return;
    if (!e.issue || !e.client) return;
    const issue = e.issue;
    const title = issue.title.toLowerCase();
    const config = e.client.getCompConfig<Config>(ctx.name);
    const labelConfig = e.client.getCompConfig<LabelSetupConfig>('label-setup');
    if (!config || !config.enable || !labelConfig) return;

    // search keyword to decide labels
    let attachLabels: string[] = [];
    labelConfig.labels.forEach(label => {
      if (!label.keywords) return;
      label.keywords.forEach(keyword => {
        if (title.includes(keyword)) {
          attachLabels.push(label.name);
          return;
        }
      });
    });
    if (attachLabels.length === 0) return;
    attachLabels = uniqueArray(attachLabels);

    // exec issue label
    await e.client.addLabels(issue.number, attachLabels);
    ctx.logger.info(`Auto label for issue #${issue.number} done,` +
    ` lalels=${JSON.stringify(attachLabels)}`);

  }

};
