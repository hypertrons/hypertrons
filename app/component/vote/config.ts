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
import voteSummaryDefaultConfig from './defaultConfig';

@configClass({
  description: 'Help to collect vote info',
})
export default class Config {
  @configProp({
    description: 'startVoteCommand',
    defaultValue: voteSummaryDefaultConfig.startVoteCommand,
  })
  startVoteCommand: string;

  @configProp({
    description: 'voteCommand',
    defaultValue: voteSummaryDefaultConfig.voteCommand,
  })
  voteCommand: string;

  @configProp({
    description: 'Choice',
    defaultValue: voteSummaryDefaultConfig.choice,
  })
  choice: string;

  @configProp({
    description: 'Voter',
    defaultValue: voteSummaryDefaultConfig.voter,
  })
  voter: string;

  @configProp({
    description: 'voteSummaryInfoRegExp',
    defaultValue: voteSummaryDefaultConfig.voteSummaryInfoRegExp,
  })
  voteSummaryInfoRegExp: string;

  @configProp({
    description: 'voteSummaryStart',
    defaultValue: voteSummaryDefaultConfig.voteSummaryStart,
  })
  voteSummaryStart: string;

  @configProp({
    description: 'voteSummaryEnd',
    defaultValue: voteSummaryDefaultConfig.voteSummaryEnd,
  })
  voteSummaryEnd: string;

  @configProp({
    description: 'voteSummaryJsonRegExp',
    defaultValue: voteSummaryDefaultConfig.voteSummaryJsonRegExp,
  })
  voteSummaryJsonRegExp: string;

  @configProp({
    description: 'voteJsonStart',
    defaultValue: voteSummaryDefaultConfig.voteJsonStart,
  })
  voteJsonStart: string;

  @configProp({
    description: 'voteJsonEnd',
    defaultValue: voteSummaryDefaultConfig.voteJsonEnd,
  })
  voteJsonEnd: string;

  @configProp({
    description: 'votingLabelName',
    defaultValue: voteSummaryDefaultConfig.votingLabelName,
  })
  votingLabelName: string;

  @configProp({
    description: 'votedLabelName',
    defaultValue: voteSummaryDefaultConfig.votedLabelName,
  })
  votedLabelName: string;

  @configProp({
    description: 'voteSchedName',
    defaultValue: voteSummaryDefaultConfig.voteSchedName,
  })
  voteSchedName: string;

  @configProp({
    description: 'voteSched',
    defaultValue: voteSummaryDefaultConfig.voteSched,
  })
  voteSched: string;
}
