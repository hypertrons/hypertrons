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
  description: 'every label type',
})
class Label {

  @configProp({
    description: 'Label name',
    defaultValue: '',
  })
  name: string;

  @configProp({
    description: 'Label description',
    defaultValue: '',
  })
  description: string;

  @configProp({
    description: 'Label color',
    defaultValue: '#FFFFFF',
  })
  color: string;

  @configProp({
    description: 'Label keywords, use to auto label issues and pulls',
    defaultValue: [],
    arrayType: 'string',
  })
  keywords?: string[];

}

@configClass({
  description: 'Manage label for repo automatically, not delete already exist labels',
})
export default class Config {

  @configProp({
    description: 'Labels to use',
    defaultValue: defaultConfig.labels,
    arrayType: Label,
  })
  labels: Label[];

}
