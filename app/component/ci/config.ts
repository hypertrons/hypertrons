import { JenkinsConfig } from '../../plugin/jenkins/JenkinsConfig';

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

/**
 * Warnning: extend ciConfig when add new ci platform, for example, JenkinsConfig | TravisConfig
 */
export interface CIConfig {
  enable: boolean;
  ciName: string;
  ciConfig: JenkinsConfig;
}

const config: CIConfig = {
  enable: false,
  ciName: '',
  ciConfig: {
    endpoints: '',
    pipeline: '',
  },
};

export default config;
