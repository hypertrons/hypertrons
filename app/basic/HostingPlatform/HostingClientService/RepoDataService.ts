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

import { Repo, Issue, PullRequest, Comment } from '../../DataTypes';
import { HostingConfigBase } from '../HostingConfigBase';
import { HostingClientBase } from '../HostingClientBase';
import { PullRequestEvent, LabelUpdateEvent, CommentUpdateEvent, IssueEvent } from '../../../plugin/event-manager/events';
import { HostingClientRepoDataInitedEvent } from '../event';
import { ClientServiceBase } from './ClientServiceBase';
import { Application } from 'egg';

export class RepoDataService<TConfig extends HostingConfigBase, TRawClient> extends ClientServiceBase<TConfig, TRawClient> {

  private repoData: Repo;

  constructor(app: Application, client: HostingClientBase<TConfig, TRawClient>) {
    super(app, client, 'repoData');
  }

  public async onStart(): Promise<any> {
    this.client.eventManager.subscribeAll(PullRequestEvent, async e => {
      if (e.pullRequest) this.updatePull(e.action, e.pullRequest);
    });
    this.client.eventManager.subscribeAll(LabelUpdateEvent, async e => {
      if (e.labelName) this.updateLabel(e.action, e.labelName, e.from);
    });
    this.client.eventManager.subscribeAll(CommentUpdateEvent, async e => {
      if (!e.comment) return;
      if (e.isIssue === true) {
        this.updateIssueComment(e.action, e.issueNumber, e.comment);
      } else {
        this.updatePullComment(e.action, e.issueNumber, e.comment);
      }
    });
    this.client.eventManager.subscribeAll(IssueEvent, async e => {
      if (e.issue) this.updateIssue(e.action, e.issue);
    });
    this.client.eventManager.subscribeAll(HostingClientRepoDataInitedEvent, async e => {
      this.repoData = e.repoData;
    });
  }

  public async onDispose(): Promise<any> { }

  public async onConfigLoaded(): Promise<any> { }

  public async syncData(): Promise<any> {
    await this.syncRepoData();
    // this/p
   }

  public async syncRepoData() {
    this.client.eventManager.publish('all', HostingClientRepoDataInitedEvent, {
      id: this.client.getHostId(),
      fullName: this.client.getFullName(),
      repoData: this.repoData,
    });
  }

  public getRepoData(): Repo {
    return this.repoData;
  }

  public setRepoData(repoData: Repo): void {
    this.repoData = repoData;
  }

  public updateLabel(action: 'created' | 'deleted' | 'edited', label: string, from?: string): void {
    if (!this.repoData) return;

    this.repoData.issues.forEach(v => {
      if (action === 'deleted') {
        const index = v.labels.findIndex(l => l === label);
        if (index === -1) return;
        v.labels.splice(index, 1);
      } else if (action === 'edited') {
        const index = v.labels.findIndex(l => l === from);
        if (index === -1) return;
        v.labels[index] = label;
      }
    });
    this.repoData.pulls.forEach(v => {
      if (action === 'deleted') {
        const index = v.labels.findIndex(l => l === label);
        if (index === -1) return;
        v.labels.splice(index, 1);
      } else if (action === 'edited') {
        const index = v.labels.findIndex(l => l === from);
        if (index === -1) return;
        v.labels[index] = label;
      }
    });
    this.syncRepoData();
  }

  public updateIssue(action: string, issue: Issue): void {
    if (!this.repoData) return;

    if (action === 'opened') {
      this.repoData.issues.push(issue);
    } else {
      const index = this.repoData.issues.findIndex(v => v.id === issue.id);
      if (index === -1) return;
      issue.comments = this.repoData.issues[index].comments;
      this.repoData.issues[index] = issue;
    }
    this.syncRepoData();
  }

  public updatePull(action: string, pull: PullRequest): void {
    if (!this.repoData) return;
    if (action === 'opened') {
      this.repoData.pulls.push(pull);
    } else {
      const index = this.repoData.pulls.findIndex(v => v.id === pull.id);
      if (index === -1) return;
      pull.comments = this.repoData.pulls[index].comments;
      this.repoData.pulls[index] = pull;
    }
    this.syncRepoData();
  }

  public updateIssueComment(action: 'created' | 'deleted' | 'edited', issueNumber: number, comment: Comment): void {
    if (!this.repoData) return;

    const issue = this.repoData.issues.find(v => v.number === issueNumber);
    if (!issue) return;

    if (action === 'created') {
      issue.comments.push(comment);
    } else {
      const index = issue.comments.findIndex(v => v.id === comment.id);
      if (index === -1) return;
      if (action === 'deleted') {
        issue.comments.splice(index, 1);
      } else {
        issue.comments[index] = comment;
      }
    }
    this.syncRepoData();
  }

  public updatePullComment(action: 'created' | 'deleted' | 'edited', pullNumber: number, comment: Comment): void {
    if (!this.repoData) return;

    const pull = this.repoData.pulls.find(v => v.number === pullNumber);
    if (!pull) return;

    if (action === 'created') {
      pull.comments.push(comment);
    } else {
      const index = pull.comments.findIndex(v => v.id === comment.id);
      if (index === -1) return;
      if (action === 'deleted') {
        pull.comments.splice(index, 1);
      } else {
        pull.comments[index] = comment;
      }
    }
    this.syncRepoData();
  }

}
