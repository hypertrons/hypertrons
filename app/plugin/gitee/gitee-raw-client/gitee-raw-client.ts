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

import { Issues } from './issues';
import { Pulls } from './pulls';
import { Repos } from './repos';
import { Webhooks } from './webhooks';

export class GiteeRawClient {

  token: string;
  webhooks: Webhooks;
  repos: Repos;
  issues: Issues;
  pulls: Pulls;

  constructor(token: string) {
    this.token = token;
    this.webhooks = new Webhooks(token);
    this.repos = new Repos(token);
    this.issues = new Issues(token);
    this.pulls = new Pulls(token);
  }

}
