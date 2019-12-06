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
import { luaMethod } from '../../lua-vm/decorators';
import { luaEvents } from '../../plugin/event-manager/events';
import { LUA_SCRIPT_KEY } from '../../plugin/component-manager/AppComponentManager';
import { Command } from '../../plugin/command-manager/Command';
import RoleConfig from '../../component/role/config';
import CommandConfig from '../../component/command/config';

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
    this.runLuaScript();
  }

  public abstract async getFileContent(path: string): Promise<string | undefined>;

  public abstract async addIssue(title: string, body: string, labels?: string[] | undefined): Promise<void>;

  public abstract async listLabels(): Promise<Array<{ name: string, description: string, color: string }>>;

  public abstract async updateIssue(number: number, update: { title?: string, body?: string, state?: 'open' | 'closed' }): Promise<void>;

  public abstract async addLabels(number: number, labels: string[]): Promise<void>;

  public abstract async updateLabels(labels: Array<{ current_name: string; name?: string; description?: string; color?: string; }>): Promise<void>;

  public abstract async createLabels(labels: Array<{ name: string, description: string, color: string }>): Promise<void>;

  public abstract async createCheckRun(check: CheckRun): Promise<void>;

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

  public checkAuth(login: string, commands: Command[]): Command[] {
    // config check
    const commandConfig: CommandConfig | undefined = this.getCompConfig<CommandConfig>('command');
    const roleConfig: RoleConfig | undefined = this.getCompConfig<RoleConfig>('role');
    if (!roleConfig || !commandConfig) return [];

    // roles that user has
    const userRoles = roleConfig.roles.filter(role => role.name.includes(login)).map(r => r.name).concat('anyone');
    // return the commands that user can exec
    return commands.filter(command => {
      // roles that can exec the current command
      const requiredRoles = commandConfig.auth.filter(auth => auth.command.includes(command.exec)).map(r => r.role);
      // check if user can exec current command
      return requiredRoles.some(r => userRoles.includes(r));
    });
  }

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
  protected lua_addLabels(num: number, labels: string[]): void {
    this.addLabels(num, labels);
  }

  @luaMethod()
  protected lua_log(...msg: string[]): void {
    this.logger.info('From lua:', ...msg);
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

}
