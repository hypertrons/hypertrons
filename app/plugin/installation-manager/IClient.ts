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

import { CheckRun } from '../../basic/DataTypes';
import { RepoData } from '../../basic/HostingPlatform/RepoData';

export interface IClient {
  name: string;
  rawClient: any;

  getRepoData(): RepoData;

  getCompConfig<TConfig>(comp: string): TConfig | undefined;

  checkAuth(login: string, command: string): boolean;

  getFileContent(filePath: string): Promise<string | undefined>;

  addIssue(title: string, body: string, labels?: string[]): Promise<void>;

  listLabels(): Promise<Array<{name: string, description: string, color: string}>>;

  updateIssue(number: number, update: {title?: string, body?: string, state?: 'open' | 'closed'}): Promise<void>;

  // addAssignees(number: number, assignees: string[]): Promise<void>;

  addLabels(number: number, labels: string[]): Promise<void>;

  createLabels(labels: Array<{name: string, description: string, color: string}>): Promise<void>;

  updateLabels(labels: Array<{current_name: string, name?: string; description?: string, color?: string}>): Promise<void>;

  createCheckRun(check: CheckRun): Promise<void>;

  runCI(configName: string, pullNumber: number): Promise<void>;
}
