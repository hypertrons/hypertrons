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

import { Repo, PullRequest } from '../../../basic/DataTypes';
import { GitlabGraphqlClient } from '../client/GitlabGraphqlClient';
import { getRepo } from './getRepo';
import { getIssues } from './getIssues';
import { getPullRequests } from './getPullRequests';

export async function getAll(client: GitlabGraphqlClient, fullPath: string): Promise<Repo> {
  const repo = await getRepo(client, fullPath);
  const myissue = getIssues(client, fullPath, 50);
  const mypulls = getPullRequests(client, fullPath, 50);
  const arr = await Promise.all([ myissue, mypulls ]);
  repo.issues = arr[0];
  repo.pulls = arr[1] as PullRequest[]; // weird here
  return repo;
}
