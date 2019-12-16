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

import { Application } from 'egg';
import { AppPluginBase } from '../../basic/AppPluginBase';
import { PullRequestEvent, LabelUpdateEvent, CommentUpdateEvent, IssueEvent } from '../event-manager/events';

export class AppDataManager extends AppPluginBase<null> {

  constructor(config: null, app: Application) {
    super(config, app);
  }

  public async onReady(): Promise<void> {

    this.app.event.subscribeAll(PullRequestEvent, async e => {
      if (!e.client || !e.pullRequest) return;
      e.client.repoData.updatePull(e.action, e.pullRequest);
    });

    this.app.event.subscribeAll(LabelUpdateEvent, async e => {
      if (!e.client || !e.labelName) return;
      e.client.repoData.updateLabel(e.action, e.labelName, e.from);
    });

    this.app.event.subscribeAll(CommentUpdateEvent, async e => {
      if (!e.client || !e.comment) return;

      if (e.isIssue === true) {
        e.client.repoData.updateIssueComment(e.action, e.issueNumber, e.comment);
      } else {
        e.client.repoData.updatePullComment(e.action, e.issueNumber, e.comment);
      }

    });

    this.app.event.subscribeAll(IssueEvent, async e => {
      if (!e.client || !e.issue) return;
      e.client.repoData.updateIssue(e.action, e.issue);
    });

  }

  public async onStart(): Promise<void> { }

  public async onClose(): Promise<void> { }

}
