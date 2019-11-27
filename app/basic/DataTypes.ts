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

export interface Repo {
  // basic
  id: string;
  owner: string;
  ownerInfo: {
      login: string;
      __typename: string;
      name: string;
      bio: string;
      description: string;
      createdAt: Date | null;
      company: string;
      location: string;
      websiteUrl: URL | null;
      repositories: {
          totalCount: number;
      }
      membersWithRole: {
          totalCount: number;
      }
  };
  name: string;
  license: string | null;
  codeOfConduct: string | null;
  createdAt: Date;
  updatedAt: Date;
  pushedAt: Date | null;
  isFork: boolean;
  description: string | null;
  language: string | null;
  // star
  starCount: number;
  stars: UserWithTimeStamp[];
  // watch
  watchCount: number;
  // fork
  forkCount: number;
  directForkCount: number;
  forks: UserWithTimeStamp[];
  // branch
  branchCount: number;
  defaultBranchName: string;
  defaultBranchCommitCount: number;
  // release
  releaseCount: number;
  // issue
  issues: Issue[];
  // pull request
  pulls: PullRequest[];
  // contributors
  contributors: UserWithTimeStampAndEmail[];
}

export interface Issue {
  id: string;
  author: string;
  number: number;
  createdAt: Date;
  updatedAt: Date;
  closedAt: Date | null;
  title: string;
  body: string;
  labels: string[];
  comments: Comment[];
}

export interface PullRequest {
  id: string;
  author: string;
  number: number;
  createdAt: Date;
  updatedAt: Date;
  closedAt: Date | null;
  mergedAt: Date | null;
  title: string;
  body: string;
  labels: string[];
  comments: Comment[];
  reviewComments: Comment[];
  additions: number;
  deletions: number;
}

export interface Comment {
  id: string;
  login: string;
  body: string;
  url: string;
  createdAt: Date;
}

export interface UserWithTimeStamp {
  login: string;
  time: Date;
}

export interface UserWithTimeStampAndEmail {
  login: string;
  email: string;
  time: Date;
}

// reference api docs: https://developer.github.com/v3/checks/runs/#create-a-check-run
export interface CIRunOutput {
  name: string;
  head_sha: string;
  owner: string;
  repo: string;
  started_at?: string; // YYYY-MM-DDTHH:MM:SSZ
  completed_at?: string; // YYYY-MM-DDTHH:MM:SSZ
  details_url?: string;
  external_id?: string;
  output?: CIRunOutputOut;
  status?: 'queued' | 'in_progress' | 'completed';
  conclusion?:
  | 'success'
  | 'failure'
  | 'neutral'
  | 'cancelled'
  | 'timed_out'
  | 'action_required';
}

export interface CIRunOutputOut {
  title: string;
  summary: string;
  text?: string;
  annotations?: CIRunOutputAnnotation[];
}

export interface CIRunOutputAnnotation {
  message: string;
  path: string;
  start_line: number;
  end_line: number;
  annotation_level: 'notice' | 'warning' | 'failure';
  title?: string;
  end_column?: number;
  raw_details?: string;
  start_column?: number;
}
