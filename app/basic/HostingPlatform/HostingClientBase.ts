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

import { BotLogger, loggerWrapper, waitUntil, parseRepoName } from '../Utils';
import { Application } from 'egg';
import { CheckRun, CIPlatform, Repo, CreatePullRequestOption, RepoFile, RepoDir } from '../DataTypes';
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
import { SVG, Svg } from '@svgdotjs/svg.js';
import RoleConfig from '../../component/role/config';

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
    this.job = this.app.sched.register(`${this.fullName}_Update_Repo_Data`,
                                        this.hostBase.getConfig().updateRepoDataSched,
                                        'workers',
                                        () => this.updateData());

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

  public abstract async getFileContent(path: string, ref?: string): Promise<RepoFile | undefined>;

  public abstract async getDirectoryContent(path: string, ref?: string): Promise<RepoDir[] | undefined>;

  public abstract async addIssue(title: string, body: string, labels?: string[] | undefined): Promise<void>;

  public abstract async addIssueComment(number: number, body: string): Promise<void>;

  public abstract async listLabels(): Promise<Array<{ name: string, description: string, color: string }>>;

  public abstract async updateIssue(number: number, update: { title?: string, body?: string, state?: 'open' | 'closed' }): Promise<void>;

  public abstract async updatePull(number: number, update: { title?: string, body?: string, state?: 'open' | 'closed' }): Promise<void>;

  public abstract async updateIssueComment(comment_id: number, body: string): Promise<void>;

  public abstract async addLabels(number: number, labels: string[]): Promise<void>;

  public abstract async removeLabel(number: number, label: string): Promise<void>;

  public abstract async updateLabels(labels: Array<{ current_name: string; name?: string; description?: string; color?: string; }>): Promise<void>;

  public abstract async createLabels(labels: Array<{ name: string, description: string, color: string }>): Promise<void>;

  public abstract async createCheckRun(check: CheckRun): Promise<void>;

  public abstract async merge(num: number): Promise<void>;

  public abstract async assign(num: number, login: string): Promise<void>;

  public abstract async newBranch(newBranchName: string, baseBranchName: string, cb?: () => void): Promise<void>;

  public abstract async createOrUpdateFile(filePath: string, content: string, commitMessgae: string, branchName: string, cb?: () => void): Promise<void>;

  public abstract async newPullRequest(option: CreatePullRequestOption): Promise<void>;

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

  public communitySvgImage(): string {
    const roleConfig = this.getCompConfig<RoleConfig>('role');
    if (!roleConfig || !roleConfig.roles || roleConfig.roles.length === 0) return '';

    const titleHeight = 60;
    const avatarHeight = 100;
    const avatarWidth = 100;
    const loginHeight = 10;
    const rolePerRow = 5;
    const roleMargin = 20;
    let totalHeight = 0;

    const getHeightByRole = (r: any): number => {
      const n = Math.ceil(r.users.length / rolePerRow);
      return titleHeight + n * (loginHeight + avatarHeight) + roleMargin;
    };

    roleConfig.roles.forEach(r => {
      totalHeight += getHeightByRole(r);
    });
    const roleWidth = rolePerRow * avatarWidth;

    let offsetYGlobal = 0;
    const offsetXGlobal = 20;

    const window = require('svgdom');
    const document = window.document;
    const { registerWindow } = require('@svgdotjs/svg.js');

    registerWindow(window, document);

    const canvas: Svg = SVG<SVGSVGElement>(document.documentElement);
    canvas.size(roleWidth + offsetXGlobal, totalHeight + roleMargin);

    const addAvatar = (login: string, index: number, roleIndex: number) => {
      const homeUrl = `https://www.github.com/${login}`;
      const url = `https://avatars3.githubusercontent.com/${login}?s=${avatarWidth * 2}`;
      const id = `r${roleIndex}l${index}`;
      const offsetX = (index % rolePerRow) * avatarWidth + offsetXGlobal;
      const offsetY = offsetYGlobal + titleHeight + Math.floor(index / rolePerRow) * (loginHeight + avatarHeight);
      // pattern the image to fill circle later
      canvas.pattern().id(id).size(1, 1).attr({ patternUnits: 'objectBoundingBox' })
        .image(url).size(avatarWidth, avatarHeight);
      // use corresponding image to fill the circle
      canvas.link(homeUrl).circle(avatarHeight).cx(offsetX + avatarHeight / 2).cy(offsetY + avatarHeight / 2).fill(`url(#${id})`);
      // render text in svg container to align to middle
      canvas.group().translate(offsetX, offsetY + avatarHeight)
        .text(login).move(avatarWidth / 2, 0).font({ size: 14 }).attr({ 'text-anchor': 'middle' });
    };

    const addRole = (role: any, index: number) => {
      // if the role users is empty, not render, maybe a special user type like author or anyone
      if (!role.users || role.users.length === 0) return;
      canvas.text(role.name).move(offsetXGlobal, offsetYGlobal).font({ size: 25 });
      role.users.forEach((login: string, i: number) => {
        addAvatar(login, i, index);
      });
      offsetYGlobal += getHeightByRole(role);
    };

    roleConfig.roles.forEach(addRole);

    return canvas.svg();
  }
  //endregion

}
