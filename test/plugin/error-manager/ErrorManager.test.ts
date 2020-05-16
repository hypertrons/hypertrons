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

// tslint:disable: no-bitwise
'use strict';

import { prepareTestApplication, testClear } from '../../Util';
import { Application, Agent } from 'egg';
import assert from 'power-assert';
import { deepEqual } from 'assert';

describe('ErrorManager', () => {
  let app: Application;
  let agent: Agent;
  let message: any[];
  let config: any[];
  let callSendToSlack = 0;

  beforeEach(async () => {
    ({ app, agent } = await prepareTestApplication());
  });
  afterEach(() => {
    testClear(app, agent);
  });

  describe('sendToSlack', () => {

    beforeEach(async () => {
      message = [];
      config = [];
      callSendToSlack = 0;
    });

    it('should not trigger sendToSlackConfig is config is empty', async () => {
      app.imManager.sendToSlack = async (m: any, c: any) => {
        message = m;
        config = c;
        callSendToSlack++;
      };
      await app.errorManager.handleError('test', new Error('test error'));
      assert(message.length === 0);
      assert(config.length === 0);
      assert(callSendToSlack === 0);
    });

    it('only call 1 time if slack config array length === 1', async () => {
      (app.errorManager as any).config = {
        slack: [
          {
            webhook: 'https://randomurl.random',
          },
        ],
      };
      app.imManager.sendToSlack = async (m: any, c: any) => {
        message.push(m);
        config.push(c);
        callSendToSlack++;
      };
      await app.errorManager.handleError('test', new Error('test error'));
      assert(message.length === 1 && config.length === 1);
      assert(message[0].blocks.length !== 0);
      deepEqual(config, [{ webhook: 'https://randomurl.random' }]);
      assert(callSendToSlack === 1);
    });

    it('only call 3 times if slack config array length === 3', async () => {
      (app.errorManager as any).config = {
        slack: [
          {
            webhook: 'https://randomurl1.random',
          },
          {
            webhook: 'https://randomurl2.random',
          },
          {
            webhook: 'https://randomurl3.random',
          },
        ],
      };
      app.imManager.sendToSlack = async (m: any, c: any) => {
        message.push(m);
        config.push(c);
        callSendToSlack++;
      };
      await app.errorManager.handleError('test', new Error('test error'));
      assert(message.length === 3 && config.length === 3);
      assert(message[0].blocks.length !== 0);
      deepEqual(config, [
        { webhook: 'https://randomurl1.random' },
        { webhook: 'https://randomurl2.random' },
        { webhook: 'https://randomurl3.random' }]);
      assert(callSendToSlack === 3);
    });
  });

});
