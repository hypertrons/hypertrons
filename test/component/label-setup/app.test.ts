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
import { RepoConfigLoadedEvent } from '../../../app/plugin/event-manager/events';

describe('LabelSetupComponent', () => {
  let app: Application;
  let agent: Agent;

  class MockRepoConfigLoadedEvent {
    /**
     * Function execution counter. When a function is called,
     * the corresponding position result will at least +1
     *
     * positon     function          increments
     * counter[0]  getCompConfig()   +1
     * counter[1]  listLabels()      +1
     * counter[2]  updateLabels()    +updateTask.length
     * counter[3]  createLabels()    +createTask.length
     */
    counter = [ 0, 0, 0, 0 ];

    compConfig = {
      enable: true,
      labels: [],
    } as any;
    labels = [] as any;
    installationId: number = 42;
    fullName: string = 'testEvent';
    client: any = {
      getCompConfig: <T>(_: string): T => {
        this.counter[0]++;
        return this.compConfig;
      },
      listLabels: () => {
        this.counter[1]++;
        return this.labels;
      },
      updateLabels: <T>(updateTask: T[]): void => {
        this.counter[2] += updateTask.length;
        return;
      },
      createLabels: <T>(createTask: T[]): void => {
        this.counter[3] += createTask.length;
        return;
      },
    };

    constructor() {
      app.installation.getClient = () => this.client;
    }

    setConfigEnable(enable: boolean = true): void {
      this.compConfig.enable = enable;
    }
    setNewLabels<T>(configLabels: T[]): void {
      this.compConfig.labels = configLabels;
    }
    setOldLabels<T>(labels: T[]): void {
      this.labels = labels;
    }

  }

  const checkCounter = (e: MockRepoConfigLoadedEvent, ...expection: number[]) => {
    for (let i = 0; i < expection.length; i++) {
      assert(e.counter[i] === expection[i]);
    }
  };

  beforeEach(async () => {
    ({ app, agent } = await prepareTestApplication());
  });
  afterEach(() => {
    testClear(app, agent);
  });

  it('should not trigger if enable is false', async () => {
    const e = new MockRepoConfigLoadedEvent();
    e.setConfigEnable(false);
    agent.event.publish('worker', RepoConfigLoadedEvent, e);
    await waitFor(5);
    checkCounter(e, 1, 0, 0, 0);
  });

  it('no need to update', async () => {
    const e = new MockRepoConfigLoadedEvent();
    e.setNewLabels([
      { name: 'test1' },
      { name: 'test2' },
    ]);
    e.setOldLabels([
      { name: 'test1' },
      { name: 'test2' },
    ]);
    agent.event.publish('worker', RepoConfigLoadedEvent, e);
    await waitFor(5);
    checkCounter(e, 1, 1, 0, 0);
  });

  it('update old labels', async () => {
    const e = new MockRepoConfigLoadedEvent();
    e.setNewLabels([
      { name: 'test1', color: 'color1' },
      { name: 'test2', color: 'color2' },
    ]);
    e.setOldLabels([
      { name: 'test1' },
      { name: 'test2' },
    ]);
    agent.event.publish('worker', RepoConfigLoadedEvent, e);
    await waitFor(5);
    checkCounter(e, 1, 1, 2, 0);
  });

  it('create new labels', async () => {
    const e = new MockRepoConfigLoadedEvent();
    e.setNewLabels([
      { name: 'test1' },
      { name: 'test2' },
    ]);
    agent.event.publish('worker', RepoConfigLoadedEvent, e);
    await waitFor(5);
    checkCounter(e, 1, 1, 0, 2);
  });

  it('mixed tests', async () => {
    const e = new MockRepoConfigLoadedEvent();
    e.setNewLabels([
      { name: 'test1' },
      { name: 'test2', description: 'description2' },
      { name: 'test3' },
    ]);
    e.setOldLabels([
      { name: 'test1' },
      { name: 'test2' },
    ]);
    agent.event.publish('worker', RepoConfigLoadedEvent, e);
    await waitFor(5);
    checkCounter(e, 1, 1, 1, 1);
  });

});
