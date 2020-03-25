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

export class Repos {
  token: string;
  promiseHandler: PromiseHandler;

  constructor(token: string, promiseHandler: PromiseHandler = new PromiseHandler()) {
    this.token = token;
    this.promiseHandler = promiseHandler;
  }

  // https://gitee.com/api/v5/swagger#/getV5ReposOwnerRepoContents(Path)
  async getContents(param: {
    owner: string,
    repo: string,
    path: string,
  }) {
    // GET /v5/repos/{owner}/{repo}/contents(/{path})
    const result = await this.promiseHandler.add(async () => await fetch(
      `https://gitee.com/api/v5/repos/${param.owner}/${param.repo}/contents/${param.path}`,
      {
        method: 'GET',
        headers: {
          Authorization: `bearer ${this.token}`,
        },
      },
    ));
    return result.json();
  }

  // https://gitee.com/api/v5/swagger#/getV5UserRepos
  // what if exceed page size?
  // list the repos where bot account is the admin
  async listUserRepos(): Promise<any> {
    const param = {
      visibility: 'all',
      affiliation: 'admin',
      per_page: 100,
    };
    // GET /v5/user/repos
    const result = await this.promiseHandler.add(async () => await fetch(
      `https://gitee.com/api/v5/user/repos?${queryString.stringify(param)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `bearer ${this.token}`,
        },
      },
    ));
    return result.json();
  }

  // https://gitee.com/api/v5/swagger#/getV5ReposOwnerRepo
  async getRepoData(param: {
    owner: string,
    repo: string,
  }) {
    // GET /v5/repos/{owner}/{repo}
    const result = await this.promiseHandler.add(async () => await fetch(
      `https://gitee.com/api/v5/repos/${param.owner}/${param.repo}`,
      {
        method: 'GET',
        headers: {
          Authorization: `bearer ${this.token}`,
        },
      },
    ));
    return result.json();
  }

  // https://gitee.com/api/v5/swagger#/getV5ReposOwnerRepoContributors
  async getContributors(param: {
    owner: string,
    repo: string,
  }) {
    // GET /v5/repos/{owner}/{repo}/contributors
    const result = await this.promiseHandler.add(async () => await fetch(
      `https://gitee.com/api/v5/repos/${param.owner}/${param.repo}/contributors`,
      {
        method: 'GET',
        headers: {
          Authorization: `bearer ${this.token}`,
        },
      },
    ));
    return result.json();
  }

  // https://gitee.com/api/v5/swagger#/getV5ReposOwnerRepoForks
  async getForks(param: {
    owner: string,
    repo: string,
  }) {
    // GET /v5/repos/{owner}/{repo}/forks
    const result = await this.promiseHandler.add(async () => await fetch(
      `https://gitee.com/api/v5/repos/${param.owner}/${param.repo}/forks`,
      {
        method: 'GET',
        headers: {
          Authorization: `bearer ${this.token}`,
        },
      },
    ));
    return result.json();
  }

}
