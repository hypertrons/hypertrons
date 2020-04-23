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

'use strict';

import { prepareTestApplication, testClear } from '../../Util';
import { Application, Agent } from 'egg';
import { CIPlatform } from '../../../app/basic/DataTypes';

describe('AppCIManager', () => {
  let app: Application;
  let agent: Agent;

  beforeEach(async () => {
    ({ app, agent } = await prepareTestApplication());
  });
  afterEach(() => {
    testClear(app, agent);
  });

  describe('runJenkins()', () => {
    it('should not trigger build() if jobName or pullNum or config is null', async () => {
      await app.ciManager.runJenkins(undefined as any, undefined as any, undefined as any);
      await app.ciManager.runJenkins(null as any, null as any, null as any);
      await app.ciManager.runJenkins('' as any, '' as any, '' as any);
    });

    it('should be error if jobName or config is incurrect', async () => {
      await app.ciManager.runJenkins('a', 'a', {
        name: '',
        platform: CIPlatform.Jenkins,
        endpoint: 'a',
        user: 'a',
        token: 'a',
        repoToJobMap: null as any,
        timeout: 10,
      });
    });
  });

});
