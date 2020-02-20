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

import { configClass, configProp } from '../../config-generator/decorators';
import defaultConfig, { dingTalkDefaultConfig, slackDefaultConfig, mailDefaultConfig } from './defaultConfig';

/**
 * Mail config
 */
@configClass({
  description: 'SMTP server auth',
})
export class MailConnectOptionsAuth {
  @configProp({
    description: 'SMTP server auth user',
    type: 'string',
    defaultValue: mailDefaultConfig.connectOptions.auth.user,
  })
  user: string;

  @configProp({
    description: 'SMTP server auth password',
    type: 'string',
    defaultValue: mailDefaultConfig.connectOptions.auth.pass,
  })
  pass: string;
}

@configClass({
  description: 'SMTP connect options',
})
export class MailConnectOptions {
  @configProp({
    description: 'SMTP server host',
    type: 'string',
    defaultValue: mailDefaultConfig.connectOptions.host,
  })
  host: string;

  @configProp({
    description: 'SMTP server port',
    type: 'number',
    defaultValue: mailDefaultConfig.connectOptions.port,
  })
  port: number;

  @configProp({
    description: 'Defines if the connection should use SSL (if true) or not (if false)',
    type: 'boolean',
    defaultValue: mailDefaultConfig.connectOptions.secure,
  })
  secure: boolean;

  @configProp({
    description: 'SMTP server auth',
    type: 'object',
    classType: MailConnectOptionsAuth,
    defaultValue: mailDefaultConfig.connectOptions.auth,
  })
  auth: MailConnectOptionsAuth;
}

@configClass({
  description: 'Mail config type',
})
export class MailConfig {
  @configProp({
    description: 'Config unique name',
    type: 'string',
    defaultValue: mailDefaultConfig.name,
  })
  name: string;

  @configProp({
    description: 'Mail SMTP connect options',
    type: 'object',
    defaultValue: mailDefaultConfig.connectOptions,
    classType: MailConnectOptions,
  })
  connectOptions: MailConnectOptions;
}

/**
 * DingTalk config
 */
@configClass({
  description: 'DingTalk config type',
})
export class DingTalkConfig {

  @configProp({
    description: 'Config unique name',
    defaultValue: dingTalkDefaultConfig.name,
  })
  name: string;

  @configProp({
    description: 'DingTalk webhook',
    defaultValue: dingTalkDefaultConfig.webhook,
  })
  webhook: string;
}

/**
 * Slack config
 * api: https://slack.dev/node-slack-sdk/webhook
 */
@configClass({
  description: 'Slack config type',
})
export class SlackConfig {

  @configProp({
    description: 'Config unique name',
    defaultValue: slackDefaultConfig.name,
  })
  name: string;

  @configProp({
    description: 'Slack incoming webhook',
    defaultValue: slackDefaultConfig.webhook,
  })
  webhook: string;
}

/**
 * IMConfig
 */
@configClass({
  description: 'IM client config',
})
export default class Config {

  @configProp({
    description: 'Slack config list',
    type: 'array',
    arrayType: SlackConfig,
    defaultValue: defaultConfig.slack,
  })
  slack: SlackConfig[];

  @configProp({
    description: 'Dingtalk config list',
    type: 'array',
    arrayType: DingTalkConfig,
    defaultValue: defaultConfig.dingTalk,
  })
  dingTalk: DingTalkConfig[];

  @configProp({
    description: 'Mail config list',
    type: 'array',
    arrayType: MailConfig,
    defaultValue: defaultConfig.mail,
  })
  mail: MailConfig[];

}
