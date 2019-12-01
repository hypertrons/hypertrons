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

import { configProp, configClass } from '../../config-generator/decorators';

const defaultConfig: SlackConfig = {
  name: '',
  platform: 'slack',
  webhook: '',
};

// api: https://slack.dev/node-slack-sdk/webhook
@configClass({
  description: 'Slack config type',
})
export class SlackConfig {

  @configProp({
    description: 'Config unique name',
    type: 'string',
    defaultValue: defaultConfig.name,
  })
  name: string;

  @configProp({
    description: 'Slack platform type, constant value, must be "slack"',
    defaultValue: 'slack',
  })
  platform: 'slack';

  @configProp({
    description: 'Slack incoming webhook',
    type: 'string',
    defaultValue: defaultConfig.webhook,
  })
  webhook: string;
}

export { defaultConfig };
