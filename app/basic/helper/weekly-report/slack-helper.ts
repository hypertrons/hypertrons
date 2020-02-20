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

import { MrkdwnElement, KnownBlock } from '@slack/types/dist';
import { IncomingWebhookSendArguments } from '@slack/webhook/dist/IncomingWebhook';

function generateTitle(repoName: string): KnownBlock[] {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*Weekly Report of ' + repoName + '*',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'This is a weekly report of ' + repoName + '. It summarizes what have changed in the project during the passed week, including pr merged, new contributors, and more things in the future.',
      },
    },
    {
      type: 'divider',
    },
  ];
}

function generateRepoOverview(basicDataTable: Map<string, string>,
                              issueAndPRsTable: Map<string, string>): KnownBlock[] {

  const res: KnownBlock[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*1. Repo Overview*',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*Basic data*',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'Baisc data shows how the watch, star, fork and contributors count changed in the passed week.',
      },
    },
  ];

  // push basicData table
  if (basicDataTable && basicDataTable.size > 0) {
    const basicData: MrkdwnElement[] = [];
    basicDataTable.forEach((value, key) => {
      basicData.push({
        type: 'mrkdwn',
        text: key,
      });
      basicData.push({
        type: 'mrkdwn',
        text: value,
      });
    });
    res.push({
      type: 'section',
      fields: basicData,
    });
  }

  // push issueAndPRs
  res.push({
    type: 'divider',
  },
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: '*Issues & PRs*',
    },
  },
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: 'Issues & PRs show the new/closed issues/pull requests count in the passed week.',
    },
  });

  // push issueAndPRs table
  if (issueAndPRsTable && issueAndPRsTable.size > 0) {
    const issueAndPRs: MrkdwnElement[] = [];
    issueAndPRsTable.forEach((value, key) => {
      issueAndPRs.push({
        type: 'mrkdwn',
        text: key,
      });
      issueAndPRs.push({
        type: 'mrkdwn',
        text: value,
      });
    });
    res.push({
      type: 'section',
      fields: issueAndPRs,
    });
  }
  // push endline
  res.push({
    type: 'divider',
  });

  return res;
}

function generatePRsOverview(prsTable: Map<string, string>, prsTotal: number): KnownBlock[] {

  const res: KnownBlock[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*2. PR Overview*',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'Thanks to contributions from community, ' + prsTotal + ' pull requests was merged in the repository last week. They are:',
      },
    },
  ];

  // push PR table
  if (prsTable && prsTable.size > 0) {
    const prs: MrkdwnElement[] = [];
    prsTable.forEach((value, key) => {
      prs.push({
        type: 'mrkdwn',
        text: key,
      });
      prs.push({
        type: 'mrkdwn',
        text: value,
      });
    });
    res.push({
      type: 'section',
      fields: prs,
    });
  }

  // push endline
  res.push({
    type: 'divider',
  });

  return res;
}

function generateCodeReviewsOverview(codeReviewsTable: Map<string, string>, repoName: string): KnownBlock[] {

  const res: KnownBlock[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*3. Code Review Statistics*',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: repoName + ' encourages everyone to participant in code review, in order to improve software quality. This robot would automatically help to count pull request reviews of single github user as the following every week. So, try to help review code in this project.',
      },
    },
  ];

  // push codeReviews table
  if (codeReviewsTable && codeReviewsTable.size > 0) {
    const codeReviews: MrkdwnElement[] = [];
    codeReviewsTable.forEach((value, key) => {
      codeReviews.push({
        type: 'mrkdwn',
        text: key,
      });
      codeReviews.push({
        type: 'mrkdwn',
        text: value,
      });
    });
    res.push({
      type: 'section',
      fields: codeReviews,
    });
  }

  // push endline
  res.push({
      type: 'divider',
    });
  return res;
}

function generateContributorsOverview(contributors: string[], repoName: string,
                                      contributingLink: string): KnownBlock[] {

  const res: KnownBlock[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*4. Contributors Overview*',
      },
    },
  ];

  if (contributors && contributors.length > 0) {
    res.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'It is ' + repoName + ' team\'s great honor to have new contributors from community. We really appreciate your contributions. Feel free to tell us if you have any opinion and please share this open source project with more people if you could. If you hope to be a contributor as well, please start from ' + contributingLink + ' .\n\n',
      },
    });
    let contributorStr = 'Here is the list of new contributors:\n\n';
    contributors.forEach(v => {
      contributorStr += '\n' + v;
    });
    res.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: contributorStr,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '\n\nThanks to you all.',
      },
    });
  } else {
    res.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `We have no new contributors in this project this week.\n\n ${repoName} team encourages everything about contribution from community.\n\n For more details, please refer to ${contributingLink}.`,
      },
    });
  }

  return res;
}

export function generateSlackWeeklyReport(
  repoName: string,
  basicDataTable: Map<string, string>,
  issuesAndPRsTable: Map<string, string>,
  prsTable: Map<string, string>, prsTotal: number,
  codeReviewsTable: Map<string, string>,
  contributors: string[], contributingLink: string,
): IncomingWebhookSendArguments {
  return {
    blocks: [
      ...generateTitle(repoName),
      ...generateRepoOverview(basicDataTable, issuesAndPRsTable),
      ...generatePRsOverview(prsTable, prsTotal),
      ...generateCodeReviewsOverview(codeReviewsTable, repoName),
      ...generateContributorsOverview(contributors, repoName, contributingLink),
    ],
  };
}
