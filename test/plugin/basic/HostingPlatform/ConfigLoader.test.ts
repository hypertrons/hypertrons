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

import { Application, Agent } from 'egg';
import { ConfigLoader } from '../../../../app/basic/HostingPlatform/ConfigLoader';
import { prepareTestApplication, testClear } from '../../../Util';
import assert, { deepEqual } from 'assert';

describe('ConfigLoader', () => {
  let app: Application;
  let agent: Agent;

  class Client {
    async getFileContent(_: string): Promise<string | undefined> {
      return '{"key": "value"}';
    }
  }

  beforeEach(async () => {
    ({ app, agent } = await prepareTestApplication());
  });
  afterEach(() => {
    testClear(app, agent);
  });

  describe('loadConfig()', () => {
    it('should equal app.component.getDefaultConfig if params are empty', async () => {
      const configLoader = new ConfigLoader(app) as any;
      const result = await configLoader.loadConfig(null as any, null as any, null as any, null as any);
      deepEqual(await app.component.getDefaultConfig(), result);
    });

    it('should merge remoteConfig is remoteConfig is currect', async () => {
      const client = new Client();
      const configLoader = new ConfigLoader(app) as any;
      const result = await configLoader.loadConfig({
        config: {
          remote: {
            filePath: 'path',
          },
        },
      } as any, null as any, null as any, client as any);
      const t = await app.component.getDefaultConfig();
      t.key = 'value';
      deepEqual(t, result);
    });
  });

  describe('loadDefaultConfig()', () => {
    it('always equal app.component.getDefaultConfig', async () => {
      const configLoader = new ConfigLoader(app) as any;
      const result = await configLoader.loadDefaultConfig();
      deepEqual(await app.component.getDefaultConfig(), result);
    });
  });

  describe('loadConfigFromFile()', () => {
    it('should return { } if params are empty', async () => {
      const configLoader = new ConfigLoader(app) as any;
      const result = await configLoader.loadConfigFromFile(null as any, null as any, null as any);
      deepEqual({}, result);
    });

    it('should return { } if file not exist', async () => {
      const configLoader = new ConfigLoader(app) as any;
      const result = await configLoader.loadConfigFromFile({
        config: {
          private: {
            file: {
              rootPath: 'not_exist',
            },
          },
        },
      } as any, null as any, null as any);
      deepEqual({}, result);
    });
  });

  describe('loadConfigFromRemote()', () => {
    it('should return { } if params are empty', async () => {
      const configLoader = new ConfigLoader(app) as any;
      const result = await configLoader.loadConfigFromRemote(null as any, null as any);
      deepEqual({}, result);
    });

    it('should return { } if config.config.remote.filePath is incurrect', async () => {
      const configLoader = new ConfigLoader(app) as any;
      const result = await configLoader.loadConfigFromRemote({
        config: {
          remote: '',
        },
      } as any, null as any);
      deepEqual({}, result);
    });

    it('currect case', async () => {
      const client = new Client();
      const configLoader = new ConfigLoader(app) as any;
      const result = await configLoader.loadConfigFromRemote({
        config: {
          remote: {
            filePath: 'path',
          },
        },
      } as any, client as any);
      deepEqual({ key: 'value' }, result);
    });
  });

  describe('loadConfigFromMysql()', () => {
    it('always return { }', async () => {
      const configLoader = new ConfigLoader(app) as any;
      const result = await configLoader.loadConfigFromMysql(null as any);
      deepEqual({}, result);
    });

    it('should return { } if param is currect', async () => {
      const configLoader = new ConfigLoader(app) as any;
      const result = await configLoader.loadConfigFromMysql({ config: { private: { mysql: 'path' } } });
      deepEqual({}, result);
    });
  });

  describe('genRepoConfigFilePath()', () => {
    it('should return "" if params are empty', async () => {
      const configLoader = new ConfigLoader(app) as any;
      const result = configLoader.genRepoConfigFilePath(null as any, null as any, null as any);
      assert(result === '');
    });

    it('should return "" if fullName is incurrect', async () => {
      const configLoader = new ConfigLoader(app) as any;
      const result = configLoader.genRepoConfigFilePath('path', 'id', 'owner');
      assert(result === '');
    });

    it('currect case', async () => {
      const configLoader = new ConfigLoader(app) as any;
      const result = configLoader.genRepoConfigFilePath('path', 'id', 'owner/repo');
      assert(result === 'path/id_owner_repo.json');
    });
  });

});
