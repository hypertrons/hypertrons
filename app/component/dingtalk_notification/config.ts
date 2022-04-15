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
import defaultConfig from './defaultConfig';

@configClass({
  description: 'DingTalk GitHub IDs map',
})
export class Ids {
  @configProp({
    description: 'GitHub login',
    defaultValue: '',
  })
  github_login: string;

  @configProp({
    description: 'DingTalk id',
    defaultValue: '',
  })
  dingtalk_id: string;
}

@configClass({
  description: 'DingTalk notification config',
})
export default class Config {

  @configProp({
    description: 'Notify types',
    arrayType: 'string',
    defaultValue: defaultConfig.types,
  })
  types: string[];

  @configProp({
    description: 'Max message char length',
    defaultValue: defaultConfig.maxBodyLength,
  })
  maxBodyLength: number;

  @configProp({
    description: 'DingTalk channel used to send',
    defaultValue: defaultConfig.dingTalkChannel,
  })
  dingTalkChannel: string;

  @configProp({
    description: 'GitHub Dingtalk IDs',
    defaultValue: defaultConfig.ids,
    arrayType: Ids,
  })
  ids: Ids[];

}

