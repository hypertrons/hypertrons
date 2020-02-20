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

import { Issue } from '../../../basic/DataTypes';
import { GitlabGraphqlClient } from '../client/GitlabGraphqlClient';

const issue_query = `query issue_query($fullPath: ID!, $issueCount: Int!, $cursor: String, $updatedAfter: Time){
  project(fullPath: $fullPath){
    issues(first: $issueCount, after: $cursor, updatedAfter: $updatedAfter){
      pageInfo{
        endCursor
        hasNextPage
      }
      edges{
        node{
          id: iid
          author{
            username
          }
          createdAt: createdAt
          updatedAt: updatedAt
          closedAt: closedAt
          title: title
          body: description
          labels(first: 5){
            edges{
              node{
                title
              }
            }
          }
          comments: discussions(first: 100){
            edges{
              node{
                notes(first: 100){
                  edges{
                    node{
                      id
                      login: author{
                        username
                      }
                      body
                      createdAt
                      system
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
`;
interface PageInfo {
  hasNextPage: boolean;
  endCursor: string;
}

interface RawIssue {
  id: number; // begin from 1
  author: {
    username: string;
  };
  createdAt: string; // something looks like "2019-11-18T08:12:45Z"
  updatedAt: string;
  closedAt: string | null;
  title: string;
  body: string;
  labels: { edges: Array<{ node: { title: string } }> };
  comments: {
    edges: Array<{
      node: {
        notes: {
          edges: Array<{
            node: {
              id: string;
              login: {
                username: string;
              };
              body: string;
              createdAt: Date;
              system: boolean;
            };
          }>;
        };
      };
    }>;
  };
}

function formatIssue(i: RawIssue, fullPath: string): Issue {
  const mylabels = i.labels.edges.map(x => x.node.title); // sl is short for single label

  const mycomments = i.comments.edges.map(x => {
    const info = x.node.notes.edges[0].node;
    const comment_id = (() => {
      const x = info.id.split('/'); // info.id === gid://gitlab/Note/1763
      return Number(x[x.length - 1]);
    })();
    return {
      id: comment_id,
      login: info.login.username,
      body: info.body,
      url: `${fullPath}/issues/${i.id}#note_${comment_id}`, // Complete url === `$(host)/repo_name/issues/${i.id}#note_${comment_id}`
      createdAt: new Date(info.createdAt),
    };
  });

  return {
    id: i.id,
    author: i.author.username,
    number: i.id, // equal to id
    createdAt: new Date(i.createdAt),
    updatedAt: new Date(i.updatedAt),
    closedAt: i.closedAt ? new Date(i.closedAt) : null,
    title: i.title,
    body: i.body,
    labels: mylabels,
    comments: mycomments,
  };
}

interface PageInfo {
  endCursor: string;
  hasNextPage: boolean;
}

export async function getIssues(client: GitlabGraphqlClient, name: string, icount?: number, updatedAfter?: Date): Promise<Issue[]> {
  let all_issues: Issue[] = [];
  try {
    let pageInfo: PageInfo = { endCursor: '', hasNextPage: true };
    do {
      const res = JSON.parse(
        await client.query(issue_query, {
          fullPath: name,
          issueCount: icount ? icount : 5,
          cursor: pageInfo.endCursor === '' ? null : pageInfo.endCursor,
          updatedAfter: updatedAfter ? updatedAfter : null,
        }),
      );
      const raw_issues = res.data.project.issues;
      pageInfo = raw_issues.pageInfo;
      const part_issues = raw_issues.edges.map(x => formatIssue(x.node, name));
      all_issues = all_issues.concat(part_issues);
    } while (pageInfo.hasNextPage);
  } catch (e) {
    console.log(e);
  }
  return all_issues;
}
