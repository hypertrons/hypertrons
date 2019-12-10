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

import { BotLogger, loggerWrapper, waitUntil } from '../Utils';
import { Application } from 'egg';
import { IClient } from '../../plugin/installation-manager/IClient';
import { Repo, CheckRun } from '../DataTypes';
import { LuaVm } from '../../lua-vm/LuaVm';
import { luaMethod, luaEvents } from '../../lua-vm/decorators';
import { LUA_SCRIPT_KEY } from '../../plugin/component-manager/AppComponentManager';
import RoleConfig from '../../component/role/config';

export abstract class HostingClientBase<TRawClient> implements IClient {

  public hostId: number;
  public rawClient: TRawClient;
  public name: string;
  private app: Application;
  protected logger: BotLogger;
  protected config: any;
  protected repoData: Repo;
  protected luaVm: LuaVm;
  public luaInjectMethods: Map<string, any>;

  constructor(name: string, hostId: number, app: Application) {
    this.name = name;
    this.hostId = hostId;
    this.config = null;
    this.app = app;
    this.logger = loggerWrapper(app.logger, `[host-client-${this.hostId}-${this.name}]`);
    process.nextTick(() => {
      // put in next tick to make sure construction finished
      this.runLuaScript();
      this.updateData();
      // update data every morning at 8 o'clock
      // TODO need to support event update
      this.app.sched.register(`${this.name}_Update_Repo_Data`, '0 0 8 * * *', 'workers', () => {
        this.updateData();
      });
    });
  }

  //region
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

  //endregion

  //region
  // common functions

  public getRepoData(): Repo {
    return this.repoData;
  }

  public getCompConfig<TConfig>(comp: string): TConfig | undefined {
    if (this.config[comp]) {
      return this.config[comp] as TConfig;
    }
    return undefined;
  }

  public setInjectFunction(key: string, value: any): void {
    if (!this.luaInjectMethods) {
      this.luaInjectMethods = new Map<string, any>();
    }
    this.luaInjectMethods.set(key, value);
  }

  public checkAuth(login: string, command: string): boolean {
    // config check
    const roleConfig: RoleConfig | undefined = this.getCompConfig<RoleConfig>('role');
    if (!roleConfig || !roleConfig.roles) return false;

    return roleConfig.roles.find(r =>
      r.users && r.users.includes(login) && r.commands && r.commands.includes(command)) !== undefined;
  }

  private async runLuaScript(): Promise<void> {
    await waitUntil(() => this.config !== null);
    const luaPath = this.getCompConfig<string>(LUA_SCRIPT_KEY);
    if (!luaPath || luaPath === '') {
      // do not init if no lua script in config
      return;
    }
    const luaContent = await this.getFileContent(luaPath);
    if (!luaContent || luaContent === '') {
      // do not init if no lua script content found
      return;
    }

    this.luaVm = new LuaVm();
    // set methods
    if (this.luaInjectMethods) {
      this.luaInjectMethods.forEach((v, k) => {
        this.luaVm.set(k, v, this);
      });
    }
    // set configs
    this.luaVm.set('config', this.config);

    // run script
    const res = this.luaVm.run(luaContent);
    this.logger.info('Lua exec result,', res);
  }

  //endregion

  //region
  // lua functions

  @luaMethod()
  protected lua_on(eventType: string, cb: (e: any) => void) {
    const eventClass = luaEvents.get(eventType);
    if (!eventClass) return;  // only registered event can be used
    this.app.event.subscribeOne<any>(eventClass as any, async e => {
      if (e.fullName !== this.name || e.installationId !== this.hostId) {
        // lua only consume self repo event
        return;
      }
      const luaE = eventClass.toLuaEvent(e);
      if (!luaE) return;
      cb(luaE);
    });
  }

  @luaMethod()
  protected lua_sched(name: string, time: string, cb: () => void) {
    const jobName = `${this.name}_${name}`;
    this.app.sched.register(jobName, time, 'worker', cb);
  }

  @luaMethod()
  protected lua_getData(): Repo {
    return this.repoData;
  }

  @luaMethod()
  protected lua_getRoles(role: string): string[] {
    const roleConfig: RoleConfig | undefined = this.getCompConfig<RoleConfig>('role');
    if (!roleConfig || !roleConfig.roles) return [];
    const roleDetail = roleConfig.roles.find(r => r.name === role);
    if (!roleDetail || !roleDetail.users) return [];
    return roleDetail.users;
  }

  @luaMethod()
  protected lua_addIssueComment(num: number, body: string): void {
    this.logger.info('Gonna add issue comment from lua, number=', num, ',body=', body);
    this.addIssueComment(num, body);
  }

  @luaMethod()
  protected lua_addLabels(num: number, labels: string[]): void {
    this.logger.info('Goona add label from lua, number=', num, ',labels=', labels);
    this.addLabels(num, labels);
  }

  @luaMethod()
  protected lua_toNow(time: string): number {
    return new Date().getTime() - new Date(time).getTime();
  }

  @luaMethod()
  protected lua_log(...msg: string[]): void {
    this.logger.info('From lua:', ...msg);
  }

  @luaMethod()
  protected lua_checkAuth(login: string, command: string): boolean {
    return this.checkAuth(login, command);
  }

  @luaMethod()
  protected lua_merge(num: number): void {
    this.logger.info('Gonna merge pull from lua, number=', num);
    this.merge(num);
  }

  //endregion
}
