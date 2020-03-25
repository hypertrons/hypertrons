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

import Config, { WeeklyReportTemplate } from './config';

const templateDefaultConfig: WeeklyReportTemplate = {
  title: '[WeeklyReport] Weekly report for {{alias}} {{startTime}} to {{endTime}}',
  header: `# Weekly Report of {{alias}}

This is a weekly report of {{alias}}. It summarizes what have changed in the project during the passed week, including pr merged, new contributors, and more things in the future.
`,
  overview: `## Repo Overview

### Basic data

Baisc data shows how the watch, star, fork and contributors count changed in the passed week.

| Watch | Star | Fork | Contributors |
|:-----:|:----:|:----:|:------------:|
| {{watch}} | {{star}} ({{starDelta}}) | {{fork}} ({{forkDelta}}) | {{contributor}} ({{contributorDelta}}) |

### Issues & PRs

Issues & PRs show the new/closed issues/pull requests count in the passed week.

| New Issues | Closed Issues | New PR | Merged PR |
|:----------:|:-------------:|:------:|:---------:|
| {{newIssue}} | {{closeIssue}} | {{newPr}} | {{mergedPr}} |
`,
  pullRequests: `## PR Overview

Thanks to contributions from community, **{{mergedPrCount}}** pull requests was merged in the repository last week. They are:

| Contributor ID | Count | Pull Requests |
|:--------------:|:-----:|:-------------|
{{pullRequestStrs}}
`,
  singleAuthorPullRequest: `| @{{name}} | {{count}} | {{singlePullRequestStrs}} |
`,
  singlePullRequest: '#{{number}} {{title}} {{linebreaker}}',
  review: `## Code Review Statistics

{{alias}} encourages everyone to participant in code review, in order to improve software quality.
This robot would automatically help to count pull request reviews of single github user as the following every week. So, try to help review code in this project.

| Contributor ID | Pull Request Reviews |
|:--------------:|:--------------------:|
{{reviewerStrs}}
`,
  singleReview: `| @{{login}} | {{reviewCount}} |
`,
  newContributors: `## Contributors Overview

It is {{alias}} team's great honor to have new contributors from community. We really appreciate your contributions. ` +
                'Feel free to tell us if you have any opinion and please share this open source project with more people if you could. ' +
                `If you hope to be a contributor as well, please start from {{contributingLink}} .
Here is the list of new contributors:

{{contributorStrs}}

Thanks to you all.
`,
  singleContributor: `@{{login}}
`,
  noNewContributors: `## New Contributors

We have no new contributors in this project this week.
{{alias}} team encourages everything about contribution from community.
For more details, please refer to {{contributingLink}} .
`,
};

const defaultConfig: Config = {
  jobName: 'WeeklyReport',
  generateTime: '0 0 12 * * 1',
  receiver: [ 'slack', 'issue' ],
  weeklyReportTemplate: templateDefaultConfig,
};

export { templateDefaultConfig };
export default defaultConfig;
