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

import * as SlackHelper from '../../../../../app/basic/helper/weekly-report/slack-helper';
import assert from 'power-assert';
import { SectionBlock } from '@slack/types';

describe('Utils', () => {
  describe('generateSlackWeeklyReport', () => {

    it('pass null value', async () => {
      const res = SlackHelper.generateSlackWeeklyReport(
        null as any,
        null as any,
        null as any,
        null as any, null as any,
        null as any,
        null as any,
        null as any,
      );
      assert(res.blocks !== undefined);
      if (res.blocks) {
        assert(res.blocks.length === 18);
      }
    });

    it('pass undefined value', async () => {
      const res = SlackHelper.generateSlackWeeklyReport(
        undefined as any,
        undefined as any,
        undefined as any,
        undefined as any, undefined as any,
        undefined as any,
        undefined as any,
        undefined as any,
      );
      assert(res.blocks !== undefined);
      if (res.blocks) {
      assert(res.blocks.length === 18);
      }
    });

    it('pass currect type', async () => {
      const basicDataTable: Map<string, string> = new Map<string, string>();
      const issueAndPRsTable: Map<string, string> = new Map<string, string>();
      const prsTable: Map<string, string> = new Map<string, string>();
      const codeReviewTable: Map<string, string> = new Map<string, string>();
      const contributors: string[] = [];
      const res = SlackHelper.generateSlackWeeklyReport(
        '',
        basicDataTable,
        issueAndPRsTable,
        prsTable, 10,
        codeReviewTable,
        contributors,
        '',
      );
      assert(res.blocks !== undefined);
      if (res.blocks) {
      assert(res.blocks.length === 18);
      }
    });

    it('pass currect value', async () => {
      const basicDataTable: Map<string, string> = new Map<string, string>();
      const issueAndPRsTable: Map<string, string> = new Map<string, string>();
      const prsTable: Map<string, string> = new Map<string, string>();
      const codeReviewTable: Map<string, string> = new Map<string, string>();
      const contributors: string[] = [];
      basicDataTable.set('a', 'a');
      issueAndPRsTable.set('a', 'a');
      prsTable.set('a', 'a');
      codeReviewTable.set('a', 'a');
      contributors.push('a');
      const res = SlackHelper.generateSlackWeeklyReport(
        '',
        basicDataTable,
        issueAndPRsTable,
        prsTable, 10,
        codeReviewTable,
        contributors,
        '',
      );
      assert(res.blocks !== undefined);
      if (res.blocks) {
        assert(res.blocks.length === 24);
      }
    });

    it('pass currect value, count value number', async () => {

      const basicDataTable: Map<string, string> = new Map<string, string>();
      const issueAndPRsTable: Map<string, string> = new Map<string, string>();
      const prsTable: Map<string, string> = new Map<string, string>();
      const codeReviewTable: Map<string, string> = new Map<string, string>();
      const contributors: string[] = [];

      const num = 10;
      for (let i = 0; i < num; i++) {
        basicDataTable.set(i.toString(), i.toString());
        issueAndPRsTable.set(i.toString(), i.toString());
        prsTable.set(i.toString(), i.toString());
        codeReviewTable.set(i.toString(), i.toString());
        contributors.push(i.toString());
      }

      const res = SlackHelper.generateSlackWeeklyReport(
        '',
        basicDataTable,
        issueAndPRsTable,
        prsTable, 10,
        codeReviewTable,
        contributors,
        '',
      );

      assert(res.blocks !== undefined);

      if (res.blocks) {

        const t1 = (res.blocks[6] as SectionBlock);
        if (t1.fields) {
          assert(t1.fields.length === num * 2);
        } else {
          assert(false);
        }

        const t2 = (res.blocks[10] as SectionBlock);
        if (t2.fields) {
          assert(t2.fields.length === num * 2);
        } else {
          assert(false);
        }

        const t3 = (res.blocks[14] as SectionBlock);
        if (t3.fields) {
          assert(t3.fields.length === num * 2);
        } else {
          assert(false);
        }

        const t4 = (res.blocks[18] as SectionBlock);
        if (t4.fields) {
          assert(t4.fields.length === num * 2);
        } else {
          assert(false);
        }

        assert((res.blocks[22] as SectionBlock).text !== undefined);
      }
    });

  });
});
