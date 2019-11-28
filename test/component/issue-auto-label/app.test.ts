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

'use strict';

import assert from 'assert';
import { waitFor, prepareTestApplication, testClear } from '../../Util';
import { Application, Agent } from 'egg';
import { IssueEvent } from '../../../app/plugin/event-manager/events';

describe('IssueAutoLabelComponent', () => {
  let app: Application;
  let agent: Agent;

  class MockIssueEvent {
    // the number of update/create labels
    issueNumber: number;
    attachLabels: string[];

    action = 'opened' as any;
    issue: any = {
      number: 3,
      title: '',
      body: '',
    };
    changes: {};

    compConfig = {
      enable: true,
      labels: [],
    } as any;
    labels = [] as any;
    installationId: number = 42;
    fullName: string = 'testEvent';
    client: any = {
      getCompConfig: <T>(_: string): T => {
        return this.compConfig;
      },
      addLabels: (number: number, labels: string[]): void => {
        this.issueNumber = number;
        this.attachLabels = labels;
        return;
      },
    };

    constructor() {
      app.installation.getClient = () => this.client;
    }

    setConfigEnable(enable: boolean = true): void {
      this.compConfig.enable = enable;
    }
    setLabels<T>(configLabels: T[]): void {
      this.compConfig.labels = configLabels;
    }
    setIssue(issue) {
      Object.assign(this.issue, issue);
    }

  }

  beforeEach(async () => {
    ({ app, agent } = await prepareTestApplication());
  });
  afterEach(() => {
    testClear(app, agent);
  });

  it('should not trigger if client is empty', async () => {
    const e = new MockIssueEvent();
    e.client = undefined;
    agent.event.publish('worker', IssueEvent, e);
    await waitFor(5);
    assert(e.issueNumber === undefined);
    assert(e.attachLabels === undefined);
  });

  it('should not trigger if action is not opened or edited', async () => {
    const e = new MockIssueEvent();
    e.action = 'labeled';
    agent.event.publish('worker', IssueEvent, e);
    await waitFor(5);
    assert(e.issueNumber === undefined);
    assert(e.attachLabels === undefined);
  });

  it('should not trigger if enable is false', async () => {
    const e = new MockIssueEvent();
    e.setConfigEnable(false);
    agent.event.publish('worker', IssueEvent, e);
    await waitFor(5);
    assert(e.issueNumber === undefined);
    assert(e.attachLabels === undefined);
  });

  it('unable to find keyword', async () => {
    const e = new MockIssueEvent();
    e.setLabels([
      {
        name: 'kind/discussion',
        keywords: [ 'discussion' ],
      },
    ]);
    e.setIssue({
      title: 'this is a bug',
    });
    agent.event.publish('worker', IssueEvent, e);
    await waitFor(5);
    assert(e.issueNumber === undefined);
    assert(e.attachLabels === undefined);
  });

  it('enable to find keyword', async () => {
    const e = new MockIssueEvent();
    e.setLabels([
      {
        name: 'kind/bug',
        keywords: [ 'bug' ],
      },
      {
        name: 'kind/feature',
        keywords: [ 'feature' ],
      },
      {
        name: 'kind/question',
      },
    ]);
    e.setIssue({
      number: 1,
      title: '[feature][bug] this is a bug',
    });
    agent.event.publish('worker', IssueEvent, e);
    await waitFor(10);
    assert.equal(e.issueNumber, 1);
    assert.deepEqual(e.attachLabels, [ 'kind/bug', 'kind/feature' ]);
  });

});
