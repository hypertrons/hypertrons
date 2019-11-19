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

import { AppPluginBase } from '../../basic/AppPluginBase';
import { IClient } from './IClient';
import { Application } from 'egg';
import { InstallationType } from './types';

export class AppInstallationManager extends AppPluginBase<Config> {

  private clientMap: Map<number, InstallationType>;

  constructor(config: Config, app: Application) {
    super(config, app);
    this.clientMap = new Map<number, InstallationType>();
  }

  public async onReady(): Promise<void> { }

  public async onStart(): Promise<void> { }

  public async onClose(): Promise<void> { }

  public async getClient(installationId: number, name: string): Promise<IClient | undefined> {
    const type = this.clientMap.get(installationId);
    if (type) {
      switch (type) {
        case 'github':
          return this.app.githubInstallation.getClient(installationId, name);
        case 'gitlab':
          break;
        default:
          break;
      }
    }
    return undefined;
  }

  public getInstallationType(installationId: number): InstallationType {
    return this.clientMap.get(installationId);
  }

}

interface Config {
  configs: Array<{
    type: InstallationType,
    config: any,
  }>;
}
