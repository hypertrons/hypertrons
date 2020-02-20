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
  description: 'Templates of issue English translator component',
})
export default class Config {
  @configProp({
    description: 'Header template',
    defaultValue: defaultConfig.header,
    renderParams: [ 'author' ],
  })
  header: string;

  @configProp({
    description: 'Title template',
    defaultValue: defaultConfig.title,
    renderParams: [ 'title' ],
  })
  title: string;

  @configProp({
    description: 'Body template',
    defaultValue: defaultConfig.body,
    renderParams: [ 'body' ],
  })
  body: string;
}
