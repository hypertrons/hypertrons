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

import Config, { DingTalkConfig, SlackConfig, MailConfig } from './config';

const mailDefaultConfig: MailConfig = {
  name: '',
  connectOptions: {
    host: '',
    port : 465,
    secure: true,
    auth: {
      user: '',
      pass: '',
    },
  },
};

const dingTalkDefaultConfig: DingTalkConfig = {
  name: '',
  webhook: '',
};

const slackDefaultConfig: SlackConfig = {
  name: '',
  webhook: '',
};

const defaultConfig: Config = {
  slack: [ ],
  dingTalk: [ ],
  mail: [ ],
};

export { dingTalkDefaultConfig, slackDefaultConfig, mailDefaultConfig };
export default defaultConfig;
