import { Application } from 'egg';
import RoleConfig from '../../../component/role/config';
import { LuaVm } from '../../../lua-vm/LuaVm';
import { luaMethod, luaEvents } from '../../../lua-vm/decorators';
import { Repo } from '../../DataTypes';
import IMConfig from '../../../component/im/config';
import { IncomingWebhookSendArguments } from '@slack/webhook/dist/IncomingWebhook';
import { BotLogger, loggerWrapper } from '../../Utils';
import * as Nodemailer from 'nodemailer';
import { DingTalkMessageType } from '../../IMDataTypes';
import { HostingClientBase } from '../HostingClientBase';
import { HostingConfigBase } from '../HostingConfigBase';

export class LuaClient<TConfig extends HostingConfigBase, TRawClient> {
  private luaSubscribeEvents: Map<any, any[]>;
  private app: Application;
  private name: string;
  private luaVm: LuaVm | null;
  private logger: BotLogger;
  private luaInjectMethods: Map<string, any>;
  private hcClient: HostingClientBase<TConfig, TRawClient>;

  constructor(app: Application, hcClient: any) {
    this.luaSubscribeEvents = new Map<any, any[]>();
    this.app = app;
    this.hcClient = hcClient;
    this.name = hcClient.name;
    this.logger = loggerWrapper(app.logger, `[${hcClient.name}-luaClient]`);
  }

  public async onConfigLoaded(): Promise<void> {
    await this.runLuaScript();
  }

  public dispose() {
    // TODO
  }

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
      funcArr.forEach(fc => this.app.event.unsubscribeOne<any>(eventClass, fc));
    });
    this.luaSubscribeEvents.clear();
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
    if (this.luaVm) {
      // 2.1 if yes, stop VM, then cancelSubscribeEvent cancelSchedEvnt and finally start a new luaVm.
      this.luaVm = null; // stop existing luaVM
      this.cancelSubscribeEvent();
      this.logger.info('cancele registered event');
      // this.cancelSchedEvent(); // TODO
    }
    this.luaVm = new LuaVm();

    // set methods
    if (this.luaInjectMethods) {
      this.luaInjectMethods.forEach((v, k) => {
        if (this.luaVm) {
          this.luaVm.set(k, v, this);
        }
      });
    }

    // set configs
    this.luaVm.set('config', this.hcClient.getConfig()); // component config here.
    // 4. run script
    this.logger.info(this.hcClient.getLuaScript());
    const res = this.luaVm.run(this.hcClient.getLuaScript());
    this.logger.info('Lua exec result,', res);

  }

  //region
  // lua functions

  @luaMethod()
  protected lua_on(eventType: string, cb: (e: any) => void) {
    const eventClass = luaEvents.get(eventType);
    if (!eventClass) return; // only registered event can be used
    const func = async e => {
      if (e.fullName !== this.name || e.installationId !== this.hcClient.getHostId()) {
        // lua only consume self repo event
        return;
      }
      const luaE = eventClass.toLuaEvent(e);
      if (!luaE) return;
      cb(luaE);
    };
    this.app.event.subscribeOne<any>(eventClass as any, func);
    this.recordSubscribeEvent(eventClass, func);
  }

  @luaMethod()
  protected lua_sched(name: string, time: string, cb: () => void) {
    const jobName = `${this.name}_${name}`;
    this.app.sched.register(jobName, time, 'worker', cb);
  }

  @luaMethod()
  protected lua_getData(): Repo {
    return this.hcClient.getRepoData();
  }

  @luaMethod()
  protected lua_getRoles(role: string): string[] {
    const roleConfig: RoleConfig | undefined = this.hcClient.getCompConfig<RoleConfig>('role');
    if (!roleConfig || !roleConfig.roles) return [];
    const roleDetail = roleConfig.roles.find(r => r.name === role);
    if (!roleDetail || !roleDetail.users) return [];
    return roleDetail.users;
  }

  @luaMethod()
  protected lua_addIssue(title: string, body: string, labels: string[]): void {
    this.logger.info('Gonna add issue from lua, title=', title, ',body=', body);
    this.hcClient.addIssue(title, body, labels);
  }

  @luaMethod()
  protected lua_assign(num: number, login: string): void {
    this.logger.info('Gonna assign from lua, num=', num, ',login=', login);
    this.hcClient.assign(num, login);
  }

  @luaMethod()
  protected lua_addIssueComment(num: number, body: string): void {
    this.logger.info(
      'Gonna add issue comment from lua, number=',
      num,
      ',body=',
      body,
    );
    this.hcClient.addIssueComment(num, body);
  }

  @luaMethod()
  protected lua_addLabels(num: number, labels: string[]): void {
    this.logger.info(
      'Goona add label from lua, number=',
      num,
      ',labels=',
      labels,
    );
    this.hcClient.addLabels(num, labels);
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
  protected lua_checkAuth(
    login: string,
    command: string,
    author: string,
  ): boolean {
    return this.hcClient.commandService.checkAuth(login, command, author);
  }

  @luaMethod()
  protected lua_merge(num: number): void {
    this.logger.info('Gonna merge pull from lua, number=', num);
    this.hcClient.merge(num);
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
      this.name,
    );
    this.hcClient.runCI(configName, pullNumber);
  }

  @luaMethod()
  protected lua_sendToSlack(
    configName: string,
    message: IncomingWebhookSendArguments,
  ): void {
    this.logger.info('Gonna run sendToSlack from lua, configName=', configName);
    if (!configName || !message) return;

    const config = this.hcClient.getCompConfig<IMConfig>('im');
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

    const config = this.hcClient.getCompConfig<IMConfig>('im');
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

    const config = this.hcClient.getCompConfig<IMConfig>('im');
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
  //endregion
}
