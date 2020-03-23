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
import defaultConfig, { templateDefaultConfig } from './defaultConfig';

@configClass({
  description: 'Templates of weekly report component',
})
export class WeeklyReportTemplate {
  @configProp({
    description: 'Title template',
    defaultValue: templateDefaultConfig.title,
    renderParams: [ 'alias', 'startTime', 'endTime' ],
  })
  title: string;

  @configProp({
    description: 'Header template',
    defaultValue: templateDefaultConfig.header,
    renderParams: [ 'alias' ],
  })
  header: string;

  @configProp({
    description: 'Overview template',
    defaultValue: templateDefaultConfig.overview,
    renderParams: [ 'watch', 'star', 'startDelta', 'fork', 'forkDelta', 'contributor', 'contributorDelta',
                    'newIssue', 'closeIssue', 'newPr', 'mergedPr' ],
  })
  overview: string;

  @configProp({
    description: 'Pull template',
    defaultValue: templateDefaultConfig.pullRequests,
    renderParams: [ 'pullRequestStrs' ],
  })
  pullRequests: string;

  @configProp({
    description: 'Single author pull template',
    defaultValue: templateDefaultConfig.singleAuthorPullRequest,
    renderParams: [ 'name', 'count', 'singlePullRequestStrs' ],
  })
  singleAuthorPullRequest: string;

  @configProp({
    description: 'Single pull template',
    defaultValue: templateDefaultConfig.singlePullRequest,
    renderParams: [ 'number', 'title' ],
  })
  singlePullRequest: string;

  @configProp({
    description: 'Review template',
    defaultValue: templateDefaultConfig.review,
    renderParams: [ 'alias', 'reviewerStrs' ],
  })
  review: string;

  @configProp({
    description: 'Single review template',
    defaultValue: templateDefaultConfig.singleReview,
    renderParams: [ 'login', 'reviewCount' ],
  })
  singleReview: string;

  @configProp({
    description: 'New contributor template',
    defaultValue:  templateDefaultConfig.newContributors,
    renderParams: [ 'alias', 'contributorStrs', 'owner', 'repo', 'branch' ],
  })
  newContributors: string;

  @configProp({
    description: 'Single contributor template',
    defaultValue: templateDefaultConfig.singleContributor,
    renderParams: [ 'login' ],
  })
  singleContributor: string;

  @configProp({
    description: 'No new contributor template',
    defaultValue: templateDefaultConfig.noNewContributors,
    renderParams: [ 'alias', 'owner', 'repo', 'branch' ],
  })
  noNewContributors: string;
}

@configClass({
  description: 'Send weekly report automatically',
})
export default class Config {
  @configProp({
    description: 'Job name of the weekly report',
    defaultValue: defaultConfig.jobName,
  })
  jobName: string;

  @configProp({
    type: 'cron',
    description: 'Weekly report generate time, cron format',
    defaultValue: defaultConfig.generateTime,
  })
  generateTime: string;

  @configProp({
    type: 'array',
    arrayType: 'string',
    description: 'Where to report',
    defaultValue: defaultConfig.receiver,
  })
  receiver: string[];

  @configProp({
    type: 'object',
    description: 'Weekly report templates',
    classType: WeeklyReportTemplate,
    defaultValue: defaultConfig.weeklyReportTemplate,
  })
  weeklyReportTemplate: WeeklyReportTemplate;
}
