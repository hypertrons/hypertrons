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

import { Issue, Comment, PullRequest } from '../../basic/DataTypes';

/**
 * Client ready
 */
export class ClientReadyEvent {
  installationId: number;
  fullName: string;
}

/**
 * Repo removed
 */
export class RepoRemovedEvent {
  installationId: number;
  fullName: string;
}

/**
 * When a push to a repo
 */
export class RepoPushEvent {
  installationId: number;
  fullName: string;
  ref: string;
  commits: Array<{
    added: string[];
    removed: string[];
    modified: string[];
  }>;
}

/**
 * When a repo's config is updated
 */
export class ConfigManagerConfigLoadedEvent {
  installationId: number;
  fullName: string;
  config: any;
}

export class GitHubWebhooksManagerReadyEvent {
  installationId: number;
}

/**
 * When update a issue
 */
export class IssueEvent {
  installationId: number;
  fullName: string;
  action: string;
  issue: Issue | undefined;
  changes: {};
}

/**
 * When update a comment
 */
export class CommentUpdateEvent {
  installationId: number;
  fullName: string;
  issueNumber: number;
  action: string;
  comment: Comment | undefined;
}

/**
 * When update a label
 */
export class LabelUpdateEvent {
  installationId: number;
  fullName: string;
  action: string;
  labelName: string;
}

/**
 * When update a pull request
 */
export class PullRequestEvent {
  installationId: number;
  fullName: string;
  action: string;
  pullRequest: PullRequest | undefined;
}
