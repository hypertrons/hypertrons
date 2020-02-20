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

import { AppPluginBase } from '../../basic/AppPluginBase';
import { Application } from 'egg';
import { InstallationType } from './types';
import { HostingPlatformInitEvent } from '../../basic/HostingPlatform/event';
import { IClient } from './IClient';

export class AppInstallationManager extends AppPluginBase<Config> {

  private clientMap: Map<number, InstallationInfo>;

  constructor(config: Config, app: Application) {
    super(config, app);
    this.clientMap = new Map<number, InstallationInfo>();
  }

  public async onReady(): Promise<void> {
    this.app.event.subscribeAll(HostingPlatformInitEvent, async e => {
      this.clientMap.set(e.id, {
        name: e.config.name,
        type: e.type,
      });
    });
  }

  public async onStart(): Promise<void> { }

  public async onClose(): Promise<void> { }

  public async getClient(installationId: number, name: string): Promise<IClient | undefined> {
    // tslint:disable-next-line: whitespace
    const type = this.clientMap.get(installationId)?.type;
    if (type) {
      switch (type) {
        case 'github':
          return this.app.github.getClient(installationId, name);
        case 'gitlab':
          return this.app.gitlab.getClient(installationId, name);
        case 'gitee':
          return this.app.gitee.getClient(installationId, name);
        default:
          break;
      }
    }
    return undefined;
  }

  public getInstallationType(installationId: number): InstallationType | undefined {
    const installationInfo = this.clientMap.get(installationId);
    if (installationInfo) return installationInfo.type;
    return undefined;
  }

  public getInstallationInfoByName(installationName: string): {id: number, type: InstallationType} {
    let id: number = -1;
    let type: InstallationType;
    this.clientMap.forEach((value, key) => {
      if (value.name === installationName) {
        id = key;
        type = value.type;
      }
    });
    return { id, type };
  }

  public async getHostingClientByInstallationName(installationName: string, fullName: string): Promise<IClient> {
    let client: any;
    this.clientMap.forEach(async(hostingPlatform, installationId) => {
      if (hostingPlatform.name === installationName) {
        switch (hostingPlatform.type) {
          case 'github':
            client = this.app.github.getClient(installationId, fullName);
            break;
          case 'gitlab':
            client = this.app.gitlab.getClient(installationId, fullName);
            break;
          case 'gitee':
            client = this.app.gitee.getClient(installationId, fullName);
            break;
          default:
           break;
        }
      }
    });
    return client;
  }
}

interface Config {
  configs: Array<{
    type: InstallationType,
    config: any,
  }>;
}

export interface InstallationInfo {
  name: string;
  type: InstallationType;
}
