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

import { Issue, Comment, PullRequest, CheckRun, Push, Review } from '../../basic/DataTypes';
import { luaEvent } from '../../lua-vm/decorators';
import { Command } from '../../basic/HostingPlatform/HostingClientService/CommandService';

export class RepoEventBase {
  installationId: number;
  fullName: string;
}

/**
 * When update a issue
 */
class LuaIssueEvent {
  action: string;
  author: string;
  number: number;
  title: string;
  body: string;
  labels: string[];
}

@luaEvent({
  description: 'Issue events for a repo',
  luaEventType: LuaIssueEvent,
})
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

  public toLuaEvent(e: IssueEvent): LuaIssueEvent | undefined {
    if (!e.issue) return undefined;
    return {
      action: e.action,
      author: e.issue.author,
      number: e.issue.number,
      title: e.issue.title,
      body: e.issue.body,
      labels: e.issue.labels,
    };
  }
}

/**
 * When update a comment
 */
export class CommentUpdateEvent extends RepoEventBase {
  issueNumber: number;
  action: 'created' | 'deleted' | 'edited';
  comment: Comment | undefined;
  isIssue: boolean; // true: issue, false: PR/MR
}

/**
 * When update a label
 */
export class LabelUpdateEvent extends RepoEventBase {
  action: 'created' | 'deleted' | 'edited';
  labelName: string;
  from?: string;
}

/**
 * When update a pull request review
 */
export class ReviewEvent extends RepoEventBase {
  prNumber: number;
  action: 'submitted' | 'dismissed' | 'edited';
  review: Review | undefined;
}

/**
 * When update a pull request comment
 */
export class ReviewCommentEvent extends RepoEventBase {
  prNumber: number;
  action: 'created' | 'deleted' | 'edited';
  comment: Comment | undefined;
}

/**
 * When update a pull request
 */
class LuaPullRequestEvent {
  action: string;
  number: number;
  author: string;
  title: string;
  body: string;
  labels: string[];
}

@luaEvent({
  description: 'Pull request event for a repo',
  luaEventType: LuaPullRequestEvent,
})
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
  public toLuaEvent(e: PullRequestEvent): LuaPullRequestEvent | undefined {
    if (!e.pullRequest) return undefined;
    return {
      action: e.action,
      author: e.pullRequest.author,
      number: e.pullRequest.number,
      title: e.pullRequest.title,
      body: e.pullRequest.body,
      labels: e.pullRequest.labels,
    };
  }
}

/**
 * When Command Manager publish a event
 */

class LuaCommandEvent {
  command: string;
  number: number;
  login: string;
  url: string;
  comment_id: number;
  params: string[];
  from: 'issue' | 'comment' | 'review' | 'review_comment' | 'pull_comment';
}

@luaEvent({
  description: 'Command event for a repo',
  luaEventType: LuaCommandEvent,
  name: 'CommandEvent',
})
export class CommandManagerNewCommandEvent extends RepoEventBase {
  login: string;
  from: 'issue' | 'comment' | 'review' | 'review_comment' | 'pull_comment';
  number: number;
  comment: Comment | undefined;
  issue: Issue | undefined;
  command: Command;
  public toLuaEvent(e: CommandManagerNewCommandEvent): LuaCommandEvent | undefined {
    if (!e.command) return undefined;
    return {
      command: e.command.exec,
      params: e.command.param,
      login: e.login,
      url: e.comment ? e.comment.url : '',
      comment_id: e.comment ? e.comment.id : -1,
      number: e.number,
      from: e.from,
    };
  }
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
