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

'use strict';

import assert, { deepEqual } from 'assert';
import { Application, Agent } from 'egg';
import { prepareTestApplication, testClear } from '../../Util';
import { GithubWrapper } from '../../../app/basic/DataWrapper';
import { PayloadRepository, WebhookPayloadPush, WebhookPayloadIssuesIssue, WebhookPayloadPullRequestPullRequest, WebhookPayloadIssueCommentComment } from '@octokit/webhooks';
import { Push, Repo, PullRequest } from '../../../app/basic/DataTypes';

describe('GithubWrapper', () => {
  let app: Application;
  let agent: Agent;

  const date = '2019-12-13T06:24:23.000Z';

  const githubWrapper: GithubWrapper = new GithubWrapper();

  const githubRepo: PayloadRepository = {
    id: 0,
    node_id: '',
    name: '',
    full_name: '',
    private: false,
    owner: {
      login: '',
      id: 0,
      node_id: '',
      avatar_url: '',
      gravatar_id: '',
      url: '',
      html_url: '',
      followers_url: '',
      following_url: '',
      gists_url: '',
      starred_url: '',
      subscriptions_url: '',
      organizations_url: '',
      repos_url: '',
      events_url: '',
      received_events_url: '',
      type: '',
      site_admin: false,
      name: 'name',
      email: '',
    },
    html_url: '',
    description: null,
    fork: false,
    url: '',
    forks_url: '',
    keys_url: '',
    collaborators_url: '',
    teams_url: '',
    hooks_url: '',
    issue_events_url: '',
    events_url: '',
    assignees_url: '',
    branches_url: '',
    tags_url: '',
    blobs_url: '',
    git_tags_url: '',
    git_refs_url: '',
    trees_url: '',
    statuses_url: '',
    languages_url: '',
    stargazers_url: '',
    contributors_url: '',
    subscribers_url: '',
    subscription_url: '',
    commits_url: '',
    git_commits_url: '',
    comments_url: '',
    issue_comment_url: '',
    contents_url: '',
    compare_url: '',
    merges_url: '',
    archive_url: '',
    downloads_url: '',
    issues_url: '',
    pulls_url: '',
    milestones_url: '',
    notifications_url: '',
    labels_url: '',
    releases_url: '',
    deployments_url: '',
    created_at: date,
    updated_at: date,
    pushed_at: '',
    git_url: '',
    ssh_url: '',
    clone_url: '',
    svn_url: '',
    homepage: null,
    size: 0,
    stargazers_count: 0,
    watchers_count: 0,
    language: '',
    has_issues: false,
    has_projects: false,
    has_downloads: false,
    has_wiki: false,
    has_pages: false,
    forks_count: 0,
    mirror_url: null,
    archived: false,
    disabled: false,
    open_issues_count: 0,
    license: null,
    forks: 0,
    open_issues: 0,
    watchers: 0,
    default_branch: '',
    stargazers: 0,
    master_branch: '',
    permissions: {} as any,
  };

  const myRepo: Repo = {
    id: 0,
    owner: '',
    ownerInfo: {
      login: '',
      __typename: '',
      name: 'name',
      bio: '',
      description: '',
      createdAt: null,
      company: '',
      location: '',
      websiteUrl: null,
      repositories: { totalCount: 0 },
      membersWithRole: { totalCount: 0 },
    },
    name: '',
    license: null,
    codeOfConduct: null,
    createdAt: new Date(date),
    updatedAt: new Date(date),
    pushedAt: null,
    isFork: false,
    description: null,
    language: '',
    starCount: 0,
    stars: [],
    watchCount: 0,
    forkCount: 0,
    directForkCount: 0,
    forks: [],
    branchCount: 0,
    defaultBranchName: '',
    defaultBranchCommitCount: 0,
    releaseCount: 0,
    issues: [],
    pulls: [],
    contributors: [],

  };

  const githubIssue: WebhookPayloadIssuesIssue = {
    url: '',
    repository_url: '',
    labels_url: '',
    comments_url: '',
    events_url: '',
    html_url: '',
    id: 0,
    node_id: '',
    number: 0,
    title: '',
    user: {
      login: '',
      id: 0,
      node_id: '',
      avatar_url: '',
      gravatar_id: '',
      url: '',
      html_url: '',
      followers_url: '',
      following_url: '',
      gists_url: '',
      starred_url: '',
      subscriptions_url: '',
      organizations_url: '',
      repos_url: '',
      events_url: '',
      received_events_url: '',
      type: '',
      site_admin: false,
    },
    labels: [
      {
        id: 0,
        node_id: '',
        url: '',
        name: 'l1',
        color: 'red',
        default: false,
      },
      {
        id: 2,
        node_id: '',
        url: '',
        name: 'l2',
        color: 'black',
        default: false,
      },
    ],
    state: '',
    locked: false,
    assignee: {} as any,
    assignees: [],
    milestone: {} as any,
    comments: 0,
    created_at: date,
    updated_at: date,
    closed_at: null,
    author_association: '',
    body: '',
  };

  const myIssue = {
    id: 0,
    author: '',
    number: 0,
    createdAt: new Date(date),
    updatedAt: new Date(date),
    closedAt: null,
    title: '',
    body: '',
    labels: [ 'l1', 'l2' ],
    comments: [],
  };

  const githubComment: WebhookPayloadIssueCommentComment = {
    url: '',
    html_url: '',
    issue_url: '',
    id: 0,
    node_id: '',
    user: {
      login: '',
      id: 0,
      node_id: '',
      avatar_url: '',
      gravatar_id: '',
      url: '',
      html_url: '',
      followers_url: '',
      following_url: '',
      gists_url: '',
      starred_url: '',
      subscriptions_url: '',
      organizations_url: '',
      repos_url: '',
      events_url: '',
      received_events_url: '',
      type: '',
      site_admin: false,
    },
    created_at: date,
    updated_at: date,
    author_association: '',
    body: '',
  };

  const myComment = {
    id: 0,
    login: '',
    body: '',
    url: '',
    createdAt: new Date(date),
  };

  const githubPull: WebhookPayloadPullRequestPullRequest = {
    url: '',
    id: 0,
    node_id: '',
    html_url: '',
    diff_url: '',
    patch_url: '',
    issue_url: '',
    number: 0,
    state: '',
    locked: false,
    title: '',
    user: {
      login: '',
      id: 0,
      node_id: '',
      avatar_url: '',
      gravatar_id: '',
      url: '',
      html_url: '',
      followers_url: '',
      following_url: '',
      gists_url: '',
      starred_url: '',
      subscriptions_url: '',
      organizations_url: '',
      repos_url: '',
      events_url: '',
      received_events_url: '',
      type: '',
      site_admin: false,
    },
    body: '',
    created_at: date,
    updated_at: date,
    closed_at: null,
    merged_at: null,
    merge_commit_sha: null,
    assignee: null,
    assignees: [],
    requested_reviewers: [],
    requested_teams: [],
    labels: [{ name: 'l1' }, { name: 'l2' }],
    milestone: null,
    commits_url: '',
    review_comments_url: '',
    review_comment_url: '',
    comments_url: '',
    statuses_url: '',
    head: null as any,
    base: null as any,
    _links: null as any,
    author_association: '',
    draft: false,
    merged: false,
    mergeable: null,
    rebaseable: null,
    mergeable_state: '',
    merged_by: null,
    comments: 0,
    review_comments: 0,
    maintainer_can_modify: false,
    commits: 0,
    additions: 0,
    deletions: 0,
    changed_files: 0,
  };

  const myPull: PullRequest = {
    id: 0,
    author: '',
    number: 0,
    createdAt: new Date(date),
    updatedAt: new Date(date),
    closedAt: null,
    mergedAt: null,
    title: '',
    body: '',
    labels: [ 'l1', 'l2' ],
    comments: [],
    reviewComments: [],
    additions: 0,
    deletions: 0,
  };

  const githubPush: WebhookPayloadPush = {
    ref: '',
    before: '',
    after: '',
    created: false,
    deleted: false,
    forced: false,
    base_ref: null,
    compare: '',
    commits: [],
    head_commit: null,
    repository: githubRepo,
    pusher: {
      name: '',
      email: '',
    } as any,
    sender: null as any,
  };

  const myPush: Push = {
    ref: '',
    before: '',
    after: '',
    created: false,
    deleted: false,
    forced: false,
    base_ref: null,
    compare: '',
    commits: [],
    head_commit: null,
    repository: myRepo,
    pusher: { name: '', email: '' },
  };

  beforeEach(async () => {
    ({ app, agent } = await prepareTestApplication());
  });
  afterEach(() => {
    testClear(app, agent);
  });

  describe('actionWrapper', () => {
    it('always return the value passed in', async () => {
      const action = '';
      const res = githubWrapper.actionWrapper(action);
      assert(res === action);
    });

    it('always return the value passed in', async () => {
      const action = 'created';
      const res = githubWrapper.actionWrapper(action);
      assert(res === action);
      deepEqual({}, {});
    });

    it('always return the value passed in', async () => {
      const action = undefined;
      const res = githubWrapper.actionWrapper(action);
      assert(res === action);
    });
  });

  describe('repoWrapper', () => {
    it('should return undefined if the param is incurrect', async () => {
      const test = {
        ...githubRepo,
        owner: undefined as any,
      };
      const res = githubWrapper.repoWrapper(test);
      assert(res === undefined);
    });

    it('repo.owner.name="" if repo.owner.name is empty', async () => {
      const name = githubRepo.owner.name;
      githubRepo.owner.name = undefined;
      const res = githubWrapper.repoWrapper(githubRepo);

      if (res) {
        assert(res.ownerInfo.name === '');
      } else {
        assert(false);
      }
      githubRepo.owner.name = name;
    });

    it('right case', async () => {
      const res = githubWrapper.repoWrapper(githubRepo);
      deepEqual(myRepo, res);
    });
  });

  describe('issueWrapper', () => {
    it('should return undefined if the param is incurrect', async () => {
      const test = {
        ...githubIssue,
        user: null as any,
      };
      const res = githubWrapper.issueWrapper(test);
      assert(res === undefined);
    });

    it('right case', async () => {
      const res = githubWrapper.issueWrapper(githubIssue);
      deepEqual(myIssue, res);
    });
  });

  describe('commentWrapper', () => {
    it('should return undefined if the param is incurrect', async () => {
      const test = {
        ...githubComment,
        user: undefined as any,
      };
      const res = githubWrapper.commentWrapper(test);
      assert(res === undefined);
    });

    it('right case', async () => {
      const res = githubWrapper.commentWrapper(githubComment);
      deepEqual(myComment, res);
    });
  });

  describe('pullRequestWrapper', () => {
    it('should return undefined if the param is incurrect', async () => {
      const test = {
        ...githubPull,
        user: undefined as any,
      };
      const res = githubWrapper.pullRequestWrapper(test);
      assert(res === undefined);
    });

    it('right case', async () => {
      const res = githubWrapper.pullRequestWrapper(githubPull);
      deepEqual(myPull, res);
    });
  });

  describe('pushWrapper', () => {
    it('push.repository should be undefined', async () => {
      const push = {
        ...myPush,
        repository: undefined,
      };
      const res = githubWrapper.pushWrapper({
        ...githubPush,
        repository: undefined as any,
      });
      deepEqual(push, res);
    });

    it('push.repository should be right', async () => {
      const res = githubWrapper.pushWrapper(githubPush);
      deepEqual(myPush, res);
    });
  });
});
