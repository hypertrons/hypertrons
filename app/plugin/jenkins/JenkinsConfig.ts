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

const defaultConfig: JenkinsConfig = {
  endpoints: '',
  pipeline: '',
};

@configClass({
  description: 'Jenkins config type',
})
export class JenkinsConfig {

  @configProp({
    description: 'Endpoint of the Jenkins platform',
    defaultValue: defaultConfig.endpoints,
  })
  endpoints: string;

  @configProp({
    description: 'Pipeline config content',
    defaultValue: defaultConfig.pipeline,
  })
  pipeline: string;
}

export { defaultConfig };
