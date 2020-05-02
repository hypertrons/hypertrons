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

import { RepoEventBase } from '../../plugin/event-manager/events';
import { RawData } from './HostingClientService/ConfigService';
import { Repo } from '../DataTypes';
export type HostingPlatformTypes = 'github' | 'gitlab' | 'gitee';

// Hosting platform events
export class HostingPlatformEventBase {
  id: number;
}

export class HostingPlatformInitEvent extends HostingPlatformEventBase {
  type: HostingPlatformTypes;
  config: any;
}

export class HostingPlatformSyncDataEvent extends HostingPlatformEventBase {
}

export class HostingPlatformComponentInitedEvent extends HostingPlatformEventBase {
  components: any;
}

export class HostingPlatformInitRepoEvent extends HostingPlatformEventBase {
  fullName: string;
  payload: any;
}

export class HostingPlatformRepoAddedEvent extends HostingPlatformEventBase {
  fullName: string;
  payload: any;
}

export class HostingPlatformRepoRemovedEvent extends HostingPlatformEventBase {
  fullName: string;
}

export class HostingPlatformUninstallEvent extends HostingPlatformEventBase {
  owner: string;
}

// Hosting client events

export class HostingClientSyncDataEvent extends RepoEventBase {
}

export class HostingClientSyncConfigEvent extends RepoEventBase {
}

export class HostingClientOnConfigFileChangedEvent extends RepoEventBase {
  option: 'remove' | 'update';
}

export class HostingClientConfigInitedEvent extends RepoEventBase {
  rawData: RawData;
  version: number;
}

export class HostingClientRepoDataInitedEvent extends RepoEventBase {
  repoData: Repo;
}
