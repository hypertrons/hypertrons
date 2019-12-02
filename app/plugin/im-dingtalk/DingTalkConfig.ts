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
import { IMType } from '../../basic/IMPlatform/IMDataTypes';

const defaultConfig: DingTalkConfig = {
  name: '',
  platform: IMType.DingTalk,
  webhook: '',
};

@configClass({
  description: 'DingTalk config type',
})
export class DingTalkConfig {

  @configProp({
    description: 'Config unique name',
    type: 'string',
    defaultValue: defaultConfig.name,
  })
  name: string;

  @configProp({
    description: 'DingTalk platform type, constant value, must be IMType.DingTalk',
    defaultValue: defaultConfig.platform,
  })
  platform: string;

  @configProp({
    description: 'DingTalk webhook',
    type: 'string',
    defaultValue: defaultConfig.webhook,
  })
  webhook: string;
}

export { defaultConfig };
