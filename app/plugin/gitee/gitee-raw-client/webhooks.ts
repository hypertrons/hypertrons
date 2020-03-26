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

import fetch from 'node-fetch';
import queryString from 'query-string';
import PromiseHandler from '../../ph-manager/promise-handler';

export class Webhooks {
  token: string;
  promiseHandler: PromiseHandler;

  constructor(token: string, promiseHandler: PromiseHandler = new PromiseHandler()) {
    this.token = token;
    this.promiseHandler = promiseHandler;
  }

  // https://gitee.com/api/v5/swagger#/getV5ReposOwnerRepoHooks
  // list all webhooks
  async all(param: {
    owner: string,
    repo: string,
  }) {
    // GET /v5/repos/{owner}/{repo}/hooks
    const result = await this.promiseHandler.add(async () => await fetch(
      `https://gitee.com/api/v5/repos/${param.owner}/${param.repo}/hooks`,
      { headers: { Authorization: `bearer ${this.token}` } },
    ));
    return await result.json();
  }

  // https://gitee.com/api/v5/swagger#/postV5ReposOwnerRepoHooks
  async addWebhook(param: {
    owner: string,
    repo: string,
    url: string,
  }) {
    // POST /v5/repos/{owner}/{repo}/hooks
    const result = await this.promiseHandler.add(async () => await fetch(
      `https://gitee.com/api/v5/repos/${param.owner}/${param.repo}/hooks`,
      {
        method: 'POST',
        headers: {
          Authorization: `bearer ${this.token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: queryString.stringify({
          ...param,
          push_events: true,
          tag_push_events: true,
          issues_events: true,
          note_events: true,
          merge_requests_events: true,
        }),
      },
    ));
    return await result.json();
  }

}
