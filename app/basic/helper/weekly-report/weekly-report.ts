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

import IMConfig from '../../../component/im/config';
import { EOL } from 'os';
import { renderString, parseRepoName, getLastWeek, BotLogger, loggerWrapper } from '../../Utils';
import { PullRequest } from '../../DataTypes';
import { IncomingWebhookSendArguments } from '@slack/webhook/dist/IncomingWebhook';
import { generateSlackWeeklyReport } from './slack-helper';
import { Application } from 'egg';
import { HostingClientBase } from '../../HostingPlatform/HostingClientBase';
import { HostingConfigBase } from '../../HostingPlatform/HostingConfigBase';

export interface OverviewResult {
  overviewStr: string;
  basicDataTable: Map<string, string>;
  issuesAndPRsTable: Map<string, string>;
}
export interface PullRequestOverviewResult {
  pullRequestsStr: string;
  prsTable: Map<string, string>;
  prsTotal: number;
}
export interface CodeReviewOverviewResult {
  reviewOverviewStr: string;
  codeReviewsTable: Map<string, string>;
}
export interface ContributorResult {
  contributorStr: string;
  contributors: string[];
  contributingLink: string;
}

const MAX_TABLE_ITEMS_FOR_SLACK = 5;

export default class WeeklyReport <TConfig extends HostingConfigBase, TRawClient> {

  private app: Application;
  private logger: BotLogger;
  private client: HostingClientBase<TConfig, TRawClient>;
  private fullName: string;
  private hostingBaseName: string;
  private config: any;

  constructor(client: HostingClientBase<TConfig, TRawClient>, app: Application) {
    this.client = client;
    this.app = app;
    this.fullName = client.getFullName();
    this.hostingBaseName = client.getHostingBase().getName();
    this.config = client.getCompConfig('weekly_report');
    this.logger = loggerWrapper(app.logger,
      `[client-${client.getHostingBase().getName()}-${client.getFullName()}-weekly-report]`);
  }

  public async genIssueWeeklyReportForRepo(): Promise<void> {
    this.logger.info(`Start to generate github/gitlab weekly report for ${this.hostingBaseName}/${this.fullName}`);

    this.removeOldWeeklyReports();
    const generatedContents: string[] = [];
    generatedContents.push(this.generateHeader());
    generatedContents.push(this.generateOverview().overviewStr);
    generatedContents.push(this.generatePullRequestOverview().pullRequestsStr);
    generatedContents.push(this.generateCodeReviewOverview().reviewOverviewStr);
    generatedContents.push(this.generateContributorOverview().contributorStr);
    const weeklyReportStr = generatedContents.join(EOL);
    const title = renderString(this.config.weeklyReportTemplate.title, {
        alias: parseRepoName(this.fullName).repo,
        startTime: getLastWeek().toLocaleDateString(),
        endTime: new Date().toLocaleDateString(),
    });

    await this.client.addIssue(title, weeklyReportStr, [ 'weekly-report' ]);
    this.logger.info(`Generate github/gitlab weekly report for ${this.hostingBaseName}/${this.fullName} done.`);
  }

  public async genSlackWeeklyReportForRepo(): Promise<void> {
    const imConfig = this.client.getCompConfig<IMConfig>('im');
    if (!imConfig || !imConfig.slack) return;
    this.logger.info(`start to generate weekly report to slack for ${this.hostingBaseName}/${this.fullName}`);
    const weeklyReportStrForSlack: IncomingWebhookSendArguments = generateSlackWeeklyReport(
      this.fullName,
      this.generateOverview().basicDataTable,
      this.generateOverview().issuesAndPRsTable,
      this.generatePullRequestOverview().prsTable, this.generatePullRequestOverview().prsTotal,
      this.generateCodeReviewOverview().codeReviewsTable,
      this.generateContributorOverview().contributors, this.generateContributorOverview().contributingLink,
    );
    imConfig.slack.forEach(async v => {
      await this.app.imManager.sendToSlack(weeklyReportStrForSlack, v);
    });
    this.logger.info(`Generate slack weekly report for ${this.hostingBaseName}/${this.fullName} done.`);
  }

  private removeOldWeeklyReports(): void {
    const removeIssues = this.client.getRepoData().issues.filter(
        issue => issue.labels.some(l => l === 'weekly-report'));

    if (removeIssues.length === 0) return;

    removeIssues.forEach(issue => {
      this.client.updateIssue(issue.number, { state: 'closed' });
    });
  }

  private generateHeader(): string {
    return renderString(this.config.weeklyReportTemplate.header, { alias: parseRepoName(this.fullName).repo });
  }

  private generateOverview(): OverviewResult {
    interface WeeklyData {
      star: number;
      contributor: number;
      fork: number;
      watch: number;
    }
    const lastWeek = getLastWeek();
    const repoData = this.client.getRepoData();
    const currentData: WeeklyData = {
            star: repoData.stars.length,
            watch: repoData.watchCount,
            contributor: repoData.contributors.length,
            fork: repoData.forkCount,
        };
    const deltaData: WeeklyData = {
            star: repoData.stars.filter(star => star.time >= lastWeek).length,
            watch: 0,
            contributor: repoData.contributors.filter(cont => cont.time >= lastWeek).length,
            fork: repoData.forks.filter(fork => fork.time >= lastWeek).length,
        };
    const decorateDelta = (value: number): string => {
            if (value > 0) {
                return `↑${value}`;
            } else if (value < 0) {
                return `↓${value}`;
            } else {
                return '-';
            }
        };
    const newIssue = repoData.issues.filter(issue => issue.createdAt >= lastWeek).length;
    const closeIssue = repoData.issues.filter(issue =>
            issue.closedAt && issue.closedAt >= lastWeek).length;
    const newPr = repoData.pulls.filter(pr => pr.createdAt >= lastWeek).length;
    const mergedPr = repoData.pulls.filter(pr =>
            pr.mergedAt && pr.mergedAt >= lastWeek).length;

    const overviewStr = renderString(this.config.weeklyReportTemplate.overview, {
            star: currentData.star,
            starDelta: decorateDelta(deltaData.star),
            fork: currentData.fork,
            forkDelta: decorateDelta(deltaData.fork),
            contributor: currentData.contributor,
            contributorDelta: decorateDelta(deltaData.contributor),
            watch: currentData.watch,
            newIssue,
            closeIssue,
            newPr,
            mergedPr,
        });
    const basicDataTable: Map<string, string> = new Map<string, string>();
    basicDataTable.set('*Watch*', `${currentData.watch}`);
    basicDataTable.set('*Star*', `${currentData.star}(${decorateDelta(deltaData.star)})`);
    basicDataTable.set('*Fork*', `${currentData.fork}(${decorateDelta(deltaData.fork)})`);
    basicDataTable.set('*Contributors*', `${currentData.contributor}(${decorateDelta(deltaData.contributor)})`);

    const issuesAndPRsTable: Map<string, string> = new Map<string, string>();
    issuesAndPRsTable.set('*New Issues*', String(newIssue));
    issuesAndPRsTable.set('*Closed Issues*', String(closeIssue));
    issuesAndPRsTable.set('*New PR*', String(newPr));
    issuesAndPRsTable.set('*Merged PR*', String(mergedPr));

    return {
      overviewStr,
      basicDataTable,
      issuesAndPRsTable,
    };
  }

  private generatePullRequestOverview(): PullRequestOverviewResult {
    const lastWeek = getLastWeek();
    // prs : all pull requests in last week
    const prs = this.client.getRepoData().pulls.filter(pr =>
      pr.mergedAt && pr.mergedAt >= lastWeek);
      // group by author
    const pullRequestAuthors = new Array<{
        name: string,
        pullRequestCount: number,
        pulls: PullRequest[],
      }>();
    prs.forEach(pr => {
        const pullRequestAuthor = pullRequestAuthors.find(prAuthor => prAuthor.name === pr.author);
        if (pullRequestAuthor) {
            pullRequestAuthor.pullRequestCount++;
            pullRequestAuthor.pulls.push(pr);
        } else {
            pullRequestAuthors.push({
                name: pr.author,
                pullRequestCount: 1,
                pulls: new Array<PullRequest>(pr),
            });
        }
    });

    // sort by pullRequestCount(desc)
    pullRequestAuthors.sort((a, b) => b.pullRequestCount - a.pullRequestCount);

    let pullRequestStrs = '';
    const prsTable: Map<string, string> = new Map<string, string>();
    pullRequestAuthors.forEach((pra, index) => {
        // sort by pr number(asc)
        pra.pulls.sort((a, b) => a.number - b.number);
        let singlePullRequestStrs = '';
        let singlePullRequestStrsForSlack = '';
        pra.pulls.forEach(pr => {
          singlePullRequestStrs += renderString(this.config.weeklyReportTemplate.singlePullRequest, {
            title: pr.title,
            number: pr.number,
            linebreaker: this.getLineBreakerStr(),
          });

          if (index >= MAX_TABLE_ITEMS_FOR_SLACK) return;

          singlePullRequestStrsForSlack += renderString(this.config.weeklyReportTemplate.singlePullRequest, {
            title: pr.title,
            number: pr.number,
            linebreaker: this.getLineBreakerStr('slack'),
          });
        });
        pullRequestStrs += renderString(this.config.weeklyReportTemplate.singleAuthorPullRequest, {
          name: pra.name,
          count: pra.pullRequestCount,
          singlePullRequestStrs,
        });
        if (index >= MAX_TABLE_ITEMS_FOR_SLACK) return;
        prsTable.set(`*@${pra.name}*`, singlePullRequestStrsForSlack);
    });
    const options: any = {
        mergedPrCount: prs.length,
        pullRequestStrs,
    };
    const pullRequestsStr = renderString(this.config.weeklyReportTemplate.pullRequests, options);
    return {
      pullRequestsStr,
      prsTable,
      prsTotal: prs.length,
    };
  }

  private generateCodeReviewOverview(): CodeReviewOverviewResult {
    const lastWeek = getLastWeek();
    // get prs merged last week or still in open state
    const mergedOrOpenPrs = this.client.getRepoData().pulls
        .filter(pr => (pr.mergedAt && pr.mergedAt >= lastWeek) || !pr.closedAt);
    const reviewers = new Array<{
        login: string,
        reviewCount: number,
    }>();
    for (const pr of mergedOrOpenPrs) {
      pr.reviewComments.filter(review => review.createdAt &&
        new Date(review.createdAt) >= lastWeek).forEach(review => {
            const reviewer = reviewers.find(r => r.login === review.login);
            if (reviewer) {
                reviewer.reviewCount++;
            } else {
              reviewers.push({
                  login: review.login,
                  reviewCount: 1,
              });
            }
        });
    }
    reviewers.sort((a, b) => b.reviewCount - a.reviewCount);
    const reviewOverviewStr = renderString(this.config.weeklyReportTemplate.review, {
        alias:  parseRepoName(this.fullName).repo,
        reviewerStrs: reviewers.map(r => renderString(this.config.weeklyReportTemplate.singleReview, r)).join(''),
    });

    const codeReviewsTable: Map<string, string> = new Map<string, string>();
    reviewers.forEach((r, index) => {
      if (index >= MAX_TABLE_ITEMS_FOR_SLACK) return;
      codeReviewsTable.set(`*@${r.login}*`, String(r.reviewCount));
    });
    return {
      reviewOverviewStr,
      codeReviewsTable,
    };
  }

  private generateContributorOverview(): ContributorResult {
    const lastWeek = getLastWeek();
    const owner = parseRepoName(this.fullName).owner;
    const repo = parseRepoName(this.fullName).repo;
    const contributors = this.client.getRepoData().contributors.filter(c => c.time >= lastWeek);
    contributors.reverse();
    let contributorStr: string = '';
    const contributingLink: string = `https://github.com/${owner}/${repo}/blob/master/CONTRIBUTING.md`;
    if (contributors.length > 0) {
      contributorStr = renderString(this.config.weeklyReportTemplate.newContributors, {
            alias: repo,
            contributingLink,
            contributorStrs: contributors.map(c => renderString(
              this.config.weeklyReportTemplate.singleContributor, { login: c.login })).join(EOL),
        });
    } else {
      contributorStr = renderString(this.config.weeklyReportTemplate.noNewContributors,
                                    { alias: repo, contributingLink });
    }

    const contributorsForSlack: string[] = [];
    contributors.map(c => contributorsForSlack.push(c.login));
    return {
      contributorStr,
      contributors: contributorsForSlack,
      contributingLink,
    };
  }

  private getLineBreakerStr(type?: string): string {
    return type === 'slack' ? '\n' : '<br>';
  }
}
