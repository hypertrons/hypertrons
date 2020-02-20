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
import { IncomingWebhook, IncomingWebhookSendArguments } from '@slack/webhook/dist/IncomingWebhook';
import { SlackConfig, DingTalkConfig, MailConfig } from '../../component/im/config';
import DingTalkRobot from 'dingtalk-robot-sender';
import { DingTalkMessageType } from '../../basic/IMDataTypes';
import * as Nodemailer from 'nodemailer';

export class IMManager extends AppPluginBase<null> {

  constructor(config: null, app: Application) {
    super(config, app);
  }

  public async onReady(): Promise<void> { }

  public async onStart(): Promise<void> { }

  public async onClose(): Promise<void> { }

  public async sendToSlack(message: IncomingWebhookSendArguments, config: SlackConfig): Promise<void> {
    if (!config || !config.webhook) return;
    const webhook = new IncomingWebhook(config.webhook);
    await webhook.send(message).catch(e => {
      this.logger.error(e);
    });
  }

  public async sendToDingTalk(message: DingTalkMessageType, config: DingTalkConfig): Promise<void> {
    if (!config || !config.webhook) return;
    const robot = new DingTalkRobot({ webhook: config.webhook });
    await robot.send(message).catch(e => {
      this.logger.error(`DingTalk send error: ${e}`);
    });
  }

  public async sendToMail(message: Nodemailer.SendMailOptions, config: MailConfig): Promise<void> {
    try {
      const client = Nodemailer.createTransport(config.connectOptions);

      const ok = await client.verify();
      if (!ok) {
        this.logger.warn('send mail verify failed');
        return;
      }

      const tryTimes = 5;
      for (let i = 0; i < tryTimes; i++) {
        try {
          await client.sendMail(message);
          return;
        } catch (e) {
          if (e.code !== 'ETIMEDOUT') {
            this.logger.error('Error when send mail ', e);
            return;
          }
        }
      }
    } catch (error) {
      this.logger.error(error);
    }
  }

}
