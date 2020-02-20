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

import { Agent } from 'egg';
import { initWebhooks } from '../plugin/github/GitHubTestUtil';
import { prepareTestApplication, testClear } from '../Util';
import { MockApplication } from 'egg-mock';

describe('Docs Controller', () => {
  let app: MockApplication;
  let agent: Agent;

  before(async () => {
    ({ app, agent } = await prepareTestApplication() as any);
    await initWebhooks(app);
  });
  after(() => {
    testClear(app, agent);
  });

  describe('GET /docs/:installationName/:owner/:repo/community.svg', () => {
    it('should status 200', async () => {
      // body is hard to judge
      // const client = await app.github.getClient(0, 'owner/repo');
      // if (client) {
      //   client.communitySvgImage();
      // }

      return app.httpRequest()
        .get('/docs/github/owner/repo/community.svg')
        .expect(200);
    });

    it('should status 200 but cannot get the client', async () => {
      return app.httpRequest()
        .get('/docs/github/owner2/repo2/community.svg')
        .expect(200)
        .expect('Client not found');
    });

  });
});
