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

describe('IMManager', () => {
  let app: Application;
  let agent: Agent;

  beforeEach(async () => {
    ({ app, agent } = await prepareTestApplication());
  });
  afterEach(() => {
    testClear(app, agent);
  });

  describe('sendToSlack', () => {
    it('should not trigger send if slackConfig is undefined or null', async() => {
      await app.imManager.sendToSlack({ } as any, undefined as any);
      await app.imManager.sendToSlack({ } as any, null as any);
    });

    it('should not trigger send if slackConfig.webhook is undefined or null', async () => {
      await app.imManager.sendToSlack({ } as any, { } as any);
      await app.imManager.sendToSlack({ } as any, { name: '', webhook: null } as any);
      await app.imManager.sendToSlack({ } as any, { name: '', webhook: undefined } as any);
      await app.imManager.sendToSlack({ } as any, { name: '', webhook: '' } as any);
    });

    it('should be error if slackConfig.webhook is incorrect', async () => {
      await app.imManager.sendToSlack({ } as any, { name: '', webhook: '123' });
    });
  });

  describe('sendToDingTalk', () => {
    it('should not trigger send if dingTalkConfig is undefined or null', async () => {
      await app.imManager.sendToDingTalk({ } as any, undefined as any);
      await app.imManager.sendToDingTalk({ } as any, null as any);
    });

    it('should not trigger send if dingTalkConfig.webhook is undefined or null', async () => {
      await app.imManager.sendToDingTalk({ } as any, { } as any);
      await app.imManager.sendToDingTalk({ } as any, { webhook: null } as any);
      await app.imManager.sendToDingTalk({ } as any, { webhook: undefined } as any);
      await app.imManager.sendToDingTalk({ } as any, { webhook: '' } as any);
    });

    it('should be error if dingTalkConfig.webhook is incorrect', async () => {
      await app.imManager.sendToDingTalk({ } as any, { webhook: '123' } as any);
    });
  });

  describe('sendToMail', () => {
    it('should not trigger send if mailConfig is incorrect', async () => {
      await app.imManager.sendToMail({ } as any, undefined as any);
      await app.imManager.sendToMail({ } as any, null as any);
      await app.imManager.sendToMail({ } as any, { } as any);
      await app.imManager.sendToMail({ } as any, { connectOptions: {} } as any);
    });
  });

});
