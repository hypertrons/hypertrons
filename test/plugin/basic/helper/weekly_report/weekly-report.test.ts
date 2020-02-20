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

// 'use strict';

// import assert from 'assert';
// import { prepareTestApplication, testClear, waitFor } from '../../../../Util';
// import { Application, Agent } from 'egg';
// import Config from '../../../../../app/component/weekly_report/config';
// import defaultConfig from '../../../../../app/component/weekly_report/defaultConfig';
// import WeeklyReport from '../../../../../app/basic/helper/weekly-report/weekly-report';
// import mock from 'egg-mock';

// describe('Weekly report test', () => {
//   let app: Application;
//   let agent: Agent;
//   const logPrefix = '[weekly-report-test]';
//   beforeEach(async () => {
//     ({ app, agent } = await prepareTestApplication());
//   });
//   afterEach(() => {
//     testClear(app, agent);
//   });

//   describe('onLoaded', () => {
//     const ctx = {
//       app,
//       logger: {
//         info: (msg: any, ...args: any) => app.logger.info(logPrefix, msg, ...args),
//       },
//     };
//     let weeklyReport: WeeklyReport;
//     class MockEvent {
//       newJobCounter: number = 0;
//       compConfig = {} as any;
//       installationId: number = 0;
//       fullName: string = 'a/b';
//       client: any = {
//         getCompConfig: <T>(_: string): T | undefined => {
//           return this.compConfig;
//         },
//         addJob: (): void => {
//           this.newJobCounter++;
//         },
//       };
//       constructor() {
//         app.installation.getClient = () => this.client;
//       }
//     }
//     let e: MockEvent;
//     beforeEach(async () => {
//       ctx.app = app;
//       weeklyReport = new WeeklyReport((ctx as any));
//       e = new MockEvent();
//       mock(weeklyReport, 'genJobForRepo', (_iId: number, _name: string, client: any, _config: any): void => {
//         client.addJob();
//       });
//     });
//     afterEach(mock.restore);
//     it('should not trigger if client is empty', async () => {
//       e.client = undefined;
//       weeklyReport.onLoaded();
//       agent.event.publish('worker', RepoConfigLoadedEvent, e);
//       await waitFor(5);
//       assert.strictEqual(e.newJobCounter, 0);
//     });
//     it('should not trigger if config is empty', async () => {
//       e.compConfig = undefined;
//       weeklyReport.onLoaded();
//       agent.event.publish('worker', RepoConfigLoadedEvent, e);
//       await waitFor(5);
//       assert.strictEqual(e.newJobCounter, 0);
//     });
//     it('should generate job when new repo is added', async () => {
//       weeklyReport.onLoaded();
//       agent.event.publish('worker', RepoConfigLoadedEvent, e);
//       await waitFor(5);
//       assert.strictEqual(e.newJobCounter, 1);
//     });
//     // TODO upate this test case
//     // it('should re-generate the current job when config is reload', async () => {
//     //   mock(weeklyReport, 'cancleJobForRepo', (_iId: number, _name: string): void => { });
//     //   (weeklyReport as any).jobHandlerMap.set('0-a/b', 'testJob');
//     //   weeklyReport.onLoaded();
//     //   agent.event.publish('worker', RepoConfigLoadedEvent, e);
//     //   await waitFor(5);
//     //   assert.strictEqual(e.newJobCounter, 1);
//     // });
//     // TODO upate this test case
//     // it('should cancel the current job when config is reload and enable is false', async () => {
//     //   mock(weeklyReport, 'cancleJobForRepo', (_iId: number, _name: string): void => { });
//     //   (weeklyReport as any).jobHandlerMap.set('0-a/b', 'testJob');
//     //   weeklyReport.onLoaded();
//     //   agent.event.publish('worker', RepoConfigLoadedEvent, e);
//     //   await waitFor(5);
//     //   assert.strictEqual(e.newJobCounter, 0);
//     // });
//     it('should cancel the current job when receive RepoRemovedEvent', async () => {
//       class Job {
//         cancleCounter = 0;
//         cancel(): void {
//           this.cancleCounter++;
//         }
//       }
//       const job: Job = new Job();
//       (weeklyReport as any).jobHandlerMap.set('0-a/b', job);
//       weeklyReport.onLoaded();
//       agent.event.publish('worker', RepoRemovedEvent, e);
//       await waitFor(5);
//       assert.strictEqual(e.newJobCounter, 0);
//       assert.strictEqual(job.cancleCounter, 1);
//     });
//   });

//   describe('genJobForRepo', () => {
//     const ctx: any = {
//       app,
//     };
//     let weeklyReport: WeeklyReport;
//     const config: any = {
//       generateTime: '0 0 0 0 0 1',
//     };
//     beforeEach(async () => {
//       ctx.app = app;
//       weeklyReport = new WeeklyReport((ctx as any));
//     });
//     it('should not trigger if client is empty', async () => {
//       (weeklyReport as any).genJobForRepo(0, 'a/b', undefined, config);
//       assert.strictEqual((weeklyReport as any).jobHandlerMap.size, 0);
//     });
//     it('should generate the job', async () => {
//       const client = {
//         getRepoData: (): any => {
//           return [];
//         },
//       };
//       (weeklyReport as any).genJobForRepo(0, 'a/b', client, config);
//       assert.strictEqual((weeklyReport as any).jobHandlerMap.size, 1);
//     });
//   });

//   describe('cancleJobForRepo', () => {
//     const ctx: any = {};
//     let weeklyReport: WeeklyReport;
//     class Job {
//       cancleCounter = 0;
//       cancel(): void {
//         this.cancleCounter++;
//       }
//     }
//     let job: Job;
//     beforeEach(async () => {
//       weeklyReport = new WeeklyReport((ctx as any));
//       job = new Job();
//     });
//     it('no need to cancle if jobHandlerMap is empty', async () => {
//       (weeklyReport as any).cancleJobForRepo(0, 'a/b');
//       assert.strictEqual((weeklyReport as any).jobHandlerMap.size, 0);
//       assert.strictEqual(job.cancleCounter, 0);
//     });
//     it('no need to cancle if given job does not exist', async () => {
//       (weeklyReport as any).jobHandlerMap.set('0-a/b', job);
//       (weeklyReport as any).cancleJobForRepo(1, 'c/d');
//       assert.strictEqual((weeklyReport as any).jobHandlerMap.size, 1);
//       assert.strictEqual(job.cancleCounter, 0);
//     });
//     it('should cancle the given job', async () => {
//       (weeklyReport as any).jobHandlerMap.set('0-a/b', job);
//       (weeklyReport as any).cancleJobForRepo(0, 'a/b');
//       assert.strictEqual((weeklyReport as any).jobHandlerMap.size, 0);
//       assert.strictEqual(job.cancleCounter, 1);
//     });
//   });

//   describe('genSlackWeeklyReportForRepo', () => {
//     const ctx: any = {};
//     let weeklyReport: WeeklyReport;
//     class Client {
//       compConfig = {} as any;
//       getCompConfig<T>(_: string): T { return this.compConfig; }
//     }
//     let client: Client;
//     beforeEach(async () => {
//       weeklyReport = new WeeklyReport((ctx as any));
//       client = new Client();
//     });
//     it('should not trigger if configuration of slack is empty', async () => {
//       client.compConfig = { slack: [] };
//       (weeklyReport as any).genSlackWeeklyReportForRepo(0, 'a/b', {} as any, client);
//     });
//   });

//   describe('removeOldWeeklyReports', () => {
//     const ctx: any = {};
//     let weeklyReport: WeeklyReport;
//     class Client {
//       removeCounter: number = 0;
//       repoData: any;
//       getRepoData(): any {
//         return this.repoData;
//       }
//       async updateIssue(_number: number, _state?: 'open' | 'closed'): Promise<void> {
//         this.removeCounter++;
//       }
//     }
//     let client: Client;
//     beforeEach(async () => {
//       weeklyReport = new WeeklyReport((ctx as any));
//       client = new Client();
//     });
//     it('should not trigger if there is no old weekly report', async () => {
//       client.repoData = {
//         issues: [],
//       };
//       (weeklyReport as any).removeOldWeeklyReports(client);
//       assert.strictEqual(client.removeCounter, 0);
//     });
//     it('should remove old weekly report', async () => {
//       client.repoData = {
//         issues: [
//           {
//             number: 1,
//             labels: [ 'weekly-report' ],
//           },
//           {
//             number: 2,
//             labels: [ 'weekly-report' ],
//           },
//         ],
//       };
//       (weeklyReport as any).removeOldWeeklyReports(client);
//       assert.strictEqual(client.removeCounter, 2);
//     });
//   });

//   describe('generateContent', () => {
//     let config: Config;
//     let weeklyReport: WeeklyReport;
//     const ctx = {
//       logger: {
//         info: (msg: any, ...args: any) => app.logger.info(logPrefix, msg, ...args),
//       },
//     };
//     beforeEach(async () => {
//       config = defaultConfig;
//       weeklyReport = new WeeklyReport((ctx as any));
//     });

//     it('generateHeader', () => {
//       config.weeklyReportTemplate.header = 'this is {{alias}}';
//       const res = (weeklyReport as any).generateHeader(config, 'a/b');
//       assert.strictEqual(res, 'this is b');
//     });

//     it('generateOverview', () => {
//       config.weeklyReportTemplate.overview = '| {{watch}} | {{star}} ({{starDelta}}) | {{fork}} ({{forkDelta}}) | {{contributor}} ({{contributorDelta}}) | {{newIssue}} | {{closeIssue}} | {{newPr}} | {{mergedPr}} |';
//       const client: any = {
//         getRepoData: (): any => {
//           const repoData: any = {
//             stars: [],
//             watchCount: 0,
//             forkCount: 0,
//             forks: [],
//             contributors: [],
//             issues: [],
//             pulls: [],
//           };
//           return repoData;
//         },
//       };
//       const expectedOverviewStr = '| 0 | 0 (-) | 0 (-) | 0 (-) | 0 | 0 | 0 | 0 |';
//       const res = (weeklyReport as any).generateOverview(config, client);
//       assert.strictEqual(res.overviewStr, expectedOverviewStr);
//     });

//     it('generatePullRequestOverview', async () => {
//       const time = new Date();
//       config.weeklyReportTemplate.pullRequests = `{{mergedPrCount}}
// | Contributor ID | Count | Pull Requests |
// |:--------------:|:-----:|:-------------|
// {{pullRequestStrs}}`;
//       const client: any = {
//         getRepoData: (): any => {
//           const repoData: any = {
//             pulls: [
//               {
//                 author: 'a',
//                 number: 1,
//                 mergedAt: time,
//                 title: 'a',
//               },
//               {
//                 author: 'b',
//                 number: 2,
//                 mergedAt: time,
//                 title: 'b-1',
//               },
//               {
//                 author: 'b',
//                 number: 3,
//                 mergedAt: time,
//                 title: 'b-2',
//               },
//               {
//                 author: 'c',
//                 number: 4,
//                 mergedAt: time,
//                 title: 'c',
//               },
//               {
//                 author: 'd',
//                 number: 5,
//                 mergedAt: time,
//                 title: 'd',
//               },
//               {
//                 author: 'e',
//                 number: 6,
//                 mergedAt: time,
//                 title: 'e',
//               },
//               {
//                 author: 'f',
//                 number: 7,
//                 mergedAt: time,
//                 title: 'f',
//               },
//             ],
//           };
//           return repoData;
//         },
//       };
//       const expectedPullRequestsStr = `7
// | Contributor ID | Count | Pull Requests |
// |:--------------:|:-----:|:-------------|
// | @b | 2 | #2 b-1 <br>#3 b-2 <br> |
// | @a | 1 | #1 a <br> |
// | @c | 1 | #4 c <br> |
// | @d | 1 | #5 d <br> |
// | @e | 1 | #6 e <br> |
// | @f | 1 | #7 f <br> |
// `;
//       const res = (weeklyReport as any).generatePullRequestOverview(config, client);
//       assert.strictEqual(res.pullRequestsStr, expectedPullRequestsStr);
//       assert.strictEqual(res.prsTable.size, 5);
//     });

//     it('generateCodeReviewOverview', async () => {
//       const time = new Date();
//       config.weeklyReportTemplate.review = `{{alias}}
// {{reviewerStrs}}`;
//       const client: any = {
//         getRepoData: (): any => {
//           const repoData: any = {
//             pulls: [
//               {
//                 mergedAt: time,
//                 reviewComments: [
//                   {
//                     createdAt: time,
//                     login: 'a',
//                   },
//                 ],
//               },
//               {
//                 mergedAt: time,
//                 reviewComments: [
//                   {
//                     createdAt: time,
//                     login: 'b',
//                   },
//                 ],
//               },
//               {
//                 mergedAt: time,
//                 reviewComments: [
//                   {
//                     createdAt: time,
//                     login: 'b',
//                   },
//                 ],
//               },
//             ],
//           };
//           return repoData;
//         },
//       };
//       const expectedReviewOverviewStr = `b
// | @b | 2 |
// | @a | 1 |
// `;
//       const res = (weeklyReport as any).generateCodeReviewOverview(config, 'a/b', client);
//       assert.strictEqual(res.reviewOverviewStr, expectedReviewOverviewStr);
//       assert.strictEqual(res.codeReviewsTable.size, 2);
//     });

//     it('generateCodeReviewOverview with no CodeReview', async () => {
//       config.weeklyReportTemplate.review = `{{alias}}
// | Contributor ID | Pull Request Reviews |
// |:--------------:|:--------------------:|
// {{reviewerStrs}}`;
//       const client: any = {
//         getRepoData: (): any => {
//           const repoData: any = {
//             pulls: [],
//           };
//           return repoData;
//         },
//       };
//       const expectedReviewOverviewStr = `b
// | Contributor ID | Pull Request Reviews |
// |:--------------:|:--------------------:|
// `;
//       const res = (weeklyReport as any).generateCodeReviewOverview(config, 'a/b', client);
//       assert.strictEqual(res.reviewOverviewStr, expectedReviewOverviewStr);
//       assert.strictEqual(res.codeReviewsTable.size, 0);
//     });

//     it('generateContributorOverview with new contributors', () => {
//       const time = new Date();
//       config.weeklyReportTemplate.newContributors = `{{contributingLink}}
// {{contributorStrs}}`;
//       const client: any = {
//         getRepoData: (): any => {
//           const repoData: any = {
//             contributors: [
//               {
//                 login: 'a',
//                 time,
//               },
//             ],
//           };
//           return repoData;
//         },
//       };
//       const expectedContributorStr = `https://github.com/a/b/blob/master/CONTRIBUTING.md
// @a
// `;
//       const res = (weeklyReport as any).generateContributorOverview(config, 'a/b', client);
//       assert.strictEqual(res.contributorStr, expectedContributorStr);
//       assert.strictEqual(res.contributors.length, 1);
//     });

//     it('generateContributorOverview with no contributors', () => {
//       config.weeklyReportTemplate.noNewContributors = `{{alias}}
// {{contributingLink}}`;
//       const client: any = {
//         getRepoData: (): any => {
//           const repoData: any = {
//             contributors: [],
//           };
//           return repoData;
//         },
//       };
//       const expectedContributorStr = `b
// https://github.com/a/b/blob/master/CONTRIBUTING.md`;
//       const res = (weeklyReport as any).generateContributorOverview(config, 'a/b', client);
//       assert.strictEqual(res.contributorStr, expectedContributorStr);
//       assert.strictEqual(res.contributors.length, 0);
//     });
//     it('getLineBreakerStr', () => {
//       const res = (weeklyReport as any).getLineBreakerStr();
//       assert.strictEqual(res, '<br>');
//     });
//     it('getLineBreakerStr for github', () => {
//       const res = (weeklyReport as any).getLineBreakerStr('github');
//       assert.strictEqual(res, '<br>');
//     });
//     it('getLineBreakerStr for slack', () => {
//       const res = (weeklyReport as any).getLineBreakerStr('slack');
//       assert.strictEqual(res, '\n');
//     });
//   });
// });
