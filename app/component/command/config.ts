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

import { configClass, configProp } from '../../config-generator/decorators';
import defaultConfig from './defaultConfig';

@configClass({
  description: 'every label type',
})
class Auth {

  @configProp({
    description: 'Role name',
    defaultValue: '',
  })
  role: string;

  @configProp({
    description: 'Commands that current role can use',
    defaultValue: [],
    arrayType: 'string',
  })
  command: string[];

}

@configClass({
  description: 'Manage command execution. Commands user can use are depended on its role.',
})
export default class Config {

  @configProp({
    description: 'Enable this component or not',
    defaultValue: defaultConfig.enable,
  })
  enable: boolean;

  @configProp({
    description: 'Auth of roles',
    defaultValue: defaultConfig.auth,
    arrayType: Auth,
  })
  auth: Auth[];

}
