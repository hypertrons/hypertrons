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

import assert, { deepEqual } from 'assert';
import { prepareTestApplication, testClear } from '../../../Util';
import { Application, Agent } from 'egg';
import { CIPlatform } from '../../../../app/basic/DataTypes';
import { JenkinsConfig } from '../../../../app/component/ci/config';
import { GitHubClient } from '../../../../app/plugin/github/GitHubClient';

describe('HostingClientBase', () => {
  let app: Application;
  let agent: Agent;

  let mockNum = 0;
  let mockJobName = '';
  let mockPullNumber = '';
  let mockConfig: any = null;

  beforeEach(async () => {
    ({ app, agent } = await prepareTestApplication());

    app.ciManager.runJenkins = (async (jobName: string, pullNum: string, config: JenkinsConfig) => {
      mockNum++;
      mockJobName = jobName;
      mockPullNumber = pullNum;
      mockConfig = config;
    }) as any;
  });

  afterEach(() => {
    testClear(app, agent);
  });

  describe('lua_runCI', () => {

    it('should not trigger if configName or pullNumber is empty', async () => {
      const client = new GitHubClient('owner/repo', 1, app, null as any) as any;
      client.getCompConfig = (<T>(_: string): T => undefined as any) as any;
      client.lua_runCI(null as any, null as any);
      assert(mockNum === 0);
    });

    it('should not trigger if compConfig is empty', async () => {
      const client = new GitHubClient('owner/repo', 1, app, null as any) as any;
      client.getCompConfig = (<T>(_: string): T => undefined as any) as any;
      client.lua_runCI('test', 1);
      assert(mockNum === 0);

      client.getCompConfig = (<T>(_: string): T => {
        return {} as any;
      }) as any;
      client.lua_runCI('test', 1);
      assert(mockNum === 0);
    });

    it('should not trigger if compConfig.enable is false', async () => {
      const client = new GitHubClient('owner/repo', 1, app, null as any) as any;
      client.getCompConfig = (<T>(_: string): T => {
        return { enable: false } as any;
      }) as any;
      client.lua_runCI('test', 1);
      assert(mockNum === 0);
    });

    it('should not trigger if compConfig.configs is empty', async () => {
      const client = new GitHubClient('owner/repo', 1, app, null as any) as any;
      client.getCompConfig = (<T>(_: string): T => {
        return { enable: true, configs: [] } as any;
      }) as any;
      client.lua_runCI('test', 1);
      assert(mockNum === 0);
    });

    it('should not trigger if configName is not in compConfig.configs', async () => {
      const client = new GitHubClient('owner/repo', 1, app, null as any) as any;
      client.getCompConfig = (<T>(_: string): T => {
        return {
          enable: true,
          configs: [
            {
              name: 'jenkins1',
              platform: CIPlatform.Jenkins,
              endpoint: '',
              user: '',
              token: '',
              repoToJobMap: [],
            },
          ],
        } as any;
      }) as any;
      client.lua_runCI('test', 1);
      assert(mockNum === 0);
    });

    it('should not trigger if fullName.repo is not in compConfig.configs.repoToJobMap', async () => {
      const client = new GitHubClient('owner/repo', 1, app, null as any) as any;
      client.getCompConfig = (<T>(_: string): T => {
        return {
          enable: true,
          configs: [
            {
              name: 'jenkins1',
              platform: CIPlatform.Jenkins,
              endpoint: '',
              user: '',
              token: '',
              repoToJobMap: [{ repo: 'test', job: 'test' }],
            },
          ],
        } as any;
      }) as any;
      client.lua_runCI('jenkins1', 1);
      assert(mockNum === 0);
    });

    it('should not trigger if platform not exist', async () => {
      const client = new GitHubClient('owner/repo', 1, app, null as any) as any;
      client.getCompConfig = (<T>(_: string): T => {
        return {
          enable: true, configs: [
            {
              name: 'jenkins1',
              platform: 'not exist',
              endpoint: '',
              user: '',
              token: '',
              repoToJobMap: [{ repo: 'owner/repo', job: 'test' }],
            },
          ],
        } as any;
      }) as any;
      client.lua_runCI('jenkins1', 1);
      assert(mockNum === 0);
    });

    it('right case', async () => {
      const client = new GitHubClient('owner/repo', 1, app, null as any) as any;
      const config = {
        enable: true,
        configs: [
          {
            name: 'jenkins1',
            platform: CIPlatform.Jenkins,
            endpoint: '',
            user: '',
            token: '',
            repoToJobMap: [{ repo: 'owner/repo', job: 'test' }],
          },
        ],
      } as any;
      client.getCompConfig = (<T>(_: string): T => config) as any;
      client.lua_runCI('jenkins1', 1);
      assert(mockNum === 1 && mockJobName === 'test' && mockPullNumber === '1');
      deepEqual(mockConfig, config.configs[0]);
    });
  });

});
