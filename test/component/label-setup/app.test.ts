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
    updateCounter = 0;
    createCounter = 0;

    compConfig = {
      labels: [],
    } as any;
    labels = [] as any;
    installationId: number = 42;
    fullName: string = 'testEvent';
    client: any = {
      getCompConfig: <T>(_: string): T => {
        return this.compConfig;
      },
      listLabels: () => {
        return this.labels;
      },
      updateLabels: <T>(updateTask: T[]): void => {
        this.updateCounter += updateTask.length;
        return;
      },
      createLabels: <T>(createTask: T[]): void => {
        this.createCounter += createTask.length;
        return;
      },
    };

    constructor() {
      app.installation.getClient = () => this.client;
    }

    setNewLabels<T>(configLabels: T[]): void {
      this.compConfig.labels = configLabels;
    }
    setOldLabels<T>(labels: T[]): void {
      this.labels = labels;
    }

  }

  beforeEach(async () => {
    ({ app, agent } = await prepareTestApplication());
  });
  afterEach(() => {
    testClear(app, agent);
  });

  it('should not trigger if client is empty', async () => {
    const e = new MockRepoConfigLoadedEvent();
    e.client = undefined;
    agent.event.publish('worker', RepoConfigLoadedEvent, e);
    await waitFor(5);
    assert(e.updateCounter === 0);
    assert(e.createCounter === 0);
  });

  it('no need to update', async () => {
    const e = new MockRepoConfigLoadedEvent();
    e.setNewLabels([
      { name: 'test1' },
    ]);
    e.setOldLabels([
      { name: 'test1' },
    ]);
    agent.event.publish('worker', RepoConfigLoadedEvent, e);
    await waitFor(5);
    assert(e.updateCounter === 0);
    assert(e.createCounter === 0);
  });

  it('update old labels', async () => {
    const e = new MockRepoConfigLoadedEvent();
    e.setNewLabels([
      { name: 'test1', color: 'color1' },
    ]);
    e.setOldLabels([
      { name: 'test1' },
    ]);
    agent.event.publish('worker', RepoConfigLoadedEvent, e);
    await waitFor(5);
    assert(e.updateCounter === 1);
    assert(e.createCounter === 0);
  });

  it('create new labels', async () => {
    const e = new MockRepoConfigLoadedEvent();
    e.setNewLabels([
      { name: 'test1' },
    ]);
    agent.event.publish('worker', RepoConfigLoadedEvent, e);
    await waitFor(5);
    assert(e.updateCounter === 0);
    assert(e.createCounter === 1);
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
    assert(e.updateCounter === 1);
    assert(e.createCounter === 1);
  });

});
