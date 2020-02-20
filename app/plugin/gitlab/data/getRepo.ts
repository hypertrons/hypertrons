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

import { Repo } from '../../../basic/DataTypes';
import { GitlabGraphqlClient } from '../client/GitlabGraphqlClient';

const repo_query = `query repo_query($fullPath: ID!){
  project(fullPath: $fullPath){
    id
    name: path
    createdAt
    updatedAt: lastActivityAt
    description
    starCount
    forkCount: forksCount
  }
}
`;

export async function getRepo(client: GitlabGraphqlClient, fullPath: string): Promise<Repo> {
  const res = JSON.parse(await client.query(repo_query, { fullPath })).data.project;
  return {
    id: (() => {
      const x = res.id.split('/');
      return x[x.length - 1];
    })(),
    owner: fullPath.split('/')[0],
    name: res.name,
    license: null,
    codeOfConduct: null,
    createdAt: new Date(res.createdAt),
    updatedAt: new Date(res.updatedAt),
    pushedAt: null,
    isFork: false,
    description: res.description,
    language: null,
    starCount: res.starCount,
    watchCount: 0,
    forkCount: res.forkCount,
    directForkCount: 0,
    branchCount: 1,
    defaultBranchName: 'master',
    defaultBranchCommitCount: 1,
    releaseCount: 0,
    issues: [],
    ownerInfo: {
      login: '',
      __typename: '',
      name: '',
      bio: '',
      description: '',
      createdAt:  null,
      company: '',
      location: '',
      websiteUrl: null,
      repositories: {
        totalCount: 0,
      },
      membersWithRole: {
        totalCount: 0,
      },
    },
    stars: [],
    forks: [],
    pulls: [],
    contributors: [],
  };
}
