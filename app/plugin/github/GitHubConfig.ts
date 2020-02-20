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
  description: 'Webhook config for the app',
})
class WebhookConfig {
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
  description: 'The data fetcher config for the app',
})
class FetcherConfig {
  @configProp({
    description: 'Tokens to use for fetching data',
    defaultValue: [],
    arrayType: 'string',
  })
  tokens: string[];
}

@configClass({
  description: 'The config for GitHub App',
})
export class GitHubConfig extends HostingConfigBase {
  @configProp({
    description: 'The endpoint of GitHub instance',
    defaultValue: 'https://api.github.com',
  })
  endpoint: string;

  @configProp({
    description: 'The id of the GitHub App, find on your app admin page',
    defaultValue: 0,
  })
  appId: number;

  @configProp({
    description: 'The private key file path, key is generated from the app admin page',
    defaultValue: './private_key.pem',
  })
  privateKeyPath: string;

  @configProp({
    description: 'If the private key path is absolute',
    defaultValue: false,
  })
  privateKeyPathAbsolute: boolean;

  @configProp({
    description: 'Webhook config for the app',
    defaultValue: new WebhookConfig(),
    classType: WebhookConfig,
  })
  webhook: WebhookConfig;

  @configProp({
    description: 'The data fetcher config for the app',
    defaultValue: new FetcherConfig(),
    classType: FetcherConfig,
  })
  fetcher: FetcherConfig;
}
