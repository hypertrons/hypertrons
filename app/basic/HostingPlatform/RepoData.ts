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

import { Repo, Issue, PullRequest, Comment } from '../DataTypes';

export class RepoData {

  private repoData: Repo;

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
        if (index !== -1) v.labels.splice(index, 1);
      } else if (action === 'edited') {
        const index = v.labels.findIndex(l => l === from);
        if (index !== -1) v.labels[index] = label;
      }
    });
    this.repoData.pulls.forEach(v => {
      if (action === 'deleted') {
        const index = v.labels.findIndex(l => l === label);
        if (index !== -1) v.labels.splice(index, 1);
      } else if (action === 'edited') {
        const index = v.labels.findIndex(l => l === from);
        if (index !== -1) v.labels[index] = label;
      }
    });
  }

  public updateIssue(action: string, issue: Issue): void {
    if (!this.repoData) return;

    if (action === 'opened') {
      this.repoData.issues.push(issue);
    } else {
      const index = this.repoData.issues.findIndex(v => v.id === issue.id);
      if (index !== -1) {
        issue.comments = this.repoData.issues[index].comments;
        this.repoData.issues[index] = issue;
      }
    }
  }

  public updatePull(action: string, pull: PullRequest): void {
    if (!this.repoData) return;
    if (action === 'opened') {
      this.repoData.pulls.push(pull);
    } else {
      const index = this.repoData.pulls.findIndex(v => v.id === pull.id);
      if (index !== -1) {
        pull.comments = this.repoData.pulls[index].comments;
        this.repoData.pulls[index] = pull;
      }
    }
  }

  public updateIssueComment(action: 'created' | 'deleted' | 'edited', issueNumber: number, comment: Comment): void {
    if (!this.repoData) return;

    const issue = this.repoData.issues.find(v => v.number === issueNumber);
    if (!issue) return;

    if (action === 'created') {
      issue.comments.push(comment);
    } else {
      const index = issue.comments.findIndex(v => v.id === comment.id);
      if (index !== -1) {
        if (action === 'deleted') {
          issue.comments.splice(index, 1);
        } else {
          issue.comments[index] = comment;
        }
      }
    }
  }

  public updatePullComment(action: 'created' | 'deleted' | 'edited', pullNumber: number, comment: Comment): void {
    if (!this.repoData) return;

    const pull = this.repoData.pulls.find(v => v.number === pullNumber);
    if (!pull) return;

    if (action === 'created') {
      pull.comments.push(comment);
    } else {
      const index = pull.comments.findIndex(v => v.id === comment.id);
      if (index !== -1) {
        if (action === 'deleted') {
          pull.comments.splice(index, 1);
        } else {
          pull.comments[index] = comment;
        }
      }
    }
  }

}
