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

import { app } from 'egg-mock/bootstrap';
import { InstallationType } from '../../app/plugin/installation-manager/types';
import { Agent } from 'egg';
import { initWebhooks } from '../plugin/github/GitHubTestUtil';
import { prepareTestApplication, testClear } from '../Util';
import { MockApplication } from 'egg-mock';

describe('Component Controller', () => {

  class MockCompService {
    getLatestConfigStructure() {
      return { foo: 'bar' };
    }
    getConfigStructureByVersion(name: string, version: number) {
      return { name, version };
    }
  }
  class MockPlatform {
    compService: MockCompService;
    constructor() {
      this.compService = new MockCompService();
    }
  }

  beforeEach(async () => {
    app.installation.getInstallationInfoByName = (iName: string): { id: number, type: InstallationType } => {
      return { id: 0, type: iName as any };
    };
    app.github.getHostPlatform = (_: number): any => {
      return new MockPlatform();
    };
    app.gitlab.getHostPlatform = (_: number): any => {
      return new MockPlatform();
    };
  });

  describe('GET /component/:installationName', () => {
    it('should status 200 and get the body', () => {
      return app.httpRequest()
        .get('/component/github')
        .expect(200)
        .expect({ foo: 'bar' });
    });

    it('should status 200 and get the body', () => {
      return app.httpRequest()
        .get('/component/gitlab')
        .expect(200)
        .expect({ foo: 'bar' });
    });

    it('should status 200 and get {}', () => {
      return app.httpRequest()
        .get('/component/not_exist')
        .expect(200)
        .expect({});
    });
  });

  describe('GET /component/:installationName/:name/:version', () => {
    it('should status 200 and get the body', () => {
      return app.httpRequest()
        .get('/component/github/testRepo/1')
        .expect(200)
        .expect({ name: 'testRepo', version: '1' });
    });

    it('should status 200 and get the body', () => {
      return app.httpRequest()
        .get('/component/gitlab/testRepo/1')
        .expect(200)
        .expect({ name: 'testRepo', version: '1' });
    });

    it('should status 200 and get {}', () => {
      return app.httpRequest()
        .get('/component/not_exist/testRepo/1')
        .expect(200)
        .expect({});
    });
  });

});

describe('Real Component Controller', () => {
  let app: MockApplication;
  let agent: Agent;

  before(async () => {
    ({ app, agent } = await prepareTestApplication() as any);
    await initWebhooks(app);
  });
  after(() => {
    testClear(app, agent);
  });

  describe('GET /component/:installationName', () => {
    it('should status 200 and get the body', () => {
      return app.httpRequest()
        .get('/component/github')
        .expect(200);
    });
  });

  describe('GET /component/:installationName/:name/:version', () => {
    it('should status 200 and get the body', () => {
      return app.httpRequest()
        .get('/component/github/approve/1')
        .expect(200);
    });
  });

});
