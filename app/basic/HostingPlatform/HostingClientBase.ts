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
import { CheckRun, CIPlatform, Repo } from '../DataTypes';
import CIConfig from '../../component/ci/config';
import { LuaClient } from './HostingClientService/LuaClient';
import { HostingBase } from './HostingBase';
import { RepoDataService } from './HostingClientService/RepoDataService';
import { CommandService } from './HostingClientService/CommandService';
import { ConfigService } from './HostingClientService/ConfigService';
import { ISchedulerJobHandler } from '../../plugin/scheduler-manager/types';
import { HostingConfigBase } from './HostingConfigBase';
import { EventManager } from './HostingClientService/EventManager';

export abstract class HostingClientBase<TConfig extends HostingConfigBase, TRawClient> {

  private app: Application;
  protected logger: BotLogger;

  protected hostId: number;
  protected fullName: string;
  protected rawClient: TRawClient;
  protected hostBase: HostingBase<TConfig, HostingClientBase<TConfig, TRawClient>, TRawClient>;
  protected job: ISchedulerJobHandler;

  private luaClient: LuaClient<TConfig, TRawClient>;
  public repoDataService: RepoDataService<TConfig, TRawClient>;
  public commandService: CommandService<TConfig, TRawClient>;
  public configService: ConfigService<TConfig, TRawClient>;
  public eventManager: EventManager<TConfig, TRawClient>;

  constructor(fullName: string, hostId: number, app: Application) {
    this.fullName = fullName;
    this.hostId = hostId;
    this.app = app;
    this.logger = loggerWrapper(app.logger, `[host-client-${this.hostId}-${this.fullName}]`);

    this.eventManager = new EventManager(app, this);
    this.configService = new ConfigService(app, this);
    this.repoDataService = new RepoDataService(this);
    this.luaClient = new LuaClient(app, this);
    this.commandService = new CommandService(this);
  }

  public init() {
    // put in next tick to make sure construction finished
    this.configService.init();
    this.updateData();
    // update data every morning at 8 o'clock
    // TODO need to support event update
    this.job = this.app.sched.register(`${this.fullName}_Update_Repo_Data`, '0 0 8 * * *', 'workers', () => {
      this.updateData();
    });
  }
  public onConfigLoaded() {
    this.luaClient.onConfigLoaded();
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
  public async dispose(): Promise<void> {
    this.job.cancel();
    this.luaClient.dispose();
    return;
  }

  //endregion

}
