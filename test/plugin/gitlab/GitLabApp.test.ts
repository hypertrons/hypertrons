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
import assert from 'assert';
import { Agent } from 'egg';
import { prepareTestApplication, testClear } from '../../Util';
import { HostingPlatformInitEvent } from '../../../app/basic/HostingPlatform/event';
import { MockApplication } from 'egg-mock';
import { IssueEvent, CommentUpdateEvent, PushEvent, PullRequestEvent } from '../../../app/plugin/event-manager/events';
import { waitUntil } from '../../../app/basic/Utils';

describe('GitLabApp', () => {
  let app: MockApplication;
  let agent: Agent;

  beforeEach(async () => {
    ({ app, agent } = await prepareTestApplication() as any);
  });

  afterEach(async () => {
    testClear(app, agent);
  });

  it('initWebhook test', async () => {
    const gitlab_config = {
      id: 1,
      type: 'gitlab',
      config: {
        webhook: {
          host: 'http://127.0.0.1/',
          path: '/',
          secret: 'secret_test',
          proxy: '',
        },
      },
    } as HostingPlatformInitEvent;

    agent.event.publish('all', HostingPlatformInitEvent, gitlab_config);
    await waitUntil(() => (app.gitlab as any).hpMap.size > 0, { interval: 10 });

    // Issue Hook Test
    app.event.subscribeAll(IssueEvent, async e => {
      assert(e.action === 'closed');
    });

    await app
      .httpRequest()
      .post('/installation/1/')
      .set('x-gitlab-token', 'secret_test')
      .set('x-gitlab-event', 'Issue Hook')
      .send({
        event_type: 'issue',
        project: { path_with_namespace: 'Test' },
        object_attributes: {
          author_id: 69,
          closed_at: '2019-12-05 12:20:53 UTC',
          confidential: false,
          created_at: '2019-11-29 04:55:43 UTC',
          description: '123',
          due_date: null,
          id: 353,
          iid: 1,
          last_edited_at: null,
          last_edited_by_id: null,
          milestone_id: null,
          moved_to_id: null,
          project_id: 220,
          relative_position: 1073742323,
          state: 'closed',
          time_estimate: 0,
          title: 'test issue',
          updated_at: '2019-12-05 12:20:53 UTC',
          updated_by_id: null,
          total_time_spent: 0,
          human_total_time_spent: null,
          human_time_estimate: null,
          assignee_ids: [],
          assignee_id: null,
          labels: [],
          action: 'close',
        },
      })
      .expect(200);

    // Push Hook Test
    app.event.subscribeAll(PushEvent, async e => {
      assert(e.push.commits[0].added.length === 5);
    });
    await app
      .httpRequest()
      .post('/installation/1/')
      .set('x-gitlab-token', 'secret_test')
      .set('x-gitlab-event', 'Push Hook')
      .send({
        ref: 'refs/heads/master',
        project: { path_with_namespace: 'cool-bot/my-awesome-project' },
        commits: [
          {
            id: '97**67b6f70**6b7318',
            message: 'smee is amazing',
            timestamp: '2019-12-05T12:28:52Z',
            url:
              'https://**/cool-bot/my-awesome-project/commit/97**67b6f70**6b7318',
            author: {
              name: 'test',
              email: 'test@qq.com',
            },
            added: [
              'data/closeissue.json',
              'data/newissue.json',
              'data/note-issue.json',
              'data/note-pr.json',
              'data/reopenissue.json',
            ],
            modified: [ 'test.js', 'test.ts' ],
            removed: [ 'README' ],
          },
        ],
      })
      .expect(200);

    // Note Hook Test
    app.event.subscribeAll(CommentUpdateEvent, async e => {
      assert(e.issueNumber === 2246);
    });
    await app
      .httpRequest()
      .post('/installation/1/')
      .set('x-gitlab-token', 'secret_test')
      .set('x-gitlab-event', 'Note Hook')
      .send({
        event_type: 'note',
        project: { path_with_namespace: 'cool-bot/my-awesome-project' },
        object_attributes: {
          attachment: null,
          author_id: 69,
          change_position: null,
          commit_id: null,
          created_at: '2019-12-05 12:25:27 UTC',
          discussion_id: 'e09538356d9091953fd9d7a904c90ea7ae4ef838',
          id: 2246,
          line_code: null,
          note: 'pr comment',
          noteable_id: 61,
          noteable_type: 'MergeRequest',
          original_position: null,
          position: null,
          project_id: 220,
          resolved_at: null,
          resolved_by_id: null,
          resolved_by_push: null,
          st_diff: null,
          system: false,
          type: null,
          updated_at: '2019-12-05 12:25:27 UTC',
          updated_by_id: null,
          description: 'pr comment',
        },
      })
      .expect(200);

    // Merge Request Hook Test
    app.event.subscribeAll(PullRequestEvent, async e => {
      assert(e.action === 'closed');
    });
    await app
      .httpRequest()
      .post('/installation/1/')
      .set('x-gitlab-token', 'secret_test')
      .set('x-gitlab-event', 'Merge Request Hook')
      .send({
        project: { path_with_namespace: 'cool-bot/my-awesome-project' },
        object_attributes: {
          assignee_id: null,
          author_id: 14,
          created_at: '2019-12-03 08:13:34 UTC',
          description: '12/03',
          id: 61,
          iid: 3,
          last_edited_at: null,
          merge_error: null,
          merge_params: {
            force_remove_source_branch: null,
          },
          merge_status: 'cannot_be_merged',
          merge_user_id: null,
          merge_when_pipeline_succeeds: false,
          milestone_id: null,
          source_branch: 'master',
          source_project_id: 221,
          state: 'closed',
          target_branch: 'master',
          target_project_id: 220,
          time_estimate: 0,
          title: 'Master',
          updated_at: '2019-12-05 12:30:12 UTC',
          updated_by_id: null,
          action: 'merge',
        },
        labels: [],
      })
      .expect(200);
  });
});
