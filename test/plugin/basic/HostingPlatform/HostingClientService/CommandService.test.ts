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

import assert from 'assert';
import { prepareTestApplication, testClear } from '../../../../Util';
import { Application, Agent } from 'egg';
import { Repo } from '../../../../../app/basic/DataTypes';
import { CommandService } from '../../../../../app/basic/HostingPlatform/HostingClientService/CommandService';

describe('CommandService', () => {
  let app: Application;
  let agent: Agent;
  let commandService: CommandService<any, any>;

  // class MockEvent {
  //   // receive param
  //   commandEvent = [] as any;
  //   // generic param
  //   commands = [] as any;
  //   issues = [] as any;
  //   pulls = [] as any;
  //   action = '' as any;
  //   installationId: number = 42;
  //   fullName: string = 'testEvent';
  //   // unique param
  //   issue = {
  //     author: 'testAuthor',
  //     number: 1,
  //   } as any;
  //   comment = {
  //     login: 'testAuthor',
  //   } as any;
  //   review = {
  //     body: 'body',
  //     login: 'testAuthor',
  //   } as any;
  //   issueNumber = 1;
  //   prNumber = 1;
  //   changes: {};
  //   client = {
  //     checkCommand: () => true,
  //     checkAuth: () => true,
  //     checkScope: () => true,
  //     checkInterval: () => true,
  //     getRepoData: () => ({
  //       issues: this.issues,
  //       pulls: this.pulls,
  //     }),
  //   } as any;

  //   constructor() {
  //     app.installation.getClient = () => this.client;
  //     app.event.subscribeOne(CommandManagerNewCommandEvent, async p => this.commandEvent.push(p));
  //     (app.command as any).getCommandsFromBody = () => this.commands;
  //   }

  //   toLuaEvent(): any { }
  // }

  class MockHostingBase {
    getName(): string {
      return 'name';
    }
    getConfig(): any {
      return {};
    }
  }

  class MockClient {
    getRepoData(): Repo {
      return {
        pulls: [{ number: 42 }],
        issues: [{ number: 42 }],
      } as any;
    }
    getHostingBase(): any {
      return new MockHostingBase();
    }
    getFullName(): string {
      return 'owner/repo';
    }
    getCompConfig() {
      return {
        roles: [
          {
            name: 'owner',
            description: 'Owner',
            users: [ 'GoodMeowing' ],
            commands: [ '/biubiubiu' ],
          },
          {
            name: 'anyone',
            description: 'Anyone',
            commands: [ '/666' ],
          },
          {
            name: 'author',
            description: 'Author',
            commands: [ '/assign' ],
          },
          {
            name: 'notauthor',
            description: 'NotAuthor',
            commands: [ '/approve' ],
          },
        ],
        commands: [
          {
            name: '/approve',
            scopes: [ 'review_comment', 'comment' ],
          },
        ],
      };
    }
  }

  // beforeEach(async () => {
  //   ({ app, agent } = await prepareTestApplication());
  //   client = new GitHubClient('wsl/test', 0, app, null as any, new MockHostingBase() as any);
  //   await waitUntil(() => client.getStarted(), { interval: 10 });
  // });
  // afterEach(() => {
  //   testClear(app, agent);
  // });

  // describe('onReady()', () => {
  //   it('analyse issue', async () => {
  //     const e = new MockEvent();
  //     e.action = 'opened';
  //     e.commands = [
  //       { exec: '/assign', param: [ 'me' ] },
  //     ];
  //     agent.event.publish('worker', IssueEvent, e);
  //     await waitFor(5);
  //     assert.equal(e.commandEvent[0].from, 'issue');
  //     assert.equal(e.commandEvent[0].comment, undefined);
  //     assert.deepEqual(e.commandEvent[0].command, { exec: '/assign', param: [ 'me' ] });

  //     client.eventService.consume('IssueEvent', 'worker', {

  //     });
  //   });

  //   it('analyse comment', async () => {
  //     const e = new MockEvent();
  //     e.action = 'edited';
  //     e.commands = [
  //       { exec: '/assign', param: [ 'me' ] },
  //     ];
  //     e.issues = [
  //       { number: 1, author: 'hi' },
  //     ];
  //     agent.event.publish('worker', CommentUpdateEvent, e);
  //     await waitFor(5);
  //     assert.equal(e.commandEvent[0].from, 'comment');
  //     assert.equal(e.commandEvent[0].issue, undefined);
  //     assert.deepEqual(e.commandEvent[0].command, { exec: '/assign', param: [ 'me' ] });
  //   });

  //   it('analyse review', async () => {
  //     const e = new MockEvent();
  //     e.action = 'edited';
  //     e.commands = [
  //       { exec: '/assign', param: [ 'me' ] },
  //     ];
  //     e.pulls = [
  //       { number: 1, author: 'hi' },
  //     ];
  //     agent.event.publish('worker', ReviewEvent, e);
  //     await waitFor(5);
  //     assert.equal(e.commandEvent[0].from, 'review');
  //     assert.equal(e.commandEvent[0].issue, undefined);
  //     assert.deepEqual(e.commandEvent[0].command, { exec: '/assign', param: [ 'me' ] });
  //   });

  //   it('analyse review comment', async () => {
  //     const e = new MockEvent();
  //     e.action = 'edited';
  //     e.commands = [
  //       { exec: '/assign', param: [ 'me' ] },
  //     ];
  //     e.pulls = [
  //       { number: 1, author: 'hi' },
  //     ];
  //     agent.event.publish('worker', ReviewCommentEvent, e);
  //     await waitFor(5);
  //     assert.equal(e.commandEvent[0].from, 'review_comment');
  //     assert.equal(e.commandEvent[0].issue, undefined);
  //     assert.deepEqual(e.commandEvent[0].command, { exec: '/assign', param: [ 'me' ] });
  //   });

  // });

  describe('Life cicle functions', () => {
    before(async () => {
      ({ app, agent } = await prepareTestApplication());
      commandService = new CommandService(app, new MockClient() as any);
    });
    after(() => {
      testClear(app, agent);
      commandService = null as any;
    });

    it('onDispose() right case', async () => {
      await commandService.onDispose();
    });

    it('onConfigLoaded() right case', async () => {
      await commandService.onConfigLoaded();
    });

    it('syncData() right case', async () => {
      await commandService.syncData();
    });
  });

  describe('extract()', () => {
    before(async () => {
      ({ app, agent } = await prepareTestApplication());
      commandService = new CommandService(app, new MockClient() as any);
    });
    after(() => {
      testClear(app, agent);
      commandService = null as any;
    });

    it('should be able to analyse empty string', async () => {
      const result = (commandService as any).extract('');
      assert(result === null);
    });

    it('should remove multiple space', async () => {
      const result = (commandService as any).extract('/assign   me');
      assert.deepEqual(result, { exec: '/assign', param: [ 'me' ] });
    });

    it('should accept multiple params', async () => {
      const result = (commandService as any).extract('/assign to me');
      assert.deepEqual(result, { exec: '/assign', param: [ 'to', 'me' ] });
    });
  });

  describe('getCommandsFromBody()', () => {
    before(async () => {
      ({ app, agent } = await prepareTestApplication());
      commandService = new CommandService(app, new MockClient() as any);
    });
    after(() => {
      testClear(app, agent);
      commandService = null as any;
    });

    it('should be able to analyse empty string', async () => {
      const result = (commandService as any).getCommandsFromBody('');
      assert.deepEqual(result, []);
    });

    it('should recognize unix line break', async () => {
      const result = (commandService as any).getCommandsFromBody('/assign me\n/close issue');
      assert.deepEqual(result, [
        { exec: '/assign', param: [ 'me' ] },
        { exec: '/close', param: [ 'issue' ] },
      ]);
    });

    it('should recognize windows line break', async () => {
      const result = (commandService as any).getCommandsFromBody('/assign me\r\n/close issue');
      assert.deepEqual(result, [
        { exec: '/assign', param: [ 'me' ] },
        { exec: '/close', param: [ 'issue' ] },
      ]);
    });
  });

  describe('checkInterval()', () => {
    before(async () => {
      ({ app, agent } = await prepareTestApplication());
      commandService = new CommandService(app, new MockClient() as any);
    });
    after(() => {
      testClear(app, agent);
      commandService = null as any;
    });

    it('should return true if CompConfig is empty', async () => {
      (commandService as any).client.getCompConfig = (<T>(_: string): T => undefined as any) as any;
      assert(commandService.checkInterval(true, 0, '/rerun') === true);
    });

    it('should return true if CompConfig.commands is empty', async () => {
      (commandService as any).client.getCompConfig = (<T>(_: string): T => {
        return {} as any;
      }) as any;
      assert(commandService.checkInterval(true, 0, '/rerun') === true);

      (commandService as any).client.getCompConfig = (<T>(_: string): T => {
        return { commands: [] } as any;
      }) as any;
      assert(commandService.checkInterval(true, 0, '/rerun') === true);
    });

    it('should return true if command not found in CompConfig.commands', async () => {
      (commandService as any).client.getCompConfig = (<T>(_: string): T => {
        return { commands: [{ name: '/test' }] } as any;
      }) as any;
      assert(commandService.checkInterval(true, 0, '/rerun') === true);
    });

    it('should return true if CompConfig.command.intervalMinutes is empty or <= 0', async () => {
      (commandService as any).client.getCompConfig = (<T>(_: string): T => {
        return { commands: [{ name: '/rerun' }] } as any;
      }) as any;
      assert(commandService.checkInterval(true, 0, '/rerun') === true);

      (commandService as any).client.getCompConfig = (<T>(_: string): T => {
        return { commands: [{ name: '/rerun', intervalMinutes: 0 }] } as any;
      }) as any;
      assert(commandService.checkInterval(true, 0, '/rerun') === true);

      (commandService as any).client.getCompConfig = (<T>(_: string): T => {
        return { commands: [{ name: '/rerun', intervalMinutes: -1 }] } as any;
      }) as any;
      assert(commandService.checkInterval(true, 0, '/rerun') === true);
    });

    it('should return true if lastExecTime is empty', async () => {
      (commandService as any).client.getCompConfig = (<T>(_: string): T => {
        return { commands: [{ name: '/rerun', intervalMinutes: 10 }] } as any;
      }) as any;
      assert(commandService.checkInterval(true, 0, '/rerun') === true);
    });

    it('should return false if now() - lastExecTime <= interval', async () => {
      (commandService as any).setCommandLastExecTime(true, 0);
      (commandService as any).client.getCompConfig = (<T>(_: string): T => {
        return { commands: [{ name: '/rerun', intervalMinutes: 10 }] } as any;
      }) as any;
      assert(commandService.checkInterval(true, 0, '/rerun') === false);
    });

    it('should return true if now() - lastExecTime > interval', async () => {
      // 2019-12-06 22:33:52 GMT+0800 (GMT+08:00)
      (commandService as any).commandLastExecTime.set('issue_0', 1575642832110);
      (commandService as any).client.getCompConfig = (<T>(_: string): T => {
        return { commands: [{ name: '/rerun', intervalMinutes: 10 }] } as any;
      }) as any;
      assert(commandService.checkInterval(true, 0, '/rerun') === true);

      // 2019-12-06 22:33:52 GMT+0800 (GMT+08:00)
      (commandService as any).commandLastExecTime.set('pull_0', 1575642832110);
      // (commandService as any).client.getCompConfig = (<T>(_: string): T => {
      //   return { commands: [{ name: '/rerun', intervalMinutes: 10 }] } as any;
      // }) as any;
      assert(commandService.checkInterval(false, 0, '/rerun') === true);
    });
  });

  describe('command check', () => {
    before(async () => {
      ({ app, agent } = await prepareTestApplication());
      commandService = new CommandService(app, new MockClient() as any);
    });
    after(() => {
      testClear(app, agent);
      commandService = null as any;
    });

    describe('checkAuth', () => {
      it('directly return false when config is undefined', async () => {
        const tempCommandService = new CommandService(app, new MockClient() as any);
        (tempCommandService as any).client.getCompConfig = () => {};
        assert.strictEqual(tempCommandService.checkAuth('GoodMeowing', '/666', 'author'), false);
      });

      it('return true if everyone can exec command', async () => {
        assert.strictEqual(commandService.checkAuth('GoodMeowing', '/666', 'author'), true);
      });

      it('return false if author exec not-author command', async () => {
        assert.strictEqual(commandService.checkAuth('GoodMeowing', '/approve', 'GoodMeowing'), false);
      });

      it('return true if author exec author command', async () => {
        assert.strictEqual(commandService.checkAuth('GoodMeowing', '/assign', 'GoodMeowing'), true);
      });

      it('check user auth', async () => {
        assert.strictEqual(commandService.checkAuth('GoodMeowing', '/biubiubiu', 'author'), true);
      });
    });

    describe('checkScope', () => {
      it('command has no field limit should return true', async () => {
        assert.strictEqual(commandService.checkScope('issue', '/madeInHeaven'), true);
      });

      it('check review-comment-only command', async () => {
        assert.strictEqual(commandService.checkScope('review_comment', '/approve'), true);
        assert.strictEqual(commandService.checkScope('comment', '/approve'), true);
        assert.strictEqual(commandService.checkScope('issue', '/approve'), false);
      });
    });

  });

});
