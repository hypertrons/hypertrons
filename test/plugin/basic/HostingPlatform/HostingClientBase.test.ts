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
import { SlackConfig, MailConfig, DingTalkConfig } from '../../../../app/component/im/config';
import { IncomingWebhookSendArguments } from '@slack/webhook/dist/IncomingWebhook';
import * as Nodemailer from 'nodemailer';
import { DingTalkMessageType } from '../../../../app/basic/IMDataTypes';
import { HostingClientBase } from '../../../../app/basic/HostingPlatform/HostingClientBase';

describe('HostingClientBase', () => {
  let app: Application;
  let agent: Agent;

  let ciNumber = 0;
  let ciJobName = '';
  let ciPullNumber = '';
  let ciConfig: any = null;

  let imNumber = 0;
  let imMessage: any = null;
  let imConfig: any = null;

  beforeEach(async () => {
    ({ app, agent } = await prepareTestApplication());

    app.ciManager.runJenkins = (async (jobName: string, pullNum: string, config: JenkinsConfig) => {
      ciNumber++;
      ciJobName = jobName;
      ciPullNumber = pullNum;
      ciConfig = config;
    }) as any;

    app.imManager.sendToSlack = (async (message: IncomingWebhookSendArguments, config: SlackConfig) => {
      imNumber++;
      imMessage = message;
      imConfig = config;
    }) as any;

    app.imManager.sendToMail = (async (message: Nodemailer.SendMailOptions, config: MailConfig) => {
      imNumber++;
      imMessage = message;
      imConfig = config;
    }) as any;

    app.imManager.sendToDingTalk = (async (message: DingTalkMessageType, config: DingTalkConfig) => {
      imNumber++;
      imMessage = message;
      imConfig = config;
    }) as any;
  });

  afterEach(() => {
    testClear(app, agent);
  });

  describe('lua_sendToSlack', () => {
    it('should not trigger if configName or message is empty', async () => {
      imNumber = 0;
      imMessage = null;
      imConfig = null;

      const client = new GitHubClient('owner/repo', 1, app, null as any) as any;
      client.getCompConfig = (<T>(_: string): T => undefined as any) as any;
      client.lua_sendToSlack(null as any, null as any);
      assert(imNumber === 0);
    });

    it('should not trigger if compConfig is empty', async () => {
      const client = new GitHubClient('owner/repo', 1, app, null as any) as any;
      client.getCompConfig = (<T>(_: string): T => undefined as any) as any;
      client.lua_sendToSlack('test', 1);
      assert(imNumber === 0);

      client.getCompConfig = (<T>(_: string): T => {
        return {} as any;
      }) as any;
      client.lua_sendToSlack('test', {});
      assert(imNumber === 0);
    });

    it('should not trigger if enable is false', async () => {
      const client = new GitHubClient('owner/repo', 1, app, null as any) as any;
      const config = { enable: false };
      client.getCompConfig = (<T>(_: string): T => config as any) as any;
      client.lua_sendToSlack('test', {});
      assert(imNumber === 0);
    });

    it('should not trigger if configName not exist', async () => {
      const client = new GitHubClient('owner/repo', 1, app, null as any) as any;
      const config = {
        enable: true,
        slack: [],
      };
      client.getCompConfig = (<T>(_: string): T => config as any) as any;
      client.lua_sendToSlack('test', {});
      assert(imNumber === 0);
    });

    it('right case', async () => {
      const client = new GitHubClient('owner/repo', 1, app, null as any) as any;
      const config = {
        enable: true,
        slack: [{ name: 'test' }],
      };
      client.getCompConfig = (<T>(_: string): T => config as any) as any;
      client.lua_sendToSlack('test', {});
      assert(imNumber === 1);
      deepEqual(imMessage, {});
      deepEqual(imConfig, config.slack[0]);
    });
  });

  describe('lua_sendToMail', () => {
    it('should not trigger if configName or message is empty', async () => {
      imNumber = 0;
      imMessage = null;
      imConfig = null;

      const client = new GitHubClient('owner/repo', 1, app, null as any) as any;
      client.getCompConfig = (<T>(_: string): T => undefined as any) as any;
      client.lua_sendToMail(null as any, null as any);
      assert(imNumber === 0);
    });

    it('should not trigger if compConfig is empty', async () => {
      const client = new GitHubClient('owner/repo', 1, app, null as any) as any;
      client.getCompConfig = (<T>(_: string): T => undefined as any) as any;
      client.lua_sendToMail('test', {});
      assert(imNumber === 0);

      client.getCompConfig = (<T>(_: string): T => {
        return {} as any;
      }) as any;
      client.lua_sendToMail('test', {});
      assert(imNumber === 0);
    });

    it('should not trigger if enable is false', async () => {
      const client = new GitHubClient('owner/repo', 1, app, null as any) as any;
      const config = { enable: false };
      client.getCompConfig = (<T>(_: string): T => config as any) as any;
      client.lua_sendToMail('test', {});
      assert(imNumber === 0);
    });

    it('should not trigger if configName not exist', async () => {
      const client = new GitHubClient('owner/repo', 1, app, null as any) as any;
      const config = {
        enable: true,
        mail: [],
      };
      client.getCompConfig = (<T>(_: string): T => config as any) as any;
      client.lua_sendToMail('test', {});
      assert(imNumber === 0);
    });

    it('right case', async () => {
      const client = new GitHubClient('owner/repo', 1, app, null as any) as any;
      const config = {
        enable: true,
        mail: [{ name: 'test' }],
      };
      client.getCompConfig = (<T>(_: string): T => config as any) as any;
      client.lua_sendToMail('test', {});
      assert(imNumber === 1);
      deepEqual(imMessage, {});
      deepEqual(imConfig, config.mail[0]);
    });
  });

  describe('lua_sendToDingTalk', () => {
    it('should not trigger if configName or message is empty', async () => {
      imNumber = 0;
      imMessage = null;
      imConfig = null;

      const client = new GitHubClient('owner/repo', 1, app, null as any) as any;
      client.getCompConfig = (<T>(_: string): T => undefined as any) as any;
      client.lua_sendToDingTalk(null as any, null as any);
      assert(imNumber === 0);
    });

    it('should not trigger if compConfig is empty', async () => {
      const client = new GitHubClient('owner/repo', 1, app, null as any) as any;
      client.getCompConfig = (<T>(_: string): T => undefined as any) as any;
      client.lua_sendToDingTalk('test', {});
      assert(imNumber === 0);

      client.getCompConfig = (<T>(_: string): T => {
        return {} as any;
      }) as any;
      client.lua_sendToDingTalk('test', {});
      assert(imNumber === 0);
    });

    it('should not trigger if enable is false', async () => {
      const client = new GitHubClient('owner/repo', 1, app, null as any) as any;
      const config = { enable: false };
      client.getCompConfig = (<T>(_: string): T => config as any) as any;
      client.lua_sendToDingTalk('test', {});
      assert(imNumber === 0);
    });

    it('should not trigger if configName not exist', async () => {
      const client = new GitHubClient('owner/repo', 1, app, null as any) as any;
      const config = {
        enable: true,
        dingTalk: [],
      };
      client.getCompConfig = (<T>(_: string): T => config as any) as any;
      client.lua_sendToDingTalk('test', {});
      assert(imNumber === 0);
    });

    it('right case', async () => {
      const client = new GitHubClient('owner/repo', 1, app, null as any) as any;
      const config = {
        enable: true,
        dingTalk: [{ name: 'test1' }],
      };
      client.getCompConfig = (<T>(_: string): T => config as any) as any;
      client.lua_sendToDingTalk('test1', {});
      assert(imNumber === 1);
      deepEqual(imMessage, {});
      deepEqual(imConfig, config.dingTalk[0]);
    });
  });

  describe('lua_runCI', () => {
    it('should not trigger if configName or pullNumber is empty', async () => {
      const client = new GitHubClient('owner/repo', 1, app, null as any) as any;
      client.getCompConfig = (<T>(_: string): T => undefined as any) as any;
      client.lua_runCI(null as any, null as any);
      assert(ciNumber === 0);
    });

    it('should not trigger if compConfig is empty', async () => {
      const client = new GitHubClient('owner/repo', 1, app, null as any) as any;
      client.getCompConfig = (<T>(_: string): T => undefined as any) as any;
      client.lua_runCI('test', 1);
      assert(ciNumber === 0);

      client.getCompConfig = (<T>(_: string): T => {
        return {} as any;
      }) as any;
      client.lua_runCI('test', 1);
      assert(ciNumber === 0);
    });

    it('should not trigger if compConfig.enable is false', async () => {
      const client = new GitHubClient('owner/repo', 1, app, null as any) as any;
      client.getCompConfig = (<T>(_: string): T => {
        return { enable: false } as any;
      }) as any;
      client.lua_runCI('test', 1);
      assert(ciNumber === 0);
    });

    it('should not trigger if compConfig.configs is empty', async () => {
      const client = new GitHubClient('owner/repo', 1, app, null as any) as any;
      client.getCompConfig = (<T>(_: string): T => {
        return { enable: true, configs: [] } as any;
      }) as any;
      client.lua_runCI('test', 1);
      assert(ciNumber === 0);
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
      assert(ciNumber === 0);
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
      assert(ciNumber === 0);
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
      assert(ciNumber === 0);
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
      assert(ciNumber === 1 && ciJobName === 'test' && ciPullNumber === '1');
      deepEqual(ciConfig, config.configs[0]);
    });
  });

  describe('checkInterval', () => {
    it('should return true if CompConfig is empty', async () => {
      const client = new GitHubClient('owner/repo', 1, app, null as any) as any;
      client.getCompConfig = (<T>(_: string): T => undefined as any) as any;
      const res = client.checkInterval(true, 0, '/rerun');
      assert(res === true);
    });

    it('should return true if CompConfig.commands is empty', async () => {
      const client = new GitHubClient('owner/repo', 1, app, null as any) as any;
      client.getCompConfig = (<T>(_: string): T => {
        return {} as any;
      }) as any;
      let res = client.checkInterval(true, 0, '/rerun');
      assert(res === true);

      client.getCompConfig = (<T>(_: string): T => {
        return { commands: [] } as any;
      }) as any;
      res = client.checkInterval(true, 0, '/rerun');
      assert(res === true);
    });

    it('should return true if command not found in CompConfig.commands', async () => {
      const client = new GitHubClient('owner/repo', 1, app, null as any) as any;
      client.getCompConfig = (<T>(_: string): T => {
        return { commands: [{ name: '/test' }] } as any;
      }) as any;
      const res = client.checkInterval(true, 0, '/rerun');
      assert(res === true);
    });

    it('should return true if CompConfig.command.intervalMinutes is empty or <= 0', async () => {
      const client = new GitHubClient('owner/repo', 1, app, null as any) as any;
      client.getCompConfig = (<T>(_: string): T => {
        return { commands: [{ name: '/rerun' }] } as any;
      }) as any;
      let res = client.checkInterval(true, 0, '/rerun');
      assert(res === true);

      client.getCompConfig = (<T>(_: string): T => {
        return { commands: [{ name: '/rerun', intervalMinutes: 0 }] } as any;
      }) as any;
      res = client.checkInterval(true, 0, '/rerun');
      assert(res === true);

      client.getCompConfig = (<T>(_: string): T => {
        return { commands: [{ name: '/rerun', intervalMinutes: -1 }] } as any;
      }) as any;
      res = client.checkInterval(true, 0, '/rerun');
      assert(res === true);
    });

    it('should return true if lastExecTime is empty', async () => {
      const client = new GitHubClient('owner/repo', 1, app, null as any) as any;
      client.getCompConfig = (<T>(_: string): T => {
        return { commands: [{ name: '/rerun', intervalMinutes: 10 }] } as any;
      }) as any;
      const res = client.checkInterval(true, 0, '/rerun');
      assert(res === true);
    });

    it('should return false if now() - lastExecTime <= interval', async () => {
      const client = new GitHubClient('owner/repo', 1, app, null as any) as any;
      client.setCommandLastExecTime(true, 0);
      client.getCompConfig = (<T>(_: string): T => {
        return { commands: [{ name: '/rerun', intervalMinutes: 10 }] } as any;
      }) as any;
      const res = client.checkInterval(true, 0, '/rerun');
      assert(res === false);
    });

    it('should return true if now() - lastExecTime > interval', async () => {
      const client = new GitHubClient('owner/repo', 1, app, null as any) as any;
      client.commandLastExecTime.set('issue_0', 1575642832110); // 2019-12-06 22:33:52 GMT+0800 (GMT+08:00)
      client.getCompConfig = (<T>(_: string): T => {
        return { commands: [{ name: '/rerun', intervalMinutes: 10 }] } as any;
      }) as any;
      let res = client.checkInterval(true, 0, '/rerun');
      assert(res === true);

      client.commandLastExecTime.set('pull_0', 1575642832110); // 2019-12-06 22:33:52 GMT+0800 (GMT+08:00)
      client.getCompConfig = (<T>(_: string): T => {
        return { commands: [{ name: '/rerun', intervalMinutes: 10 }] } as any;
      }) as any;
      res = client.checkInterval(false, 0, '/rerun');
      assert(res === true);
    });
  });

  describe('command check', () => {
    let client: HostingClientBase<object>;

    class MockClient extends (HostingClientBase as any)<object> {
      constructor(name: string, hostId: number, app: Application) {
        super(name, hostId, app);
        this.repoData = {
          getRepoData: () => {
            return {
              pulls: [
                {
                  number: 42,
                },
              ],
              issues: [
                {
                  number: 42,
                },
              ],
            };
          },
        };
        this.config = {
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
      updateData() { }
      getCompConfig() { return this.config; }
    }

    beforeEach(async () => {
      client = new MockClient('owner/repo', 42, app) as any;
    });

    describe('checkAuth', () => {
      it('directly return false when config is undefined', async () => {
        (client as any).config = {};
        assert.strictEqual(client.checkAuth('GoodMeowing', '/666', 'author'), false);
      });

      it('return true if everyone can exec command', async () => {
        assert.strictEqual(client.checkAuth('GoodMeowing', '/666', 'author'), true);
      });

      it('return false if author exec not-author command', async () => {
        assert.strictEqual(client.checkAuth('GoodMeowing', '/approve', 'GoodMeowing'), false);
      });

      it('return true if author exec author command', async () => {
        assert.strictEqual(client.checkAuth('GoodMeowing', '/assign', 'GoodMeowing'), true);
      });

      it('check user auth', async () => {
        assert.strictEqual(client.checkAuth('GoodMeowing', '/biubiubiu', 'author'), true);
      });
    });

    describe('checkScope', () => {
      it('command has no field limit should return true', async () => {
        assert.strictEqual(client.checkScope('issue', '/madeInHeaven'), true);
      });

      it('check review-comment-only command', async () => {
        assert.strictEqual(client.checkScope('review_comment', '/approve'), true);
        assert.strictEqual(client.checkScope('comment', '/approve'), true);
        assert.strictEqual(client.checkScope('issue', '/approve'), false);
      });
    });

  });

});
