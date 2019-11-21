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
import { Command } from '../command-manager/Command';

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
  action: 'assigned'
          | 'closed'
          | 'deleted'
          | 'demilestoned'
          | 'edited'
          | 'labeled'
          | 'locked'
          | 'milestoned'
          | 'opened'
          | 'pinned'
          | 'reopened'
          | 'transferred'
          | 'unassigned'
          | 'unlabeled'
          | 'unlocked'
          | 'unpinned';
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
  action: 'created' | 'deleted' | 'edited';
  comment: Comment | undefined;
}

/**
 * When update a label
 */
export class LabelUpdateEvent {
  installationId: number;
  fullName: string;
  action: 'created' | 'deleted' | 'edited';
  labelName: string;
}

/**
 * When update a pull request
 */
export class PullRequestEvent {
  installationId: number;
  fullName: string;
  action: 'assigned'
          | 'closed'
          | 'edited'
          | 'labeled'
          | 'locked'
          | 'opened'
          | 'ready_for_review'
          | 'reopened'
          | 'review_request_removed'
          | 'review_requested'
          | 'unassigned'
          | 'unlabeled'
          | 'unlocked'
          | 'synchronize';
  pullRequest: PullRequest | undefined;
}

/**
 * When GitHub Data loaded
 */
export class GitHubManagerDataLoadedEvent {
  installationId: number;
  fullName: string;
}

/**
 * When Command Manager publish a event
 */
export class CommandManagerNewCommandEvent {
  installationId: number;
  fullName: string;
  from: 'issue' | 'comment';
  comment: Comment | undefined;
  issue: Issue | undefined;
  command: Command;
}
