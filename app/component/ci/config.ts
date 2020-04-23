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
import defaultConfig, { jenkinsDefaultConfig } from './defaultConfig';
import { CIPlatform } from '../../basic/DataTypes';

@configClass({
  description: 'Repo to job map',
})
export class RepoJobMap {
  @configProp({
    description: 'Repo name',
    defaultValue: jenkinsDefaultConfig.name,
  })
  repo: string;

  @configProp({
    description: 'Job name',
    defaultValue: jenkinsDefaultConfig.name,
  })
  job: string;
}

@configClass({
  description: 'Jenkins config type',
})
export class JenkinsConfig {

  @configProp({
    description: 'Jenkins platform name',
    defaultValue: jenkinsDefaultConfig.name,
  })
  name: string;

  @configProp({
    description: 'Platform name, must be CIPlatform.Jenkins',
    defaultValue: jenkinsDefaultConfig.platform,
  })
  platform: CIPlatform.Jenkins;

  @configProp({
    description: 'Jenkins platform endpoint',
    defaultValue: jenkinsDefaultConfig.endpoint,
  })
  endpoint: string;

  @configProp({
    description: 'Jenkins platform user',
    defaultValue: jenkinsDefaultConfig.user,
  })
  user: string;

  @configProp({
    description: 'Jenkins platform token',
    defaultValue: jenkinsDefaultConfig.token,
  })
  token: string;

  @configProp({
    description: 'Jenkins platform job map',
    type: 'array',
    arrayType: RepoJobMap,
    defaultValue: jenkinsDefaultConfig.repoToJobMap,
  })
  repoToJobMap: RepoJobMap[];

  @configProp({
    description: 'Jenkins request timeout',
    type: 'number',
    defaultValue: jenkinsDefaultConfig.timeout,
  })
  timeout: number;
}

/**
 * Warnning: extend configs and arrayType when add new ci platform,
 * for example, configs: (JenkinsConfig | TravisConfig)[]
 * arrayType: JenkinsConfig | TravisConfig,
 */
@configClass({
   description: 'CI platform config',
 })
export default class Config {

  @configProp({
    description: 'CI Platform configs',
    type: 'array',
    arrayType: JenkinsConfig,
    defaultValue: defaultConfig.configs,
  })
  configs: JenkinsConfig[];
}
