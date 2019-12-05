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
import { CIPlatform } from '../../../app/basic/DataTypes';
import { JenkinsConfig } from '../../../app/component/ci/config';
import { CIRunEvent } from '../../../app/plugin/event-manager/events';

describe('ci', () => {
  let app: Application;
  let agent: Agent;

  class MockCIRunEvent {

    mockNum: number;
    mockJobName: string;
    mockPullNumber: string;
    mockConfig: JenkinsConfig;

    ciName: string;
    pullNumber: number;

    compConfig = {
      enable: true,
      configs: [
        {
          name: '',
          platform: CIPlatform.Jenkins,
          endpoint: '',
          user: '',
          token: '',
          repoToJobMap: [{
            name: 'jenkins1',
            platform: CIPlatform.Jenkins,
            endpoint: '',
            user: '',
            token: '',
            repoToJobMap: [ ],
          }],
        },
      ],
    } as any;

    installationId: number = 42;
    fullName: string = '';
    client: any = {
      getCompConfig: <T>(_: string): T => {
        return this.compConfig;
      },
    };

    constructor() {

      this.mockNum = 0;
      this.mockJobName = '';
      this.mockPullNumber = '';
      this.mockConfig = {} as any;

      app.installation.getClient = () => this.client;

      app.ciManager.runJenkins = ((jobName: string, pullNum: string, config: JenkinsConfig) => {
        this.mockNum++;
        this.mockJobName = jobName;
        this.mockPullNumber = pullNum;
        this.mockConfig = config;
      }) as any;
    }
  }

  beforeEach(async () => {
    ({ app, agent } = await prepareTestApplication());
  });
  afterEach(() => {
    testClear(app, agent);
  });

  it('should not trigger if client is empty', async () => {
    const e = new MockCIRunEvent();
    e.client = undefined;
    agent.event.publish('worker', CIRunEvent, e);
    await waitFor(5);
    assert(e.mockNum === 0);
  });

  it('should not trigger if pullNumber is empty', async () => {
    const e = new MockCIRunEvent();
    e.pullNumber = undefined as any;
    agent.event.publish('worker', CIRunEvent, e);
    await waitFor(5);
    assert(e.mockNum === 0);
  });

  it('should not trigger if compConfig is empty', async () => {
    const e = new MockCIRunEvent();
    e.compConfig = null;
    agent.event.publish('worker', CIRunEvent, e);
    await waitFor(5);
    assert(e.mockNum === 0);

    e.compConfig = {};
    agent.event.publish('worker', CIRunEvent, e);
    await waitFor(5);
    assert(e.mockNum === 0);
  });

  it('should not trigger if compConfig.enable is false', async () => {
    const e = new MockCIRunEvent();
    e.compConfig = { enable: false };
    agent.event.publish('worker', CIRunEvent, e);
    await waitFor(5);
    assert(e.mockNum === 0);
  });

  it('should not trigger if compConfig.configs is empty', async () => {
    const e = new MockCIRunEvent();
    e.compConfig.configs = [];
    agent.event.publish('worker', CIRunEvent, e);
    await waitFor(5);
    assert(e.mockNum === 0);
  });

  it('should not trigger if e.fullName.repo is not in compConfig.configs.repoToJobMap', async () => {
    const e = new MockCIRunEvent();
    e.fullName = 'a/a';
    agent.event.publish('worker', CIRunEvent, e);
    await waitFor(5);
    assert(e.mockNum === 0);

    e.fullName = 'a/a';
    e.ciName = 'jenkins1';
    agent.event.publish('worker', CIRunEvent, e);
    await waitFor(5);
    assert(e.mockNum === 0);
  });

  it('should not trigger if e.ciName is not null and not in compConfig.configs.repoToJobMap', async () => {
    const e = new MockCIRunEvent();
    e.ciName = 'a';
    agent.event.publish('worker', CIRunEvent, e);
    await waitFor(5);
    assert(e.mockNum === 0);
  });

  it('should not trigger if platform not equal jenkins', async () => {
    const e = new MockCIRunEvent();
    e.compConfig.configs[0].platform = '';
    agent.event.publish('worker', CIRunEvent, e);
    await waitFor(5);
    assert(e.mockNum === 0);

    e.compConfig.configs[0].platform = 'aaa';
    agent.event.publish('worker', CIRunEvent, e);
    await waitFor(5);
    assert(e.mockNum === 0);
  });

  it('should be right if e.fullName.repo in compConfig.configs.repoToJobMap', async () => {
    const e = new MockCIRunEvent();
    e.compConfig.configs = [
      {
        name: 'jenkins1',
        platform: CIPlatform.Jenkins,
        endpoint: '',
        user: '',
        token: '',
        repoToJobMap: [ ],
      },
      {
        name: 'jenkins2',
        platform: CIPlatform.Jenkins,
        endpoint: '',
        user: '',
        token: '',
        repoToJobMap: [{ }, { repo: 'repo', job: 'job' }],
      }];
    e.pullNumber = 10;
    e.fullName = 'owner/repo';
    agent.event.publish('worker', CIRunEvent, e);
    await waitFor(5);
    assert(e.mockJobName === 'job' &&
      e.mockPullNumber === '10' &&
      e.mockConfig === e.compConfig.configs[1]);
  });

  it('should be right if e.ciName in compConfig.configs', async () => {
    const e = new MockCIRunEvent();
    e.compConfig.configs = [
      {
        name: 'jenkins1',
        platform: CIPlatform.Jenkins,
        endpoint: '',
        user: '',
        token: '',
        repoToJobMap: [ ],
      },
      {
        name: 'jenkins2',
        platform: CIPlatform.Jenkins,
        endpoint: '',
        user: '',
        token: '',
        repoToJobMap: [{ }, { repo: 'repo', job: 'job' }],
      }];
    e.pullNumber = 10;
    e.fullName = 'owner/repo';
    e.ciName = 'jenkins2';
    agent.event.publish('worker', CIRunEvent, e);
    await waitFor(5);
    assert(e.mockJobName === 'job' &&
      e.mockPullNumber === '10' &&
      e.mockConfig === e.compConfig.configs[1]);
  });

});
