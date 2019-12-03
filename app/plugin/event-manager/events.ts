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

import {
  Issue,
  Comment,
  PullRequest,
  CheckRun,
  Push,
} from '../../basic/DataTypes';
import { Command } from '../command-manager/Command';
import { IClient } from '../installation-manager/IClient';

export class RepoEventBase {
  installationId: number;
  fullName: string;
  client?: IClient;
}

/**
 * Repo config loaded
 */
export class RepoConfigLoadedEvent extends RepoEventBase {}

/**
 * Repo added
 */
export class RepoAddedEvent extends RepoEventBase {}

/**
 * Repo removed
 */
export class RepoRemovedEvent extends RepoEventBase {}

/**
 * When a push to a repo
 */
export class RepoPushEvent extends RepoEventBase {
  ref: string;
  commits: Array<{
    added: string[];
    removed: string[];
    modified: string[];
  }>;
}

/**
 * When update a issue
 */
export class IssueEvent extends RepoEventBase {
  action:
    | 'assigned'
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
export class CommentUpdateEvent extends RepoEventBase {
  issueNumber: number;
  action: 'created' | 'deleted' | 'edited';
  comment: Comment | undefined;
}

/**
 * When update a label
 */
export class LabelUpdateEvent extends RepoEventBase {
  action: 'created' | 'deleted' | 'edited';
  labelName: string;
}

/**
 * When update a pull request
 */
export class PullRequestEvent extends RepoEventBase {
  action:
    | 'assigned'
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
 * When Command Manager publish a event
 */
export class CommandManagerNewCommandEvent extends RepoEventBase {
  login: string;
  from: 'issue' | 'comment';
  issueNumber: number;
  comment: Comment | undefined;
  issue: Issue | undefined;
  command: Command;
}

/**
 * Run a CI pipeline
 * Warnning: extend ciName when add new ci platform,
 * for example, 'jenkins' | 'travis-ci'
 */
export class CIRunEvent {
  ciName: 'jenkins';
  ciConfig: any;
  pullRequest: PullRequest;
}

/**
 * When CI pipeline finished
 * Warnning: extend ciName when add new ci platform,
 * for example, 'jenkins' | 'travis-ci'
 */
export class CIRunFinishedEvent extends RepoEventBase {
  ciName: 'jenkins';
  ciRunOutput: CheckRun;
}

/**
 * When receive a push event
 */
export class PushEvent extends RepoEventBase {
  push: Push;
}

/**
 * When check_run updated
 */
export class CheckRunEvent extends RepoEventBase {
  action: 'completed' | 'created' | 'requested_action' | 'rerequested';
  checkRun: CheckRun;
}
