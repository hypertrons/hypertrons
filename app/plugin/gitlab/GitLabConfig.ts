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

import { HostingConfigBase } from '../../basic/HostingPlatform/HostingConfigBase';
import { configClass, configProp } from '../../config-generator/decorators';

@configClass({
  description: 'Webhook config for the robot',
})
class WebhookConfig {

  @configProp({
    description: 'The host of the webhook',
    defaultValue: '',
  })
  host: string;

  @configProp({
    description: 'The listen path of the webhook',
    defaultValue: '/',
  })
  path: string;

  @configProp({
    description: 'The secret of the webhook',
    defaultValue: '',
  })
  secret: string;

  @configProp({
    description: 'The smee proxy for this webhook',
    defaultValue: '',
  })
  proxyUrl: string;
}

@configClass({
  description: 'The config for GitLab robot',
})
export class GitLabConfig extends HostingConfigBase {

  @configProp({
    description: 'Host of the GitLab platform',
    defaultValue: 'https://www.gitlab.com',
  })
  host: string;

  @configProp({
    description: 'The token of your robot account',
    defaultValue: '',
  })
  primaryToken: string;

  @configProp({
    description: 'Webhook config for the robot',
    classType: WebhookConfig,
    defaultValue: new WebhookConfig(),
  })
  webhook: WebhookConfig;
}
