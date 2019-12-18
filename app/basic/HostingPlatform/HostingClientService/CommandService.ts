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

import CommandConfig from '../../../component/command/config';
import RoleConfig from '../../../component/role/config';
import { HostingClientBase } from '../HostingClientBase';
import { HostingConfigBase } from '../HostingConfigBase';

export class CommandService <TConfig extends HostingConfigBase, TRawClient> {

  private commandLastExecTime: Map<string, number>;
  private client: HostingClientBase<TConfig, TRawClient>;

  constructor(client: HostingClientBase<TConfig, TRawClient>) {
    this.client = client;
    this.commandLastExecTime = new Map<string, number>();
  }

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
  public checkScope(from: 'issue' | 'comment' | 'pull_comment' | 'review' | 'review_comment', command: string): boolean {
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
}
