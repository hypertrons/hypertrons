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
import { CommandManagerNewCommandEvent, IssueEvent, CommentUpdateEvent } from '../../../app/plugin/event-manager/events';

describe('AppCommandManager', () => {
  let app: Application;
  let agent: Agent;

  class MockEvent {
    // receive param
    commandEvent = [] as any;
    // generic param
    commands = [] as any;
    action = '' as any;
    installationId: number = 42;
    fullName: string = 'testEvent';
    // unique param
    issue = {
      author: 'testAuthor',
      number: 1,
    } as any;
    comment = {
      login: 'testAuthor',
    } as any;
    issueNumber = 1;
    changes: {};

    constructor() {
      app.event.subscribeOne(CommandManagerNewCommandEvent, async p => this.commandEvent.push(p));
      (app.command as any).getCommandsFromBody = () => this.commands;
    }

    setCommands(commands) {
      this.commands = commands;
    }
    setAction(action) {
      this.action = action;
    }
  }

  beforeEach(async () => {
    ({ app, agent } = await prepareTestApplication());
  });
  afterEach(() => {
    testClear(app, agent);
  });

  describe('extract()', () => {
    it('should be able to analyse empty string', async () => {
      const result = (app.command as any).extract('');
      assert(result === null);
    });

    it('should remove multiple space', async () => {
      const result = (app.command as any).extract('/assign   me');
      assert.deepEqual(result, { exec: '/assign', param: [ 'me' ] });
    });

    it('should accept multiple params', async () => {
      const result = (app.command as any).extract('/assign to me');
      assert.deepEqual(result, { exec: '/assign', param: [ 'to', 'me' ] });
    });
  });

  describe('getCommandsFromBody()', () => {
    it('should be able to analyse empty string', async () => {
      const result = (app.command as any).getCommandsFromBody('');
      assert.deepEqual(result, []);
    });

    it('should recognize unix line break', async () => {
      const result = (app.command as any).getCommandsFromBody('/assign me\n/close issue');
      assert.deepEqual(result, [
        { exec: '/assign', param: [ 'me' ] },
        { exec: '/close', param: [ 'issue' ] },
      ]);
    });

    it('should recognize windows line break', async () => {
      const result = (app.command as any).getCommandsFromBody('/assign me\r\n/close issue');
      assert.deepEqual(result, [
        { exec: '/assign', param: [ 'me' ] },
        { exec: '/close', param: [ 'issue' ] },
      ]);
    });
  });

  describe('onReady()', () => {
    it('analyse issue', async () => {
      const e = new MockEvent();
      e.setAction('opened');
      e.setCommands([
        { exec: '/assign', param: [ 'me' ] },
      ]);
      agent.event.publish('worker', IssueEvent, e);
      await waitFor(5);
      assert.equal(e.commandEvent[0].from, 'issue');
      assert.equal(e.commandEvent[0].comment, undefined);
      assert.deepEqual(e.commandEvent[0].command, { exec: '/assign', param: [ 'me' ] });
    });

    it('analyse comment', async () => {
      const e = new MockEvent();
      e.setAction('edited');
      e.setCommands([
        { exec: '/assign', param: [ 'me' ] },
      ]);
      agent.event.publish('worker', CommentUpdateEvent, e);
      await waitFor(5);
      assert.equal(e.commandEvent[0].from, 'comment');
      assert.equal(e.commandEvent[0].issue, undefined);
      assert.deepEqual(e.commandEvent[0].command, { exec: '/assign', param: [ 'me' ] });
    });

  });

});
