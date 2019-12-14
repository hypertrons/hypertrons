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

import { BotLogger, loggerWrapper } from '../Utils';
import { Application } from 'egg';
import { IClient } from '../../plugin/installation-manager/IClient';
import { CheckRun, CIPlatform, Repo } from '../DataTypes';
import CIConfig from '../../component/ci/config';
import RoleConfig from '../../component/role/config';
import CommandConfig from '../../component/command/config';
import { RepoData } from './RepoData';
import { LuaClient } from './LuaClient';
import { HostingBase } from './HostingBase';
import { HostingConfigBase } from './HostingConfigBase';

export abstract class HostingClientBase<TConfig extends HostingConfigBase, TRawClient> implements IClient {

  public hostId: number;
  public rawClient: TRawClient;
  public name: string; // fullName
  private app: Application;
  protected logger: BotLogger;
  public config: any;
  public repoData: RepoData;
  protected commandLastExecTime: Map<string, number>;
  private luaClient: LuaClient<TConfig, TRawClient>;
  public base: HostingBase<
    TConfig,
    HostingClientBase<TConfig, TRawClient>,
    TRawClient
  >;

  constructor(name: string, hostId: number, app: Application) {
    this.name = name;
    this.hostId = hostId;
    this.config = null;
    this.app = app;
    this.logger = loggerWrapper(app.logger, `[host-client-${this.hostId}-${this.name}]`);
    this.repoData = new RepoData();
    this.commandLastExecTime = new Map<string, number>();
    this.luaClient = new LuaClient(app, this);
    process.nextTick(() => {
      this.luaClient.init();
      // put in next tick to make sure construction finished
      this.updateData();
      // update data every morning at 8 o'clock
      // TODO need to support event update
      this.app.sched.register(`${this.name}_Update_Repo_Data`, '0 0 8 * * *', 'workers', () => {
        this.updateData();
      });
    });
    this.luaClient = new LuaClient(app, name);
  }

  // region
  // abstract functions

  protected abstract async updateData(): Promise<void>;

  public abstract async getFileContent(path: string): Promise<string | undefined>;

  public abstract async addIssue(title: string, body: string, labels?: string[] | undefined): Promise<void>;

  public abstract async addIssueComment(number: number, body: string): Promise<void>;

  public abstract async listLabels(): Promise<Array<{ name: string, description: string, color: string }>>;

  public abstract async updateIssue(number: number, update: { title?: string, body?: string, state?: 'open' | 'closed' }): Promise<void>;

  public abstract async addLabels(number: number, labels: string[]): Promise<void>;

  public abstract async updateLabels(labels: Array<{ current_name: string; name?: string; description?: string; color?: string; }>): Promise<void>;

  public abstract async createLabels(labels: Array<{ name: string, description: string, color: string }>): Promise<void>;

  public abstract async createCheckRun(check: CheckRun): Promise<void>;

  public abstract async merge(num: number): Promise<void>;

  public abstract async assign(num: number, login: string): Promise<void>;

  public async runCI(configName: string, pullNumber: number): Promise<void> {
    if (!configName || !Number.isInteger(pullNumber)) return;

    const ciConfigs = this.getCompConfig<CIConfig>('ci');
    if (!ciConfigs || ciConfigs.enable !== true || !ciConfigs.configs) return;

    let jobName = '';
    const ciConfig = ciConfigs.configs.find(config => {
      return config.name === configName && (config.repoToJobMap.findIndex(r2j => {
        if (r2j.repo === this.name) {
          jobName = r2j.job;
          return true;
        }
        return false;
      }) !== -1);
    });
    if (!ciConfig) return;

    if (ciConfig.platform === CIPlatform.Jenkins) {
      this.app.ciManager.runJenkins(jobName, pullNumber.toString(), ciConfig);
    }
  }

  //endregion

  //region
  // common functions

  public getRepoData(): Repo {
    return this.repoData.getRepoData();
  }

  public getCompConfig<TConfig>(comp: string): TConfig | undefined {
    if (this.config[comp]) {
      return this.config[comp] as TConfig;
    }
    return undefined;
  }
  // public setInjectFunction(key: string, value: any): void {
  //   if (!this.luaInjectMethods) {
  //     this.luaInjectMethods = new Map<string, any>();
  //   }
  //   this.luaInjectMethods.set(key, value);
  // }

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
    const roleConfig: RoleConfig | undefined = this.getCompConfig<RoleConfig>('role');
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
    const commandConfig: CommandConfig | undefined = this.getCompConfig<CommandConfig>('command');
    if (!commandConfig || !commandConfig.commands) return true;

    const commandScope = commandConfig.commands.find(c => c.name === command);
    if (commandScope) return commandScope.scopes.includes(from);
    return true;
  }

  public checkInterval(isIssue: boolean, issueNumber: number, command: string): boolean {
    const commandConfigs: CommandConfig | undefined = this.getCompConfig<CommandConfig>('command');
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

  protected setCommandLastExecTime(isIssue: boolean, issueNumber: number) {
    if (isIssue) {
      this.commandLastExecTime.set('issue_' + issueNumber, new Date().getTime());
    } else {
      this.commandLastExecTime.set('pull_' + issueNumber, new Date().getTime());
    }
  }

  protected getCommandLastExecTime(isIssue: boolean, issueNumber: number): number | undefined {
    if (isIssue) return this.commandLastExecTime.get('issue_' + issueNumber);
    return this.commandLastExecTime.get('pull_' + issueNumber);
  }
  //endregion

}
