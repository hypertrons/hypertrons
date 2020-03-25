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
import { encodeURL } from '../util';
import PromiseHandler from '../../ph-manager/promise-handler';

export class Issues {
  token: string;
  promiseHandler: PromiseHandler;

  constructor(token: string, promiseHandler: PromiseHandler = new PromiseHandler()) {
    this.token = token;
    this.promiseHandler = promiseHandler;
  }

  // https://gitee.com/api/v5/swagger#/getV5ReposOwnerRepoIssues
  async all(param: {
    owner: string,
    repo: string,
  }) {
    // GET /v5/repos/{owner}/{repo}/issues
    const result = await this.promiseHandler.add(async () => await fetch(
      `https://gitee.com/api/v5/repos/${param.owner}/${param.repo}/issues`,
      { headers: { Authorization: `bearer ${this.token}` } },
    ));
    return await result.json();
  }

  // https://gitee.com/api/v5/swagger#/getV5ReposOwnerRepoIssuesComments
  async allComments(param: {
    owner: string,
    repo: string,
  }) {
    // GET /v5/repos/{owner}/{repo}/issues/comments
    const result1 = await this.promiseHandler.add(async () => await fetch(
      `https://gitee.com/api/v5/repos/${param.owner}/${param.repo}/issues/comments?${queryString.stringify({
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
          `https://gitee.com/api/v5/repos/${param.owner}/${param.repo}/issues/comments?${queryString.stringify({
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

  // https://gitee.com/api/v5/swagger#/postV5ReposOwnerIssues
  async create(param: {
    owner: string,
    repo: string,
    title: string,
    body: string,
    labels?: string[],
  }) {
    // POST /v5/repos/{owner}/issues
    const result = await this.promiseHandler.add(async () => await fetch(
      `https://gitee.com/api/v5/repos/${param.owner}/issues`,
      {
        method: 'POST',
        headers: {
          Authorization: `bearer ${this.token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: queryString.stringify({
          ...param,
          labels: param.labels?.join(','),
        }),
      },
    ));
    return await result.json();
  }

  // https://gitee.com/api/v5/swagger#/getV5ReposOwnerRepoIssuesNumber
  async select(param: {
    owner: string,
    repo: string,
    number: string,
  }) {
    // GET /v5/repos/{owner}/{repo}/issues/{number}
    const result = await this.promiseHandler.add(async () => await fetch(
      `https://gitee.com/api/v5/repos/${param.owner}/${param.repo}/issues/${param.number}`,
      { headers: { Authorization: `bearer ${this.token}` } },
    ));
    return await result.json();
  }

  // https://gitee.com/api/v5/swagger#/patchV5ReposOwnerIssuesNumber
  async update(param: {
    owner: string,
    repo: string,
    number: string,
    title?: string,
    body?: string,
    state?: string,
    assignee?: string,
  }) {
    // PATCH /v5/repos/{owner}/issues/{number}
    /**
     * Because some unknown magical reasons, gitee will clear all labels
     * if you do not provide them again when update issue. While other
     * attributes will be keep completely. Thus we have to select the issue
     * before update it.
     */
    // select part, to get labels
    const issue = await this.select(param);
    const labelsName = issue.labels.map(l => {
      return l.name;
    });
    const labels = labelsName.join(',');
    // update part
    const result = await this.promiseHandler.add(async () => await fetch(
      `https://gitee.com/api/v5/repos/${param.owner}/issues/${param.number}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `bearer ${this.token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: queryString.stringify({
          labels,
          ...param,
        }),
      },
    ));
    return await result.json();
  }

  // https://gitee.com/api/v5/swagger#/postV5ReposOwnerRepoIssuesNumberComments
  async createComment(param: {
    owner: string,
    repo: string,
    number: string,
    body: string,
  }) {
    // POST /v5/repos/{owner}/{repo}/issues/{number}/comments
    const result = await this.promiseHandler.add(async () => await fetch(
      `https://gitee.com/api/v5/repos/${param.owner}/${param.repo}/issues/${param.number}/comments`,
      {
        method: 'POST',
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

  // https://gitee.com/api/v5/swagger#/getV5ReposOwnerRepoLabels
  async listLabelsForRepo(param: {
    owner: string,
    repo: string,
  }) {
    // GET /v5/repos/{owner}/{repo}/labels
    const result = await this.promiseHandler.add(async () => await fetch(
      `https://gitee.com/api/v5/repos/${param.owner}/${param.repo}/labels`,
      {
        method: 'GET',
        headers: { Authorization: `bearer ${this.token}` },
      },
    ));
    return await result.json();
  }

  // https://gitee.com/api/v5/swagger#/postV5ReposOwnerRepoIssuesNumberLabels
  async addLabel(param: {
    owner: string,
    repo: string,
    number: string,
    labels: string[],
  }) {
    // POST /v5/repos/{owner}/{repo}/issues/{number}/labels
    const result = await this.promiseHandler.add(async () => await fetch(
      `https://gitee.com/api/v5/repos/${param.owner}/${param.repo}/issues/${param.number}/labels`,
      {
        method: 'POST',
        headers: { Authorization: `bearer ${this.token}` },
        body: JSON.stringify(
          param.labels,
        ),
      },
    ));
    return await result.json();
  }

  // https://gitee.com/api/v5/swagger#/postV5ReposOwnerRepoLabels
  // gitee's label has no description
  async createLabel(param: {
    owner: string,
    repo: string,
    name: string,
    color: string,
  }) {
    // POST /v5/repos/{owner}/{repo}/labels
    const result = await this.promiseHandler.add(async () => await fetch(
      `https://gitee.com/api/v5/repos/${param.owner}/${param.repo}/labels`,
      {
        method: 'POST',
        headers: {
          Authorization: `bearer ${this.token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: queryString.stringify({
          ...param,
        }),
      },
    ));
    return result.json();
  }

  // https://gitee.com/api/v5/swagger#/patchV5ReposOwnerRepoLabelsOriginalName
  // gitee's label has no description
  async updateLabel(param: {
    owner: string,
    repo: string,
    current_name: string,
    name?: string,
    color?: string,
  }) {
    // PATCH /v5/repos/{owner}/{repo}/labels/{original_name}
    const result = await this.promiseHandler.add(async () => await fetch(
      `https://gitee.com/api/v5/repos/${param.owner}/${param.repo}/labels/${encodeURL(param.current_name)}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `bearer ${this.token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: queryString.stringify({
          name: param.name,
          color: param.color,
        }),
      },
    ));
    return result.json();
  }

}
