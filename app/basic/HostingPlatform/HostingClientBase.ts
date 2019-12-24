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

import { BotLogger, loggerWrapper, waitUntil, parseRepoName } from '../Utils';
import { Application } from 'egg';
import { CheckRun, CIPlatform, Repo } from '../DataTypes';
import CIConfig from '../../component/ci/config';
import { LuaService } from './HostingClientService/LuaService';
import { HostingBase } from './HostingBase';
import { RepoDataService } from './HostingClientService/RepoDataService';
import { CommandService } from './HostingClientService/CommandService';
import { ConfigService } from './HostingClientService/ConfigService';
import { ISchedulerJobHandler } from '../../plugin/scheduler-manager/types';
import { HostingConfigBase } from './HostingConfigBase';
import { EventManager } from './HostingClientService/EventManager';
import { ClientServiceBase } from './HostingClientService/ClientServiceBase';
import { IClient } from '../../plugin/installation-manager/IClient';
import { HostingClientSyncDataEvent } from './event';

export abstract class HostingClientBase<TConfig extends HostingConfigBase, TRawClient> implements IClient {

  private app: Application;
  protected logger: BotLogger;

  protected hostId: number;
  protected fullName: string;
  protected rawClient: TRawClient;
  protected hostBase: HostingBase<TConfig, HostingClientBase<TConfig, TRawClient>, TRawClient>;
  protected job: ISchedulerJobHandler;
  protected started: boolean;

  private luaService: LuaService<TConfig, TRawClient>;
  public repoDataService: RepoDataService<TConfig, TRawClient>;
  public commandService: CommandService<TConfig, TRawClient>;
  public configService: ConfigService<TConfig, TRawClient>;
  public eventService: EventManager<TConfig, TRawClient>;
  protected services: Array<ClientServiceBase<TConfig, TRawClient>>;

  constructor(fullName: string, hostId: number, app: Application,
              hostBase: HostingBase<TConfig, HostingClientBase<TConfig, TRawClient>, TRawClient>) {
    this.fullName = fullName;
    this.hostId = hostId;
    this.app = app;
    this.hostBase = hostBase;
    this.started = false;
    this.logger = loggerWrapper(app.logger, `[client-${this.hostBase.getName()}-${this.fullName}]`);

    this.eventService = new EventManager(app, this);
    this.configService = new ConfigService(app, this);
    this.repoDataService = new RepoDataService(app, this);
    this.luaService = new LuaService(app, this);
    this.commandService = new CommandService(app, this);
    this.services = [ this.eventService, this.configService, this.repoDataService, this.luaService, this.commandService ];

    process.nextTick(() => {
      this.onStart();
    });
  }

  public async onStart(): Promise<void> {
    this.logger.info('onStart');

    this.eventService.subscribeOne(HostingClientSyncDataEvent, async () => {
      this.syncData();
    });

    this.updateData();
    this.job = this.app.sched.register(`${this.fullName}_Update_Repo_Data`, '0 0 8 * * *', 'workers', () => {
      this.updateData();
    });

    for (const index in this.services) {
      await this.services[index].onStart();
    }

    this.started = true;
  }

  public async onDispose(): Promise<void> {
    this.logger.info('onDispose');
    this.job.cancel();
    for (let i = this.services.length - 1; i >= 0; i--) {
      await this.services[i].onDispose();
    }
  }

  public onConfigLoaded() {
    this.logger.info('onConfigLoaded');
    this.services.forEach(s => s.onConfigLoaded());
  }

  public async syncData(): Promise<void> {
    this.logger.info('Start to sync data');
    await waitUntil(() => this.started, { interval: 500 });
    this.services.forEach(s => s.syncData());
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

  //endregion

  //region
  // common functions

  public getRepoData(): Repo {
    return this.repoDataService.getRepoData();
  }
  public getHostingBase(): HostingBase<TConfig, HostingClientBase<TConfig, TRawClient>, TRawClient> {
    return this.hostBase;
  }
  public getHostId(): number {
    return this.hostId;
  }
  public getFullName(): string {
    return this.fullName;
  }
  public getConfig(): any {
    return this.configService.getConfig();
  }
  public getCompConfig<TConfig>(comp: string): TConfig | undefined {
    return this.configService.getCompConfig(comp);
  }
  public getLuaScript(): string {
    return this.configService.getLuaScript();
  }
  public setRawClient(rawClient: TRawClient) {
    this.rawClient = rawClient;
  }
  public getRawClient(): TRawClient {
    return this.rawClient;
  }
  public getHostingConfig(): HostingConfigBase {
    return this.hostBase.getConfig();
  }
  public getStarted(): boolean {
    return this.started;
  }
  public getOwner(): string {
    const { owner } = parseRepoName(this.fullName);
    return owner;
  }
  public async runCI(configName: string, pullNumber: number): Promise<void> {
    if (!configName || !Number.isInteger(pullNumber)) return;

    const ciConfigs = this.getCompConfig<CIConfig>('ci');
    if (!ciConfigs || !ciConfigs.configs) return;

    let jobName = '';
    const ciConfig = ciConfigs.configs.find(config => {
      return config.name === configName && (config.repoToJobMap.findIndex(r2j => {
        if (r2j.repo === this.fullName) {
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

}
