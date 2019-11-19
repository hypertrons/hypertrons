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

import { Issue, IssueLabel, Comment, PullRequest } from './DataTypes';
import { WebhookPayloadIssuesIssue, WebhookPayloadIssuesIssueLabelsItem, WebhookPayloadIssueCommentComment, WebhookPayloadPullRequestPullRequest } from '@octokit/webhooks';

export interface DataWrapper {
  issueWrapper(any): any;
  issueLabelWrapper(any): any;
  commentWrapper(any): any;
  pullRequest(any): any;
}

export class GithubWrapper implements DataWrapper {

  public issueWrapper(i: WebhookPayloadIssuesIssue): Issue {
    return {
      id: i.id.toString(),
      author: i.user.login,
      number: i.number,
      createdAt: i.created_at,
      updatedAt: i.updated_at,
      closedAt: i.closed_at,
      title: i.title,
      body: i.body,
      labels: i.labels.map(label => {
        return this.issueLabelWrapper(label);
      }),
      comments: Comment,
    };
  }

  public issueLabelWrapper(label: WebhookPayloadIssuesIssueLabelsItem): IssueLabel {
      return {
        id: label.id,
        name: label.name,
        color: label.color,
        default: label.default,
      };
  }

  public commentWrapper(comment: WebhookPayloadIssueCommentComment): Comment {
    return {
      id: comment.id.toString(),
      login: comment.user.login,
      body : comment.body,
      url : comment.url,
      createdAt : comment.created_at,
    };
  }

  public pullRequest(pullRequest: WebhookPayloadPullRequestPullRequest): PullRequest {
    return {
      id: pullRequest.id.toString(),
      author: pullRequest.user.login,
      number: pullRequest.number,
      createdAt: pullRequest.created_at,
      updatedAt: pullRequest.updated_at,
      closedAt: pullRequest.closed_at,
      mergedAt: pullRequest.merged_at,
      title: pullRequest.title,
      body: pullRequest.body,
      labels: pullRequest.labels.map(label => {
        return this.issueLabelWrapper(label);
      }),
      comments: [ ],
      reviewComments: pullRequest.review_comments,
      additions: 1,
      deletions: 1,
    };
  }

}

export class GitlabWrapper implements DataWrapper {

  public issueWrapper(data: any): any {
    return data;
  }

  public issueLabelWrapper(data: any): any {
    return data;
  }

  public commentWrapper(data: any): any {
    return data;
  }

  public pullRequest(data: any): any {
    return data;
  }

}
