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

import { Issues } from './issues';
import { Pulls } from './pulls';
import { Repos } from './repos';
import { Webhooks } from './webhooks';
import PromiseHandler from '../../ph-manager/promise-handler';

export class GiteeRawClient {

  token: string;
  promiseHandler: PromiseHandler;
  webhooks: Webhooks;
  repos: Repos;
  issues: Issues;
  pulls: Pulls;

  constructor(token: string, promiseHandler: PromiseHandler = new PromiseHandler()) {
    this.token = token;
    this.promiseHandler = promiseHandler;
    this.webhooks = new Webhooks(token, promiseHandler);
    this.repos = new Repos(token, promiseHandler);
    this.issues = new Issues(token, promiseHandler);
    this.pulls = new Pulls(token, promiseHandler);
  }

}
