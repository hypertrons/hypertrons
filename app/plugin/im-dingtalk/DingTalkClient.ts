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
import { DingTalkConfig } from './DingTalkConfig';
import { IMClientBase } from '../../basic/IMPlatform/IMClientBase';
import DingTalkRobot from 'dingtalk-robot-sender';
import { DingTalkMessageType } from '../../basic/IMPlatform/IMDataTypes';

export class DingtalkClient extends IMClientBase<DingTalkMessageType, DingTalkConfig> {

  constructor(name: string, app: Application) {
    super(name, app);
  }

  public async send(message: DingTalkMessageType, config: DingTalkConfig): Promise<void> {

      if (!config || !config.webhook) {
        return;
      }

      const robot = new DingTalkRobot({ webhook: config.webhook });

      robot.send(message).then(res => {
          this.logger.info(`DingTalk send result: ${res}`);
        }).catch(e => {
          this.logger.error(`DingTalk send error: ${e}`);
        });
  }
}
