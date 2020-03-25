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

export class Pulls {
  token: string;
  promiseHandler: PromiseHandler;

  constructor(token: string, promiseHandler: PromiseHandler = new PromiseHandler()) {
    this.token = token;
    this.promiseHandler = promiseHandler;
  }

  // https://gitee.com/api/v5/swagger#/getV5ReposOwnerRepoPulls
  async all(param: {
    owner: string,
    repo: string,
  }) {
    // GET /v5/repos/{owner}/{repo}/pulls
    const result = await this.promiseHandler.add(async () => await fetch(
      `https://gitee.com/api/v5/repos/${param.owner}/${param.repo}/pulls`,
      { headers: { Authorization: `bearer ${this.token}` } },
    ));
    return await result.json();
  }

  // https://gitee.com/api/v5/swagger#/getV5ReposOwnerRepoPullsComments
  async allComments(param: {
    owner: string,
    repo: string,
  }) {
    // GET /v5/repos/{owner}/{repo}/pulls/comments
    const result1 = await this.promiseHandler.add(async () => await fetch(
      `https://gitee.com/api/v5/repos/${param.owner}/${param.repo}/pulls/comments?${queryString.stringify({
        page: 1,
        per_page: 100,
      })}`,
      {
        method: 'GET',
        headers: { Authorization: `bearer ${this.token}` },
      },
    ));
    let comments: any[] = await result1.json();
    const pageCount = parseInt(result1.headers.get('total_page') as any);
    if (pageCount > 1) {
      const requestList: any[] = [];
      // push all request into an array
      for (let index = 2; index <= pageCount; index++) {
        requestList.push(this.promiseHandler.add(async () => fetch(
          `https://gitee.com/api/v5/repos/${param.owner}/${param.repo}/pulls/comments?${queryString.stringify({
            page: index,
            per_page: 100,
          })}`,
          {
            method: 'GET',
            headers: { Authorization: `bearer ${this.token}` },
          },
        )));
      }
      // wait for those request receive response
      const responseList = await Promise.all(requestList);
      const commentsList = await Promise.all(responseList.map(r => r.json()));
      // concat comments
      commentsList.map(r => {
        comments = comments.concat(r);
      });
    }
    return comments;
  }

  // https://gitee.com/api/v5/swagger#/patchV5ReposOwnerRepoPullsNumber
  async update(param: {
    owner: string,
    repo: string,
    number: number,
    title?: string,
    body?: string,
    state?: any,
  }) {
    // PATCH /v5/repos/{owner}/{repo}/pulls/{number}
    const result = await this.promiseHandler.add(async () => await fetch(
      `https://gitee.com/api/v5/repos/${param.owner}/${param.repo}/pulls/${param.number}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `bearer ${this.token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: queryString.stringify({
          ...param,
        }),
      },
    ));
    return await result.json();
  }

  // https://gitee.com/api/v5/swagger#/putV5ReposOwnerRepoPullsNumberMerge
  async merge(param: {
    owner: string,
    repo: string,
    number: number,
    merge_method?: string,
  }) {
    // PUT /v5/repos/{owner}/{repo}/pulls/{number}/merge
    const result = await this.promiseHandler.add(async () => await fetch(
      `https://gitee.com/api/v5/repos/${param.owner}/${param.repo}/pulls/${param.number}/merge`,
      {
        method: 'PUT',
        headers: {
          Authorization: `bearer ${this.token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: queryString.stringify({
          ...param,
        }),
      },
    ));
    return await result.json();
  }

  // https://gitee.com/api/v5/swagger#/putV5ReposOwnerRepoPullsNumberLabels
  async addLabel(param: {
    owner: string,
    repo: string,
    number: number,
    labels: string[],
  }) {
    // PUT /v5/repos/{owner}/{repo}/pulls/{number}/labels
    const result = await fetch(
      `https://gitee.com/api/v5/repos/${param.owner}/${param.repo}/pulls/${param.number}/labels`,
      {
        method: 'PUT',
        headers: {
          Authorization: `bearer ${this.token}`,
        },
        body: JSON.stringify(param.labels),
      },
    );
    return await result.json();
  }

}
