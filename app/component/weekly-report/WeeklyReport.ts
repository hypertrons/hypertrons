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

import { ComponentContext } from '../../basic/ComponentHelper';
import Config from './config';
import IMConfig from '../im/config';
import { RepoConfigLoadedEvent, RepoRemovedEvent } from '../../plugin/event-manager/events';
import { IClient } from '../../plugin/installation-manager/IClient';
import { ISchedulerJobHandler } from '../../plugin/scheduler-manager/types';
import { EOL } from 'os';
import { renderString, parseRepoName, getLastWeek } from '../../basic/Utils';
import { PullRequest } from '../../basic/DataTypes';
import { IncomingWebhookSendArguments } from '@slack/webhook/dist/IncomingWebhook';
import { generateSlackWeeklyReport } from './helper';

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

export default class WeeklyReport {
  private ctx: ComponentContext<Config>;
  private jobHandlerMap: Map<string, ISchedulerJobHandler>;
  constructor(ctx: ComponentContext<Config>) {
    this.ctx = ctx;
    this.jobHandlerMap = new Map<string, ISchedulerJobHandler>();
  }
  public async onLoaded(): Promise<void> {
    this.ctx.app.event.subscribeOne(RepoConfigLoadedEvent, async e => {
      if (!e.client) {
        return;
      }
      const config = e.client.getCompConfig<Config>(this.ctx.name);
      if (this.jobHandlerMap.has(`${e.installationId}-${e.fullName}`)) {
        this.ctx.logger.info(`cancle the job for repo ${e.fullName}, installationId = ${e.installationId}`);
        this.cancleJobForRepo(e.installationId, e.fullName);
      }
      if (!config) return;
      this.ctx.logger.info(`start to generate job for repo ${e.fullName}, installationId = ${e.installationId}, generateTime = ${config.generateTime}`);
      this.genJobForRepo(e.installationId, e.fullName, e.client, config);
    });
    // remove job for uninstalled repo
    this.ctx.app.event.subscribeOne(RepoRemovedEvent, async e => {
      if (this.jobHandlerMap.has(`${e.installationId}-${e.fullName}`)) {
        this.ctx.logger.info(`remove job for repo ${e.fullName}, installationId = ${e.installationId}`);
        this.cancleJobForRepo(e.installationId, e.fullName);
      }
    });
  }
  private genJobForRepo(installationId: number, fullName: string, client: IClient | undefined, config: Config): void {
    if (!client) {
      return;
    }
    const job = this.ctx.app.sched.register(`${config.jobName}-${installationId}-${fullName}`, config.generateTime, 'worker', () => {
      this.genWeeklyReportForRepo(installationId, fullName, config, client);
    });
    this.jobHandlerMap.set(`${installationId}-${fullName}`, job);
  }
  private cancleJobForRepo(installationId: number, fullName: string): void {
    const key = `${installationId}-${fullName}`;
    const job = this.jobHandlerMap.get(key);
    if (job) {
      job.cancel();
      this.jobHandlerMap.delete(key);
    }
  }
  private async genWeeklyReportForRepo(installationId: number, fullName: string, config: Config, client: IClient): Promise<void> {
    this.genIssueWeeklyReportForRepo(installationId, fullName, config, client);
    this.genSlackWeeklyReportForRepo(installationId, fullName, config, client);
  }
  private async genIssueWeeklyReportForRepo(installationId: number, fullName: string, config: Config, client: IClient): Promise<void> {
    this.ctx.logger.info(`start to generate github/gitlab weekly report for repo ${fullName}, installationId = ${installationId}`);
    this.removeOldWeeklyReports(client);
    const generatedContents: string[] = [];
    generatedContents.push(this.generateHeader(config, fullName));
    generatedContents.push(this.generateOverview(config, client).overviewStr);
    generatedContents.push(this.generatePullRequestOverview(config, client).pullRequestsStr);
    generatedContents.push(this.generateCodeReviewOverview(config, fullName, client).reviewOverviewStr);
    generatedContents.push(this.generateContributorOverview(config, fullName, client).contributorStr);
    const weeklyReportStr = generatedContents.join(EOL);
    const title = renderString(config.weeklyReportTemplate.title, {
        alias: parseRepoName(fullName).repo,
        startTime: getLastWeek().toLocaleDateString(),
        endTime: new Date().toLocaleDateString(),
    });
    await client.addIssue(title, weeklyReportStr, [ 'weekly-report' ]);
    this.ctx.logger.info(`Generate github/gitlab weekly report for ${installationId}/${fullName} done.`);
  }
  private async genSlackWeeklyReportForRepo(installationId: number, fullName: string, config: Config, client: IClient): Promise<void> {
    const imConfig = client.getCompConfig<IMConfig>('im');
    if (!imConfig || !imConfig.slack) return;
    this.ctx.logger.info(`start to generate weekly report to slack for repo ${fullName}, installationId = ${installationId}`);
    const weeklyReportStrForSlack: IncomingWebhookSendArguments = generateSlackWeeklyReport(
      fullName,
      this.generateOverview(config, client).basicDataTable,
      this.generateOverview(config, client).issuesAndPRsTable,
      this.generatePullRequestOverview(config, client).prsTable, this.generatePullRequestOverview(config, client).prsTotal,
      this.generateCodeReviewOverview(config, fullName, client).codeReviewsTable,
      this.generateContributorOverview(config, fullName, client).contributors, this.generateContributorOverview(config, fullName, client).contributingLink,
    );
    imConfig.slack.forEach(async v => {
      await this.ctx.app.imManager.sendToSlack(weeklyReportStrForSlack, v);
    });
    this.ctx.logger.info(`Generate slack weekly report for ${installationId}/${fullName} done.`);
  }
  private removeOldWeeklyReports(client: IClient): void {
    const removeIssues = client.getRepoData().issues.filter(
        issue => issue.labels.some(l => l === 'weekly-report'));
    if (removeIssues.length === 0) return;
    removeIssues.forEach(issue => {
        client.updateIssue(issue.number, { state: 'closed' });
    });
  }
  private generateHeader(config: Config, fullName: string): string {
      return renderString(config.weeklyReportTemplate.header, { alias: parseRepoName(fullName).repo });
  }
  private generateOverview(config: Config, client: IClient): OverviewResult {
    interface WeeklyData {
      star: number;
      contributor: number;
      fork: number;
      watch: number;
    }
    const lastWeek = getLastWeek();
    const repoData = client.getRepoData();
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

    const overviewStr = renderString(config.weeklyReportTemplate.overview, {
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
  private generatePullRequestOverview(config: Config, client: IClient): PullRequestOverviewResult {
    const lastWeek = getLastWeek();
    // prs : all pull requests in last week
    const prs = client.getRepoData().pulls.filter(pr =>
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
          singlePullRequestStrs += renderString(config.weeklyReportTemplate.singlePullRequest, {
            title: pr.title,
            number: pr.number,
            linebreaker: this.getLineBreakerStr(),
          });

          if (index >= MAX_TABLE_ITEMS_FOR_SLACK) return;

          singlePullRequestStrsForSlack += renderString(config.weeklyReportTemplate.singlePullRequest, {
            title: pr.title,
            number: pr.number,
            linebreaker: this.getLineBreakerStr('slack'),
          });
        });
        pullRequestStrs += renderString(config.weeklyReportTemplate.singleAuthorPullRequest, {
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
    const pullRequestsStr = renderString(config.weeklyReportTemplate.pullRequests, options);
    return {
      pullRequestsStr,
      prsTable,
      prsTotal: prs.length,
    };
  }
  private generateCodeReviewOverview(config: Config, fullName: string, client: IClient): CodeReviewOverviewResult {
    const lastWeek = getLastWeek();
    // get prs merged last week or still in open state
    const mergedOrOpenPrs = client.getRepoData().pulls
        .filter(pr => (pr.mergedAt && pr.mergedAt >= lastWeek) || !pr.closedAt);
    const reviewers = new Array<{
        login: string,
        reviewCount: number,
    }>();
    for (const pr of mergedOrOpenPrs) {
      pr.reviewComments.filter(review => review.createdAt && new Date(review.createdAt) >= lastWeek).forEach(review => {
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
    const reviewOverviewStr = renderString(config.weeklyReportTemplate.review, {
        alias:  parseRepoName(fullName).repo,
        reviewerStrs: reviewers.map(r => renderString(config.weeklyReportTemplate.singleReview, r)).join(''),
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
  private generateContributorOverview(config: Config, fullName: string, client: IClient): ContributorResult {
    const lastWeek = getLastWeek();
    const owner = parseRepoName(fullName).owner;
    const repo = parseRepoName(fullName).repo;
    const contributors = client.getRepoData().contributors.filter(c => c.time >= lastWeek);
    contributors.reverse();
    let contributorStr: string = '';
    const contributingLink: string = `https://github.com/${owner}/${repo}/blob/master/CONTRIBUTING.md`;
    if (contributors.length > 0) {
      contributorStr = renderString(config.weeklyReportTemplate.newContributors, {
            alias: repo,
            contributingLink,
            contributorStrs: contributors.map(c => renderString(config.weeklyReportTemplate.singleContributor,
                { login: c.login })).join(EOL),
        });
    } else {
      contributorStr = renderString(config.weeklyReportTemplate.noNewContributors, { alias: repo, contributingLink });
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
