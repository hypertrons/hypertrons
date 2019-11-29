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
import { Repo, CheckRun } from '../DataTypes';

export abstract class HostingClientBase<TRawClient> implements IClient {

  public hostId: number;
  public rawClient: TRawClient;
  public name: string;
  protected logger: BotLogger;
  protected config: any;
  protected repoData: Repo;

  constructor(name: string, hostId: number, app: Application) {
    this.name = name;
    this.hostId = hostId;
    this.config = null;
    this.logger = loggerWrapper(app.logger, `[host-client-${this.hostId}-${this.name}]`);
  }

  public abstract async getFileContent(path: string): Promise<string | undefined>;

  public abstract async addIssue(title: string, body: string, labels?: string[] | undefined): Promise<void>;

  public abstract async listLabels(): Promise<Array<{name: string, description: string, color: string}>>;

  public abstract async updateIssue(number: number, update: {title?: string, body?: string, state?: 'open' | 'closed'}): Promise<void>;

  public abstract async addLabels(number: number, labels: string[]): Promise<void>;

  public abstract async updateLabels(labels: Array<{ current_name: string; name?: string; description?: string; color?: string; }>): Promise<void>;

  public abstract async createLabels(labels: Array<{name: string, description: string, color: string}>): Promise<void>;

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

}
