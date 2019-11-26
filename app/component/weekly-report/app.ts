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
import { Config } from './config';
import { RepoConfigLoadedEvent, RepoRemovedEvent } from '../../plugin/event-manager/events';
import { IClient } from '../../plugin/installation-manager/IClient';
import { ISchedulerJobHandler } from '../../plugin/scheduler-manager/types';
import { EOL } from 'os';
import { renderString, parseRepoName, getLastWeek } from '../../basic/Utils';
import { PullRequest } from '../../basic/DataTypes';

export default (ctx: ComponentContext<Config>) => {
  ctx.logger.info('Start to load weekly report component');
  const jobHandlerMap: Map<string, ISchedulerJobHandler> = new Map<string, ISchedulerJobHandler>();
  // gen jobs for installed repo
  ctx.app.event.subscribeAll(RepoConfigLoadedEvent, async e => {
    if (!e.client) {
      return;
    }
    const config = e.client.getCompConfig<Config>('weekly-report');
    if (!config || !config.enable) return;
    if (jobHandlerMap.has(`${e.installationId}-${e.fullName}`)) {
      ctx.logger.info(`repo config changed , cancle the old job for repo ${e.fullName}, installationId = ${e.installationId}`);
      cancleJobForRepo(e.installationId, e.fullName, jobHandlerMap);
    }
    ctx.logger.info(`start to generate job for repo ${e.fullName}, installationId = ${e.installationId}`);
    genJobForRepo(e.installationId, e.fullName, e.client, config, jobHandlerMap);
  });
  // remove job for uninstalled repo
  ctx.app.event.subscribeAll(RepoRemovedEvent, async e => {
    ctx.logger.info(`remove job for repo ${e.fullName}, installationId = ${e.installationId}`);
    cancleJobForRepo(e.installationId, e.fullName, jobHandlerMap);
  });

  async function genJobForRepo(installationId: number, fullName: string, client: IClient | undefined, config: Config, jobHandlerMap: Map<string, ISchedulerJobHandler>): Promise<void> {
    if (!client) {
      return;
    }
    const job = ctx.app.sched.register(`${config.jobName}-${installationId}-${fullName}`, config.generateTime, 'worker', () => {
      genWeeklyReportForRepo(installationId, fullName, config, client);
    });
    jobHandlerMap.set(`${installationId}-${fullName}`, job);
  }

  function cancleJobForRepo(installationId: number, fullName: string, jobHandlerMap: Map<string, ISchedulerJobHandler>): void {
    const key = `${installationId}-${fullName}`;
    const job = jobHandlerMap.get(key);
    if (job) {
        job.cancel();
        jobHandlerMap.delete(key);
    }
  }

  async function genWeeklyReportForRepo(installationId: number, fullName: string, config: Config, client: IClient): Promise<void> {
    ctx.logger.info(`start to generate weekly report for repo ${fullName}, installationId = ${installationId}`);
    removeOldWeeklyReports(client);
    const generatedContents: string[] = [];
    generatedContents.push(generateHeader(config, fullName));
    generatedContents.push(generateOverview(config, client));
    generatedContents.push(generatePullRequestOverview(config, client));
    const codeReviewOverviewStr = await generateCodeReviewOverview(config, fullName, client);
    generatedContents.push(codeReviewOverviewStr);
    generatedContents.push(generateContributorOverview(config, fullName, client));
    const weeklyReportStr = generatedContents.join(EOL);
    const title = renderString(config.weeklyReportTemplate.title, {
        alias: parseRepoName(fullName).repo,
        startTime: getLastWeek().toLocaleDateString(),
        endTime: new Date().toLocaleDateString(),
    });
    await client.addIssue(title, weeklyReportStr, [ 'weekly-report' ]);
    ctx.logger.info(`Generate weekly report for ${fullName} done.`);
  }

  function removeOldWeeklyReports(client: IClient): void {
    const removeIssues = client.getRepoData().issues.filter(
        issue => issue.labels.some(l => l === 'weekly-report'));
    if (removeIssues.length === 0) return;
    removeIssues.forEach(issue => {
        client.updateIssue(issue.number, { state: 'closed' });
    });
  }

  function generateHeader(config: Config, fullName: string): string {
      return renderString(config.weeklyReportTemplate.header, { alias: parseRepoName(fullName).repo });
  }
  function generateOverview(config: Config, client: IClient): string {
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
            fork: repoData.forks.length,
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
    return overviewStr;
  }
  function generatePullRequestOverview(config: Config, client: IClient): string {
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

    pullRequestAuthors.sort((a, b) => b.pullRequestCount - a.pullRequestCount);

    let pullRequestStrs = '';
    pullRequestAuthors.forEach(pra => {
        let singlePullRequestStrs = '';
        pra.pulls.forEach(pr => {
          singlePullRequestStrs += renderString(config.weeklyReportTemplate.singlePullRequest, {
            title: pr.title,
            number: pr.number,
          });
        });
        pullRequestStrs += renderString(config.weeklyReportTemplate.singleAuthorPullRequest, {
          name: pra.name,
          count: pra.pullRequestCount,
          singlePullRequestStrs,
        });
    });
    const options: any = {
        mergedPrCount: prs.length,
        pullRequestStrs,
    };
    const pullRequestsStr = renderString(config.weeklyReportTemplate.pullRequests, options);
    return pullRequestsStr;
  }
  async function generateCodeReviewOverview(config: Config, fullName: string, client: IClient): Promise<string> {
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
    return reviewOverviewStr;
  }
  function generateContributorOverview(config: Config, fullName: string, client: IClient): string {
    const lastWeek = getLastWeek();
    const contributors = client.getRepoData().contributors.filter(c => c.time >= lastWeek);
    contributors.reverse();
    if (contributors.length > 0) {
        return renderString(config.weeklyReportTemplate.newContributors, {
            alias: parseRepoName(fullName).repo,
            owner: parseRepoName(fullName).owner,
            repo: parseRepoName(fullName).repo,
            contributorStrs: contributors.map(c => renderString(config.weeklyReportTemplate.singleContributor,
                { login: c.login })).join(EOL),
        });
    } else {
        return renderString(config.weeklyReportTemplate.noNewContributors, { alias: parseRepoName(fullName).repo });
    }
  }
};
