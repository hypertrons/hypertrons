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

import { Application } from 'egg';
import RoleConfig from '../../../component/role/config';
import { LuaVm } from '../../../lua-vm/LuaVm';
import { luaMethod, luaEvents } from '../../../lua-vm/decorators';
import { Repo } from '../../DataTypes';
import IMConfig from '../../../component/im/config';
import { IncomingWebhookSendArguments } from '@slack/webhook/dist/IncomingWebhook';
import * as Nodemailer from 'nodemailer';
import { DingTalkMessageType } from '../../IMDataTypes';
import { HostingConfigBase } from '../HostingConfigBase';
import { ISchedulerJobHandler } from '../../../plugin/scheduler-manager/types';
import { ClientServiceBase } from './ClientServiceBase';
import { HostingClientBase } from '../HostingClientBase';
import LabelSetupConfig from '../../../component/label_setup/config';
import WeeklyReport from '../../helper/weekly-report/weekly-report';
import { IssueMetaDataFormatRegExp, IssueMetaDataBegin, IssueMetaDataEnd, renderString } from '../../Utils';
import WeeklyReportConfig from '../../../component/weekly_report/config';

export class LuaService<TConfig extends HostingConfigBase, TRawClient> extends ClientServiceBase<TConfig, TRawClient> {
  private luaSubscribeEvents: Map<any, any[]>;
  private luaVm: LuaVm | null;
  private luaInjectMethods: Map<string, any>;
  private luaSchedulerJobHandler: ISchedulerJobHandler[];

  constructor(app: Application, client: HostingClientBase<TConfig, TRawClient>) {
    super(app, client, 'luaService');
    this.luaSubscribeEvents = new Map<any, any[]>();
    this.luaSchedulerJobHandler = [];
  }

  public async onStart(): Promise<any> { }

  public async onConfigLoaded(): Promise<any> {
    this.runLuaScript();
  }

  public async onDispose(): Promise<any> {
    this.luaVm = null;
    this.cancelSubscribeEvent();
    this.cancelSched();
  }

  public async syncData(): Promise<any> { }

  public recordSubscribeEvent(eventClass: any, func: any): void {
    const arr = this.luaSubscribeEvents.get(eventClass);
    if (arr) {
      arr.push(func);
    } else {
      this.luaSubscribeEvents.set(eventClass, Array.of(func));
    }
  }

  private cancelSubscribeEvent(): void {
    this.luaSubscribeEvents.forEach((funcArr, eventClass) => {
      funcArr.forEach(fc => this.client.eventService.unsubscribeOne<any>(eventClass, fc));
    });
    this.luaSubscribeEvents.clear();
  }

  private recordSched(schedulerJobHandler: ISchedulerJobHandler): void {
    if (this.luaSchedulerJobHandler) {
      this.luaSchedulerJobHandler.push(schedulerJobHandler);
    } else {
      this.luaSchedulerJobHandler = Array.of(schedulerJobHandler);
    }
  }

  private cancelSched(): void {
    this.luaSchedulerJobHandler.forEach(ls => {
      ls.cancel();
    });
    this.luaSchedulerJobHandler = []; // clear array.
  }

  public setInjectFunction(key: string, value: any): void {
    if (!this.luaInjectMethods) {
      this.luaInjectMethods = new Map<string, any>();
    }
    this.luaInjectMethods.set(key, value);
  }

  private async runLuaScript(): Promise<void> {
    this.logger.info('runLuaScript called');
    // 1. check whether there is already lua VM.
    if (this.luaVm) this.onDispose();
    this.luaVm = new LuaVm();

    // 2. set methods and configs, then run scripts.
    const { luaScript, offset } = this.client.configService.getLuaScriptAndOffset();
    if (!luaScript || luaScript === '') {
      // do not init if no lua script content found
      return;
    }

    // set methods
    if (this.luaInjectMethods) {
      this.luaInjectMethods.forEach((v, k) => {
        if (this.luaVm) {
          this.luaVm.set(k, v, this);
        }
      });
    }

    // set configs
    this.luaVm.set('config', this.client.getConfig()); // component config here.

    // 3. run script
    const res = this.luaVm.run(luaScript);

    // 4. handle exec result
    this.logger.info('Lua exec result,', res);
    const pattern = /:\d+:/;
    const errorLines = pattern.exec(res);
    if (errorLines) {
      errorLines.forEach(errorLineStr => {
        const errorLine = Number(errorLineStr.substr(1, errorLineStr.length - 2));
        if (isNaN(errorLine)) return;
        // Before running the lua script, luaVM injected some hepler functions in app/lua-vm/helpers.lua,
        // therefore, we need to subtract the number of lines of injected code to get the correct offset.
        let curLines = 1;
        if (this.luaVm) curLines += this.luaVm.getLuaBuidinCodeLines();

        for (const i in offset) {
          if (curLines + offset[i].offset > errorLine) {
            this.logger.warn(`Lua error may be occurred in ${offset[i].compName} line ${errorLine - curLines - 2}`);
            return;
          }
          curLines += offset[i].offset;
        }
      });
    }
  }

  //region
  // lua functions

  @luaMethod()
  protected lua_on(eventType: string, cb: (e: any) => void) {
    this.logger.info('call lua_on, eventType =', eventType);
    const eventClass = luaEvents.get(eventType);
    if (!eventClass) return; // only registered event can be used
    const func = async e => {
      const luaE = eventClass.toLuaEvent(e);
      if (!luaE) return;
      cb(luaE);
    };
    this.client.eventService.subscribeOne<any>(eventClass as any, func);
    this.recordSubscribeEvent(eventClass, func);
  }

  @luaMethod()
  protected lua_sched(name: string, time: string, cb: () => void) {
    this.logger.info(`lua_sched called name=${name}, time =${time}`);
    const jobName = `${this.client.getFullName()}_${name}`;
    const schedulerJobHandler = this.app.sched.register(jobName, time, 'worker', cb);
    this.recordSched(schedulerJobHandler);
  }

  @luaMethod()
  protected lua_getData(): Repo {
    return this.client.getRepoData();
  }

  @luaMethod()
  protected lua_getIssuesNumber(): number[] {
    try {
      const issues = this.client.getRepoData().issues;
      return issues.map(issue => issue.number);
    } catch (e) {
      this.logger.warn(e.message);
      return [];
    }
  }

  @luaMethod()
  protected lua_getRoles(role: string): string[] {
    const roleConfig: RoleConfig | undefined = this.client.getCompConfig<RoleConfig>('role');
    if (!roleConfig || !roleConfig.roles) return [];
    const roleDetail = roleConfig.roles.find(r => r.name === role);
    if (!roleDetail || !roleDetail.users) return [];
    return roleDetail.users;
  }

  @luaMethod()
  protected lua_checkRoleName(roleName: string): boolean {
    const roleConfig: RoleConfig | undefined = this.client.getCompConfig<RoleConfig>('role');
    if (!roleConfig || !roleConfig.roles) return false;
    const roleDetail = roleConfig.roles.find(r => r.name === roleName);
    if (!roleDetail) return false;
    else return true;
  }

  @luaMethod()
  protected lua_getIssueMetaData(issueNumber: number): object {
    try {
      const issues = this.client.getRepoData().issues;
      const index = issues.findIndex(v => v.number === issueNumber);
      if (index < 0) {
        this.logger.info('In lua_getIssueMetaData, can not find issueNumber =', issueNumber);
        return {};
      }
      const data = IssueMetaDataFormatRegExp.exec(issues[index].body);
      if (data) {
        return JSON.parse(data[1]);
      }
    } catch (e) {
      this.logger.warn(e.message);
    }
    return {};
  }

  @luaMethod()
  protected lua_updateIssueMetaData(issueNumber: number, data: object): void {
    this.logger.info('call lua_updateIssueMetaData, issueNumber =', issueNumber);
    const issues = this.client.getRepoData().issues;
    const index = issues.findIndex(v => v.number === issueNumber);
    if (index < 0) {
      this.logger.info('In lua_updateIssueMetaData, cannot find this issue id =', issueNumber, index, issues.length);
      return;
    }
    const matchData = IssueMetaDataFormatRegExp.exec(issues[index].body);
    if (matchData) {
      try {
        // get data and then update
        let metaDataJson = JSON.parse(matchData[1]);
        metaDataJson = {
          ...data,
        };
        const metaDataNew = JSON.stringify(metaDataJson);
        issues[index].body = issues[index].body.replace(
          IssueMetaDataFormatRegExp,
          IssueMetaDataBegin + metaDataNew + IssueMetaDataEnd,
        );
      } catch (e) {
        this.logger.warn(e.message);
      }
    } else {
      issues[index].body = IssueMetaDataBegin + JSON.stringify(data) + IssueMetaDataEnd + issues[index].body;
    }

    // send updated issue body.
    this.client.updateIssue(issueNumber, { body: issues[index].body });
    return;
  }

  @luaMethod()
  protected lua_updateCommentAnnotation(type: string, issueNumber: number, comment_id: number, message: string): boolean {
    this.logger.info('call lua_updateCommentAnnotation ', 'type =', type);
    const issues = this.client.getRepoData().issues;
    const index = issues.findIndex(v => v.number === issueNumber);
    if (index < 0) {
      this.logger.info('In lua_updateCommentAnnotation, cannot find this issue id =', issueNumber, index, issues.length);
      return false;
    }
    const cid = issues[index].comments.findIndex(c => c.id === comment_id);
    if (cid < 0) {
      this.logger.info('In lua_updateCommentAnnotation, cannot find this comment id =', comment_id, cid);
      return false;
    }

    let commentBody = issues[index].comments[cid].body;
    const matchError = commentBody.match(/> Error: [\w\W]*/g);
    const matchInfo = commentBody.match(/> Info: [\w\W]*/g);
    if (matchError || matchInfo) {
      this.logger.info('already checked.');
      return false;
    }
    let newContent = '';
    if (type === 'info') {
      newContent = `
> Info: ` + message;
    } else if (type === 'error') {
      newContent = `
> Error: ` + message;
    }
    commentBody += newContent;
    this.client.updateIssueComment(comment_id, commentBody);
    return true;
  }

  @luaMethod()
  protected lua_updateIssueComment(comment_id: number, commentBody: string) {
    this.logger.info('call lua_updateIssueComment, comment_id =', comment_id);
    return this.client.updateIssueComment(comment_id, commentBody);
  }

  @luaMethod()
  protected lua_getIssueComment(issueNumber: number, comment_id: number): string {
    this.logger.info('call lua_getIssueComment, issueNumber =', issueNumber);
    const issues = this.client.getRepoData().issues;
    const index = issues.findIndex(v => v.number === issueNumber);
    if (index < 0) {
      this.logger.info('In lua_getIssueComment, can\'t find issueNumber = ', issueNumber);
      return '';
    }
    const cid = issues[index].comments.findIndex(c => c.id === comment_id);
    if (cid < 0) {
      this.logger.info('In lua_getIssueComment, can\'t find comment_id = ', comment_id);
      return '';
    }
    return issues[index].comments[cid].body;
  }

  @luaMethod()
  protected lua_table2string(x: object): string {
    // -- This will be removed when we add table2string function in lua.
    return JSON.stringify(x);
  }

  @luaMethod()
  protected lua_string2table(x: string): object {
    // -- This will be removed when we add string2table function in lua.
    return JSON.parse(x);
  }

  @luaMethod()
  protected lua_rendStr(tmp: string, param: object): string {
    return renderString(tmp, param);
  }

  @luaMethod()
  protected lua_addIssue(title: string, body: string, labels: string[]): void {
    this.logger.info('Gonna add issue from lua, title=', title, ',body=', body);
    this.client.addIssue(title, body, labels);
  }

  @luaMethod()
  protected lua_assign(num: number, login: string): void {
    this.logger.info('Gonna assign from lua, num=', num, ',login=', login);
    this.client.assign(num, login);
  }

  @luaMethod()
  protected lua_addIssueComment(num: number, body: string): void {
    this.logger.info(
      'Gonna add issue comment from lua, number=',
      num,
      ',body=',
      body,
    );
    this.client.addIssueComment(num, body);
  }

  @luaMethod()
  protected lua_addLabels(num: number, labels: string[]): void {
    this.logger.info(
      'Gonna add label from lua, number=',
      num,
      ',labels=',
      labels,
    );
    this.client.addLabels(num, labels);
  }

  @luaMethod()
  protected lua_removeLabel(num: number, label: string): void {
    this.client.removeLabel(num, label);
  }

  @luaMethod()
  protected lua_toNow(time: string): number {
    return new Date().getTime() - new Date(time).getTime();
  }

  @luaMethod()
  protected lua_getNowTime(): number {
    return new Date().getTime();
  }

  @luaMethod()
  protected lua_toNowNumber(time: number): number {
    return new Date().getTime() - time;
  }

  @luaMethod()
  protected lua_log(...msg: string[]): void {
    this.logger.info('From lua:', ...msg);
  }

  @luaMethod()
  protected lua_checkAuth(
    login: string,
    command: string,
    author: string,
  ): boolean {
    return this.client.commandService.checkAuth(login, command, author);
  }

  @luaMethod()
  protected lua_merge(num: number): void {
    this.logger.info('Gonna merge pull from lua, number=', num);
    this.client.merge(num);
  }

  @luaMethod()
  protected lua_updateIssue(num: number, update: {title?: string, body?: string, state?: 'open' | 'closed'}): void {
    this.logger.info('Gonna update issue number=', num);
    this.client.updateIssue(num, update);
  }

  @luaMethod()
  protected lua_updatePull(num: number, update: {title?: string, body?: string, state?: 'open' | 'closed'}): void {
    this.logger.info('Gonna update pull request number=', num);
    this.client.updatePull(num, update);
  }

  @luaMethod()
  protected lua_runCI(configName: string, pullNumber: number): void {
    this.logger.info(
      'Gonna run CI from lua, ',
      'configName=',
      configName,
      ',pullNumber=',
      pullNumber,
      ', fullName=',
      this.client.getFullName(),
    );
    this.client.runCI(configName, pullNumber);
  }

  @luaMethod()
  protected lua_sendToSlack(
    configName: string,
    message: IncomingWebhookSendArguments,
  ): void {
    this.logger.info('Gonna run sendToSlack from lua, configName=', configName);
    if (!configName || !message) return;

    const config = this.client.getCompConfig<IMConfig>('im');
    if (!config || !config.slack) {
      return;
    }

    config.slack.forEach(c => {
      if (c.name === configName) {
        this.app.imManager.sendToSlack(message, c);
        return;
      }
    });
  }

  @luaMethod()
  protected lua_sendToMail(
    configName: string,
    message: Nodemailer.SendMailOptions,
  ): void {
    this.logger.info('Gonna run sendToMail from lua, configName=', configName);
    if (!configName || !message) return;

    const config = this.client.getCompConfig<IMConfig>('im');
    if (!config || !config.mail) {
      return;
    }

    config.mail.forEach(c => {
      if (c.name === configName) {
        this.app.imManager.sendToMail(message, c);
        return;
      }
    });
  }

  @luaMethod()
  protected lua_sendToDingTalk(
    configName: string,
    message: DingTalkMessageType,
  ): void {
    this.logger.info(
      'Gonna run sendToDingTalk from lua, configName=',
      configName,
    );
    if (!configName || !message) return;

    const config = this.client.getCompConfig<IMConfig>('im');
    if (!config || !config.dingTalk) {
      return;
    }

    config.dingTalk.forEach(c => {
      if (c.name === configName) {
        this.app.imManager.sendToDingTalk(message, c);
        return;
      }
    });
  }

  @luaMethod()
  protected async lua_labelSetup() {
    // config check
    const labelConfig = this.client.getCompConfig<LabelSetupConfig>('label_setup');
    if (!labelConfig) return;
    const currentLabels = await this.client.listLabels();

    // traverse new config, update all contained labels
    let createCount = 0;
    let updateCount = 0;
    const createTask: Array<{name: string, description: string, color: string}> = [];
    const updateTask: Array<{current_name: string; description?: string; color?: string}> = [];
    labelConfig.labels.forEach(label => {
      const param: any = {
        name: label.name,
        color: label.color,
        description: label.description,
      };
      // find old label by name, then update/create label
      const oldLabel = currentLabels.find(l => l.name === label.name);
      if (oldLabel) {
        param.current_name = label.name;
        delete param.name;
        if (oldLabel.color === label.color) delete param.color;
        if (oldLabel.description === label.description) delete param.description;
        if (!param.color && !param.description) {
          // no need to update
          return;
        }
        // update old label
        updateCount++;
        updateTask[updateTask.length] = param;
        return;
      } else {
        // create new label
        createCount++;
        createTask[createTask.length] = param;
        return;
      }
    });

    // exec update
    if (updateCount === 0 && createCount === 0) {
      this.logger.info(`No need to update labels for ${this.client.getFullName()}`);
      return;
    }
    this.logger.info(`Gonna update ${updateCount} labels and create ${createCount} labels for ${this.client.getFullName()}`);
    if (updateCount !== 0) await this.client.updateLabels(updateTask);
    if (createCount !== 0) await this.client.createLabels(createTask);
    this.logger.info(`Update labels for ${this.client.getFullName()} done.`);
  }

  // TODO Temporary method
  @luaMethod()
  protected lua_weeklyReport() {
    const weeklyReportConfig = this.client.getCompConfig<WeeklyReportConfig>('weekly_report');
    if (weeklyReportConfig && weeklyReportConfig.receiver && weeklyReportConfig.receiver.length > 0) {
      weeklyReportConfig.receiver.forEach(r => {
        if (r === 'slack') {
          new WeeklyReport(this.client, this.app).genSlackWeeklyReportForRepo();
        } else if (r === 'issue') {
          new WeeklyReport(this.client, this.app).genIssueWeeklyReportForRepo();
        }
      });
    }
  }

  //endregion
}
