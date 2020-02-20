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

import { PullRequest } from '../../../basic/DataTypes';
import { GitlabGraphqlClient } from '../client/GitlabGraphqlClient';

const pullrequest_query = `query pullrequest_query($fullPath: ID!, $iids_list: [String!])
{
  project(fullPath: $fullPath) {
    mergeRequests(iids: $iids_list){
      edges{
        node{
          id: iid
          createdAt
          updatedAt
          title
          body: description
          comments: notes(first: 100){
            edges{
              node{
                id
                login: author{
                  username
                }
                body
                url: project{
                  webUrl
                }
                createdAt
              }
            }
          }
        }
      }
    }
  }
}
`;

interface RawPullRequest {
  id: number;
  createdAt: string;
  updatedAt: string;
  title: string;
  body: string;
  comments: {
    edges: Array<{
      node: {
        id: string;
        login: {
            username: string;
        }
        body: string;
        url: {
            webUrl: string;
        }
        createdAt: string;
      },
    }>;
  };
}

function formatPullRequest(pr: RawPullRequest): PullRequest {
  const mycomments = pr.comments.edges.map(x => {
    const info = x.node;
    const comment_id = (() => {
      const x = info.id.split('/');
      return Number(x[x.length - 1]);
    })();
    return {
      id: comment_id,
      login: info.login.username,
      body: info.body,
      url: `${info.url.webUrl}/merge_requests/${pr.id}/#note_${comment_id}`,
      createdAt: new Date(info.createdAt),
    };
  });
  return {
    id: pr.id,
    author: '',
    number: pr.id, // equal to id,
    createdAt: new Date(pr.createdAt),
    updatedAt: new Date(pr.updatedAt),
    closedAt: null,
    mergedAt: null,
    title: pr.title,
    body: pr.body,
    labels: [],
    comments: mycomments,
    reviewComments: [],
    additions: 0,
    deletions: 0,
  };
}

export async function getPullRequests(client: GitlabGraphqlClient, name: string, pcount?: number): Promise<PullRequest[]> {
  // fetch 5 pull request each time in default.
  const icount = pcount ? pcount : 5;
  const arr = Array.from(Array(icount + 1).keys()).slice(1);
  let all_prs: PullRequest[] = [];
  let base: number = 0;
  let return_length: number = icount;
  const MAX_TOLERANCE = 3;
  let tolerance = MAX_TOLERANCE; // just in case pr is deleted.
  let tmp = '';
  while (return_length === icount || tolerance > 0) {
    const iids = arr.map(a => (a + base).toString());
    base += icount;
    try {
      tmp = await client.query(pullrequest_query, {
        fullPath: name,
        iids_list: iids,
      });
      const res = JSON.parse(tmp);
      const raw_prs = res.data.project.mergeRequests.edges;
      return_length = raw_prs.length;
      const part_prs = raw_prs.map(x => formatPullRequest(x.node));
      all_prs = all_prs.concat(part_prs);
    } catch (e) {
      console.log(e.message);
      console.log(tmp);
    }
    if (return_length === icount) {
      tolerance = MAX_TOLERANCE;
    } else if (return_length < icount && tolerance === MAX_TOLERANCE) {
      tolerance = MAX_TOLERANCE - 1;
    } else { // return_length < icount && tolerance < MAX_TOLERANCE
      if (return_length === 0) {
        tolerance -= 1;
      } else {
        tolerance = MAX_TOLERANCE - 1;
      }
    }
  }
  return all_prs;
}
