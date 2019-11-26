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
  let count = 0;

  const getEvent = <T>(enable: boolean): T => {
    return {
      client: {
        getCompConfig: <T>(_: string): T => {
          return { enable } as any;
        },
        listLabels: () => {
          count++;
          return [];
        },
      },
    } as any;
  };

  beforeEach(async () => {
    ({ app, agent } = await prepareTestApplication());
    count = 0;
  });
  afterEach(() => {
    testClear(app, agent);
  });

  it('Should not trigger if enable is false', () => {
    const e = getEvent<RepoConfigLoadedEvent>(false);
    agent.event.publish('worker', RepoConfigLoadedEvent, e);
    waitFor(5);
    assert(count === 0);
  });
});
