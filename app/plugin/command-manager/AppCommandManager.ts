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

import { AppPluginBase } from '../../basic/AppPluginBase';
import { CommentUpdateEvent, CommandManagerNewCommandEvent, IssueEvent } from '../event-manager/events';
import { Command } from './Command';

export class AppCommandManager extends AppPluginBase<null> {

  public async onReady() {
    // handle issue event
    this.app.event.subscribeOne(IssueEvent, async e => {
      this.logger.info(`Start to resolve the issue event for ${e.installationId} and repo ${e.fullName}`);
      if (!e.issue || !e.client) return;
      if (e.action === 'edited' || e.action === 'opened') {
        this.logger.info(`the issue's body is ${e.issue.body}`);
        const commands = this.getCommandsFromBody(e.issue.body).filter(c => {
          if (!e.client || !e.issue) return false;
          return e.client.checkAuth(e.issue.author, c.exec);
        });
        commands.map(command => {
          this.logger.info(`extract the command is ${command}`);
          // publish new command event
          this.app.event.publish('all', CommandManagerNewCommandEvent, Object.assign(new CommandManagerNewCommandEvent(), {
            installationId: e.installationId,
            fullName: e.fullName,
            login: (e.issue as any).author,
            from: 'issue',
            issueNumber: (e.issue as any).number,
            issue: e.issue,
            comment: undefined,
            command,
          }));
        });
      }
    });
    // handle comment event
    this.app.event.subscribeOne(CommentUpdateEvent, async e => {
      this.logger.info(`Start to resolve the comment event for ${e.installationId} and repo ${e.fullName}`);
      if (!e.client || !e.comment) return;
      if (e.action === 'created' || e.action === 'edited') {
        this.logger.info(`the comment's body is ${e.comment.body}`);
        const commands = this.getCommandsFromBody(e.comment.body).filter(c => {
          if (!e.client || !e.comment) return false;
          return e.client.checkAuth(e.comment.login, c.exec);
        });
        commands.map(command => {
          this.logger.info(`extract the command is ${command}`);
          // publish new command event
          this.app.event.publish('all', CommandManagerNewCommandEvent, Object.assign(new CommandManagerNewCommandEvent(), {
            installationId: e.installationId,
            fullName: e.fullName,
            login: (e.comment as any).login,
            from: 'comment',
            issueNumber: e.issueNumber,
            issue: undefined,
            comment: e.comment,
            command,
          }));
        });
      }
    });
  }

  public async onStart() {
  }

  public async onClose() {
  }

  /**
   * extract command statement
   * the rule is begin with /[A-Z] or begin with /[a-z] && end with \n
   */
  private extract(line: string): Command | null {
    const regExp = /\/{1}[A-Z|a-z].*/g;
    const arr = line.split(/\s+/);
    let command: Command | null;
    command = null;
    if (arr[0].match(regExp)) {
      const params: string[] = [];
      for (let i = 1; i < arr.length; i++) {
        params.push(arr[i]);
      }
      command = { exec: arr[0], param: params };
    }
    return command;
  }

  /* get commands from comment body */
  private getCommandsFromBody(body: string): Command[] {
    // in case the system is windows
    const lines = body.split(/\r?\n/);
    const commands: Command[] = [];
    lines.map(line => {
      const command = this.extract(line);
      if (command != null) {
        commands.push(command);
      }
    });
    return commands;
  }

}
