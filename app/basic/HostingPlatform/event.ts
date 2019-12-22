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

import { ComponentSet } from './ComponentService';

export type HostingPlatformTypes = 'github' | 'gitlab';

export class HostingPlatformInitEvent {
  id: number;
  name: string;
  type: HostingPlatformTypes;
  config: any;
}

export class HostingPlatformInitRepoEvent {
  id: number;
  fullName: string;
  payload: any;
}

export class HostingPlatformComponentInitedEvent {
  id: number;
  components: ComponentSet;
}

export class HostingClientConfigInitedEvent {
  id: number;
  fullName: string;
  config: any;
  luaScript: string;
}

export class HostingClientRepoDataInitedEvent {
  id: number;
  fullName: string;
  repoData: any;
}
