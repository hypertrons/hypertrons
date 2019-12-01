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
import { SlackConfig } from './SlackConfig';
import { IMClientBase } from '../../basic/IMPlatform/IMClientBase';
import { IncomingWebhook, IncomingWebhookSendArguments } from '@slack/webhook/dist/IncomingWebhook';

export class SlackClient extends IMClientBase<IncomingWebhookSendArguments, SlackConfig> {

  constructor(name: string, app: Application) {
    super(name, app);
  }

  public async send(message: IncomingWebhookSendArguments, config: SlackConfig): Promise<void> {
    try {
      // config maybe null or undefined
      if (!config || !config.webhook) {
        return;
      }
      const webhook = new IncomingWebhook(config.webhook);
      webhook.send(message).then(result => {
        this.logger.info(result);
      }).catch(e => {
        this.logger.error(e);
      });
    } catch (e) {
      this.logger.error(e);
    }
  }

}
