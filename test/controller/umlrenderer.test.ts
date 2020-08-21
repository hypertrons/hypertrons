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
import { genPlantUmlUrl } from '../../scripts/Utils';

describe('Umlrenderer Controller', () => {
  let app: MockApplication;
  let agent: Agent;

  before(async () => {
    ({ app, agent } = await prepareTestApplication() as any);
    await initWebhooks(app);
  });
  after(() => {
    testClear(app, agent);
  });

  describe('GET /umlrenderer/:installationName/:owner/:repo', () => {
    it('should status 302 and redirect', async () => {
      const client = await app.github.getClient(0, 'owner/repo');
      const fileContent = await (client as any).getFileContent('path');
      const plantUmlUrl = genPlantUmlUrl(fileContent.content);
      return app.httpRequest()
        .get('/umlrenderer/github/owner/repo?path=path')
        .expect(302)
        .expect(`Redirecting to <a href="${plantUmlUrl}">${plantUmlUrl}</a>.`);
    });

    it('should status 200 but cannot get the client', async () => {
      return app.httpRequest()
        .get('/umlrenderer/github/owner2/repo2?path=path')
        .expect(200)
        .expect('Client not found');
    });

  });
});
