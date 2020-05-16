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
import { IncomingWebhookSendArguments } from '@slack/webhook/dist/IncomingWebhook';
import moment from 'moment';
import { ErrorManagerConfig } from './ErrorManagerConfig';

export class AppErrorManager extends AppPluginBase<ErrorManagerConfig> {

  constructor(config: ErrorManagerConfig, app: Application) {
    super(config, app);
  }

  public async onReady(): Promise<void> { }

  public async onStart(): Promise<void> {
    process.on('uncaughtException', (error: Error) => {
      this.handleError('Hypertrons AppErrorManager Uncaught Exception', error);
    });
    process.on('unhandledRejection', (error: any, _: Promise<any>) => {
      this.handleError('Hypertrons AppErrorManager Unhandled Rejection', error);
    });
  }

  public async onClose(): Promise<void> { }

  public async handleError(from: string, err: Error) {
    try {
      if (this.config.slack) {
        const slackMessage: IncomingWebhookSendArguments = {
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: '*From*:     ' + '`' + from + '`' + '\n' +
                      '*Time*:     ' + '`' + moment().format() + '`' + '\n' +
                      '*Details*:  ' + '```' + err.toString() + '\n' + divider
                                              + err.stack + '\n' + divider
                                              + JSON.stringify(err) + '```',
              },
            },
            {
              type: 'divider',
            },
          ],
        };
        try {
          this.config.slack.forEach(c => this.app.imManager.sendToSlack(slackMessage, c));
        } catch (error) {
          this.logger.error(error);
        }
      }
    } catch (error) {
      this.logger.error(error);
    }
  }
}

const divider = '--------------------------------------------------------------------------------';
