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
import { LabelSetupConfig } from './config';
import { RepoConfigLoadedEvent } from '../../plugin/event-manager/events';
import { parseRepoName } from '../../basic/Utils';

export default async (ctx: ComponentContext<LabelSetupConfig>) => {
  ctx.logger.info('Start to load label setup component');

  ctx.app.event.subscribeOne(RepoConfigLoadedEvent, async p => {
    setupLabelConfig(p);
  });

  async function setupLabelConfig(e: RepoConfigLoadedEvent): Promise<void> {
    // config check
    if (!e.client) return;
    const labelConfig = e.client.getCompConfig<LabelSetupConfig>('label-setup');
    if (!labelConfig || !labelConfig.enable) return;
    const owner = parseRepoName(e.fullName).owner;
    const repo = parseRepoName(e.fullName).repo;
    const currentLabels = await e.client.listLabels();

    // traverse new config, update all contained labels
    let createCount = 0;
    let updateCount = 0;
    const createTask: Array<{name: string, description: string, color: string}> = [];
    const updateTask: Array<{current_name: string; description?: string; color?: string}> = [];
    labelConfig.labels.forEach(label => {
      const param: any = {
        owner,
        repo,
        name: label.name,
        color: label.color,
        description: label.description,
      };
      // find old label by name, then update/create label
      const oldLabel = currentLabels.find(l => l.name === label.name);
      if (oldLabel) {
        param.current_name = label.name;
        delete param.name;
        if (oldLabel.color === label.color) delete param.color;
        if (oldLabel.description === label.description) delete param.description;
        if (!param.color && !param.description) {
          // no need to update
          return;
        }
        // update old label
        updateCount++;
        updateTask[updateTask.length] = param;
        return;
      } else {
        // create new label
        createCount++;
        createTask[createTask.length] = param;
        return;
      }
    });

    // exec update
    if (updateCount === 0 && createCount === 0) {
      ctx.logger.info(`No need to update labels for ${e.fullName}`);
      return;
    }
    ctx.logger.info(`Gonna update ${updateCount} labels and create ${createCount} labels for ${e.fullName}`);
    await e.client.updateLabels(updateTask);
    await e.client.createLabels(createTask);
    ctx.logger.info(`Update labels for ${e.fullName} done.`);
  }

};
