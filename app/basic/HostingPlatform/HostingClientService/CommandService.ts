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

import CommandConfig from '../../../component/command/config';
import RoleConfig from '../../../component/role/config';
import { HostingClientBase } from '../HostingClientBase';
import { HostingConfigBase } from '../HostingConfigBase';
import { ClientServiceBase } from './ClientServiceBase';
import { Application } from 'egg';
import {
  IssueEvent, CommandManagerNewCommandEvent,
  CommentUpdateEvent, ReviewEvent, ReviewCommentEvent,
} from '../../../plugin/event-manager/events';

export class CommandService<TConfig extends HostingConfigBase, TRawClient>
                          extends ClientServiceBase<TConfig, TRawClient> {

  private commandLastExecTime: Map<string, number>;

  constructor(app: Application, client: HostingClientBase<TConfig, TRawClient>) {
    super(app, client, 'commandService');
    this.commandLastExecTime = new Map<string, number>();
  }

  public async onStart(): Promise<any> {
    this.client.eventService.subscribeOne(IssueEvent, async e => {
      this.logger.info(`Start to resolve the issue event for ${e.installationId} and repo ${e.fullName}`);
      if (!e.issue) return;
      if (e.action === 'edited' || e.action === 'opened') {
        this.logger.info(`the issue's body is ${e.issue.body}`);
        const commands = this.getCommandsFromBody(e.issue.body).filter(c => {
          if (!e.issue) return false;
          return this.checkCommand(c.exec, e.issue.author, e.issue.author, 'issue', true, e.issue.number);
        });
        commands.map(command => {
          this.logger.info(`extract the command is ${command.exec}`);
          // publish new command event
          const event = Object.assign(new CommandManagerNewCommandEvent(), {
            installationId: e.installationId,
            fullName: e.fullName,
            login: (e.issue as any).author,
            from: 'issue',
            number: (e.issue as any).number,
            issue: e.issue,
            comment: undefined,
            command,
          });
          this.client.eventService.publish('all', CommandManagerNewCommandEvent, event);
        });
      }
    });

    // handle comment event
    this.client.eventService.subscribeOne(CommentUpdateEvent, async e => {
      this.logger.info(`Start to resolve the comment event for ${e.installationId} and repo ${e.fullName}`);
      if (!e.comment) return;
      const issue = this.client.getRepoData().issues.find(issue => issue.number === e.issueNumber);
      const pull = this.client.getRepoData().pulls.find(pull => pull.number === e.issueNumber);
      if (!issue && !pull) return;
      if (e.action === 'created' || e.action === 'edited') {
        this.logger.info(`the comment's body is ${e.comment.body}`);
        const commands = this.getCommandsFromBody(e.comment.body).filter(c => {
          if (!e.comment) return false;
          if (issue) {
            return this.checkCommand(c.exec, e.comment.login, issue.author, 'comment', true, issue.number);
          } else if (pull) {
            return this.checkCommand(c.exec, e.comment.login, pull.author, 'pull_comment', false, pull.number);
          }
          return false;
        });
        commands.map(command => {
          this.logger.info(`extract the command is ${command.exec}`);
          // publish new command event
          const event = Object.assign(new CommandManagerNewCommandEvent(), {
            installationId: e.installationId,
            fullName: e.fullName,
            login: (e.comment as any).login,
            from: issue ? 'comment' : 'pull_comment',
            number: e.issueNumber,
            issue: undefined,
            comment: e.comment,
            command,
          });
          this.client.eventService.publish('all', CommandManagerNewCommandEvent, event);
        });
      }
    });

    // handle review event
    this.client.eventService.subscribeOne(ReviewEvent, async e => {
      this.logger.info(`Start to resolve the review event for ${e.installationId} and repo ${e.fullName}`);
      if (!e.review || !e.review.body) return;
      const pull = this.client.getRepoData().pulls.find(pull => pull.number === e.prNumber);
      if (!pull) return;
      if (e.action === 'submitted' || e.action === 'edited') {
        this.logger.info(`the review's body is ${e.review.body}`);
        const commands = this.getCommandsFromBody(e.review.body).filter(c => {
          if (!e.review) return false;
          return this.checkCommand(c.exec, e.review.login, pull.author, 'review', false, pull.number);
        });
        commands.map(command => {
          this.logger.info(`extract the command is ${command.exec}`);
          // publish new command event
          const event = Object.assign(new CommandManagerNewCommandEvent(), {
            installationId: e.installationId,
            fullName: e.fullName,
            login: (e.review as any).login,
            from: 'review',
            number: e.prNumber,
            issue: undefined,
            comment: e.review,
            command,
          });
          this.client.eventService.publish('all', CommandManagerNewCommandEvent, event);
        });
      }
    });

    // handle review comment event
    this.client.eventService.subscribeOne(ReviewCommentEvent, async e => {
      this.logger.info(`Start to resolve the review comment event for ${e.installationId} and repo ${e.fullName}`);
      if (!e.comment) return;
      const pull = this.client.getRepoData().pulls.find(pull => pull.number === e.prNumber);
      if (!pull) return;
      if (e.action === 'created' || e.action === 'edited') {
        this.logger.info(`the review comment's body is ${e.comment.body}`);
        const commands = this.getCommandsFromBody(e.comment.body).filter(c => {
          if (!e.comment) return false;
          return this.checkCommand(c.exec, e.comment.login, pull.author, 'review_comment', false, pull.number);
        });
        commands.map(command => {
          this.logger.info(`extract the command is ${command.exec}`);
          // publish new command event
          const event = Object.assign(new CommandManagerNewCommandEvent(), {
            installationId: e.installationId,
            fullName: e.fullName,
            login: (e.comment as any).login,
            from: 'review_comment',
            number: e.prNumber,
            issue: undefined,
            comment: e.comment,
            command,
          });
          this.client.eventService.publish('all', CommandManagerNewCommandEvent, event);
        });
      }
    });
  }

  public async onDispose(): Promise<any> { }

  public async onConfigLoaded(): Promise<any> { }

  public async syncData(): Promise<any> { }

  public checkCommand(command: string,
                      login: string, author: string,
                      from: 'issue' | 'comment' | 'pull_comment' | 'review' | 'review_comment',
                      isIssue: boolean, issueNumber: number): boolean {
    return this.checkAuth(login, command, author) &&
      this.checkScope(from, command) &&
      this.checkInterval(isIssue, issueNumber, command);
  }

  public checkAuth(login: string, command: string, author: string): boolean {
    // config check
    const roleConfig: RoleConfig | undefined = this.client.getCompConfig<RoleConfig>('role');
    if (!roleConfig || !roleConfig.roles) return false;
    // 1. Can anyone use the command?
    const anyoneAuth = roleConfig.roles.find(role => role.name === 'anyone');
    if (anyoneAuth && anyoneAuth.commands.includes(command)) return true;
    // 2. Can author use the command?
    if (login === author) {
      const notAuthorAuth = roleConfig.roles.find(role => role.name === 'notauthor');
      const authorAuth = roleConfig.roles.find(role => role.name === 'author');
      if (notAuthorAuth && notAuthorAuth.commands.includes(command)) {
        // The command must be exec with not author role
        return false;
      }
      if (authorAuth && authorAuth.commands.includes(command)) {
        // The command is allowed to be exec by author
        return true;
      }
    }
    // 3. Can user use the command?
    return roleConfig.roles.find(r =>
      r.users && r.users.includes(login) && r.commands && r.commands.includes(command)) !== undefined;
  }

  // Judge whether command can be exec in the current number issue/pr.
  public checkScope(from: 'issue' | 'comment' | 'pull_comment' | 'review' | 'review_comment',
                    command: string): boolean {
    // config check
    const commandConfig: CommandConfig | undefined = this.client.getCompConfig<CommandConfig>('command');
    if (!commandConfig || !commandConfig.commands) return true;

    const commandScope = commandConfig.commands.find(c => c.name === command);
    if (commandScope) return commandScope.scopes.includes(from);
    return true;
  }

  public checkInterval(isIssue: boolean, issueNumber: number, command: string): boolean {
    const commandConfigs: CommandConfig | undefined = this.client.getCompConfig<CommandConfig>('command');
    if (!commandConfigs || !commandConfigs.commands) return true;

    const config = commandConfigs.commands.find(c => c.name === command);
    if (!config || !config.intervalMinutes || config.intervalMinutes <= 0) return true;

    const lastExecTime = this.getCommandLastExecTime(isIssue, issueNumber);
    if (lastExecTime === undefined || new Date().getTime() - lastExecTime > config.intervalMinutes * 60 * 1000) {
      this.setCommandLastExecTime(isIssue, issueNumber);
      return true;
    }
    return false;
  }

  private setCommandLastExecTime(isIssue: boolean, issueNumber: number) {
    if (isIssue) {
      this.commandLastExecTime.set('issue_' + issueNumber, new Date().getTime());
    } else {
      this.commandLastExecTime.set('pull_' + issueNumber, new Date().getTime());
    }
  }

  private getCommandLastExecTime(isIssue: boolean, issueNumber: number): number | undefined {
    if (isIssue) return this.commandLastExecTime.get('issue_' + issueNumber);
    return this.commandLastExecTime.get('pull_' + issueNumber);
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

export interface Command {
  // executed command
  exec: string;
  // cammand parameters
  param: string[];
}
