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
import * as Utils from '../../../app/basic/Utils';
import { join } from 'path';

describe('Utils', () => {

  describe('parseRepoName', () => {
    it('parse a valid name', async () => {
      const owner = 'owner';
      const repo = 'repo';
      const { owner: o, repo: r } = Utils.parseRepoName(`${owner}/${repo}`);
      assert(o === owner && r === repo);
    });

    it('parse a name with no slash', async () => {
      const { owner, repo } = Utils.parseRepoName('name');
      assert(owner === '' && repo === '');
    });

    it('parse a name with multiple slash', async () => {
      const { owner, repo } = Utils.parseRepoName('a/b/c');
      assert(owner === '' && repo === '');
    });
  });

  describe('getRepoFullName', () => {
    it('getRepoFullName', () => {
      const name = Utils.getRepoFullName('a', 'b');
      assert(name === 'a/b');
    });
  });

  describe('AutoCreateMap', () => {
    let map: Utils.AutoCreateMap<string, string[]>;

    beforeEach(() => {
      map = new Utils.AutoCreateMap(() => []);
    });

    it('get exist value', () => {
      map.set('key', [ 'value1', 'value2' ]);
      const v = map.get('key');
      assert(v.length === 2);
    });

    it('get non-exist value with default generator', () => {
      const v = map.get('key');
      assert(v.length === 0);
    });

    it('get non-exist value with custom generator', () => {
      const v = map.get('key', () => [ 'value1', 'value2' ]);
      assert(v.length === 2);
    });
  });

  describe('customizerMerge', () => {
    it('should be {} if pass 0 param', async () => {
      const res = Utils.customizerMerge();
      deepEqual({}, res);
    });

    it('should be raw value if pass 1 param', async () => {
      const a = {};
      const res = Utils.customizerMerge(a);
      deepEqual(res, a);
    });

    it('should be srcValue if attr not exist', async () => {
      const a = { a: 1 };
      const b = { a: 2, b: 3 };
      const res = Utils.customizerMerge(a, b);
      deepEqual(res, { a: 2, b: 3 });
    });

    it('should be srcValue if attr not exist multi', async () => {
      const a = { a: 1 };
      const b = { a: 2, b: 3 };
      const c = { a: 2, b: 'c' };
      const res = Utils.customizerMerge(a, b, c);
      deepEqual(res, { a: 2, b: 'c' });
    });

    it('should be srcValue if attr not exist multi', async () => {
      const a = { a: 1 };
      const b = { a: 2, b: 3 };
      const c = { a: 2, b: { c: 'c' } };
      const res = Utils.customizerMerge(a, b, c);
      deepEqual(res, { a: 2, b: { c: 'c' } });
    });

    it('should not overwrite if type not match', async () => {
      const a = { a: 1, b: 2 };
      const b = { a: 2, b: '2' };
      const res = Utils.customizerMerge(a, b);
      deepEqual(res, { a: 2, b: '2' });
    });

    it('array overwrite 1', async () => {
      const a = { a: 1, b: [ 1 ] };
      const b = { a: 2, b: [] };
      const res = Utils.customizerMerge(a, b);
      deepEqual(res, { a: 2, b: [] });
    });

    it('array overwrite 2', async () => {
      const a = { a: 1, b: [ 2 ] };
      const b = { a: 2, b: [ 1 ] };
      const res = Utils.customizerMerge(a, b);
      deepEqual(res, { a: 2, b: [ 1 ] });
    });

    it('array overwrite 3', async () => {
      const a = { a: 1, b: [ 1, 2 ] };
      const b = { a: 2, b: [ 1 ] };
      const res = Utils.customizerMerge(a, b);
      deepEqual(res, { a: 2, b: [ 1 ] });
    });

    it('multi array overwrite 1', async () => {
      const a = { a: 1, b: [ 1 ] };
      const b = { a: 2, b: [ 2 ] };
      const c = { a: 2, b: [] };
      const res = Utils.customizerMerge(a, b, c);
      deepEqual(res, { a: 2, b: [] });
    });

    it('multi array overwrite 2', async () => {
      const a = { a: 1, b: [ 1 ] };
      const b = { a: 2, b: [ 2, 3 ] };
      const c = { a: 2, b: [ 4, 5 ] };
      const res = Utils.customizerMerge(a, b, c);
      deepEqual(res, { a: 2, b: [ 4, 5 ] });
    });

    it('multi array overwrite 3', async () => {
      const a = { a: 1, b: [ 1, 2 ] };
      const b = { a: 2, b: [] };
      const c = { a: 2, b: [ 4, 5 ] };
      const res = Utils.customizerMerge(a, b, c);
      deepEqual(res, { a: 2, b: [ 4, 5 ] });
    });

    it('array merge 1', async () => {
      const a = { a: 1, b: [ 1 ] };
      const b = { a: 2, b: [{ __merge__: true }, 1 ] };
      const res = Utils.customizerMerge(a, b);
      deepEqual(res, { a: 2, b: [ 1 ] });
    });

    it('array merge 2', async () => {
      const a = { a: 1, b: [ 1, 2 ] };
      const b = { a: 2, b: [{ __merge__: true }, 1, 2, 3 ] };
      const res = Utils.customizerMerge(a, b);
      deepEqual(res, { a: 2, b: [ 1, 2, 3 ] });
    });

    it('array merge 3', async () => {
      const a = { a: 1, b: [ 1, 2 ] };
      const b = { a: 2, b: [{ __merge__: true }, 3, 4 ] };
      const res = Utils.customizerMerge(a, b);
      deepEqual(res, { a: 2, b: [ 1, 2, 3, 4 ] });
    });

    it('multi array merge', async () => {
      const a = { a: 1, b: [ 1, 2 ] };
      const b = { a: 2, b: [{ __merge__: true }, 3, 4 ] };
      const c = { a: 2, b: [{ __merge__: true }, 5, 6 ] };
      const res = Utils.customizerMerge(a, b, c);
      deepEqual(res, { a: 2, b: [ 1, 2, 3, 4, 5, 6 ] });
    });

    it('multi array merge and overwrite 1', async () => {
      const a = { a: 1, b: [ 1, 2 ] };
      const b = { a: 2, b: [ 3, 4 ] };
      const c = { a: 2, b: [{ __merge__: true }, 5, 6 ] };
      const res = Utils.customizerMerge(a, b, c);
      deepEqual(res, { a: 2, b: [ 3, 4, 5, 6 ] });
    });

    it('multi array merge and overwrite 2', async () => {
      const a = { a: 1, b: [ 1, 2 ] };
      const b = { a: 2, b: [{ __merge__: true }, 3, 4 ] };
      const c = { a: 2, b: [ 3, 4 ] };
      const res = Utils.customizerMerge(a, b, c);
      deepEqual(res, { a: 2, b: [ 3, 4 ] });
    });

  });

  describe('parseDate', () => {
    it('should return null if pass null', async () => {
      let res = Utils.ParseDate(null);
      assert(res === null);

      res = Utils.ParseDate('');
      assert(res === null);
    });

    it('should return null if pass error format value', async () => {
      const res = Utils.ParseDate('enkanfd');
      assert(res === null);
    });

    it('should return null if pass error format value', async () => {
      const res = Utils.ParseDate('0.123');
      assert(res === null);
    });

    it('should return currect value if pass currect value', async () => {
      const res = Utils.ParseDate('2019-12-05T15:54:17.000Z');
      if (res !== null) {
        assert(res.toDateString() === 'Thu Dec 05 2019');
      } else {
        assert(false);
      }
    });
  });

  describe('waitUntil', () => {
    it('should wait until condition match', async () => {
      let condition = false;
      setTimeout(() => {
        condition = true;
      }, 5);
      await Utils.waitUntil(() => condition, { interval: 2 });
      assert(condition);
    });
  });

  describe('uniqueArray', () => {
    it('should return origin array', async () => {
      const array = [ 1, 2, 3, 4 ];
      const ua = Utils.uniqueArray(array);
      assert.deepEqual(ua, [ 1, 2, 3, 4 ]);
    });

    it('should return empty array', async () => {
      const array = [];
      const ua = Utils.uniqueArray(array);
      assert.deepEqual(ua, []);
    });

    it('should return unique array', async () => {
      const array = [ 1, 2, 3, 2, 1 ];
      const ua = Utils.uniqueArray(array);
      assert.deepEqual(ua, [ 1, 2, 3 ]);
    });
  });

  describe('customizerMergeWithType', () => {
    it('should be {} if pass 0 param', async () => {
      const res = Utils.customizerMergeWithType();
      deepEqual({}, res);
    });

    it('should be raw value if pass 1 param', async () => {
      const a = {};
      const res = Utils.customizerMergeWithType(a);
      deepEqual(res, a);
    });

    it('should be srcValue if attr not exist', async () => {
      const a = { a: 1 };
      const b = { a: 2, b: 3 };
      const res = Utils.customizerMergeWithType(a, b);
      deepEqual(res, { a: 2, b: 3 });
    });

    it('should be srcValue if attr not exist multi', async () => {
      const a = { a: 1 };
      const b = { a: 2, b: 3 };
      const c = { a: 2, b: 'c' };
      const res = Utils.customizerMergeWithType(a, b, c);
      deepEqual(res, { a: 2, b: 3 });
    });

    it('should be srcValue if attr not exist multi', async () => {
      const a = { a: 1 };
      const b = { a: 2, b: 3 };
      const c = { a: 2, b: { c: 'c' } };
      const res = Utils.customizerMergeWithType(a, b, c);
      deepEqual(res, { a: 2, b: 3 });
    });

    it('should not overwrite if type not match', async () => {
      const a = { a: 1, b: 2 };
      const b = { a: 2, b: '2' };
      const res = Utils.customizerMergeWithType(a, b);
      deepEqual(res, { a: 2, b: 2 });
    });

    it('array overwrite 1', async () => {
      const a = { a: 1, b: [ 1 ] };
      const b = { a: 2, b: [] };
      const res = Utils.customizerMergeWithType(a, b);
      deepEqual(res, { a: 2, b: [] });
    });

    it('array overwrite 2', async () => {
      const a = { a: 1, b: [ 2 ] };
      const b = { a: 2, b: [ 1 ] };
      const res = Utils.customizerMergeWithType(a, b);
      deepEqual(res, { a: 2, b: [ 1 ] });
    });

    it('array overwrite 3', async () => {
      const a = { a: 1, b: [ 1, 2 ] };
      const b = { a: 2, b: [ 1 ] };
      const res = Utils.customizerMergeWithType(a, b);
      deepEqual(res, { a: 2, b: [ 1 ] });
    });

    it('multi array overwrite 1', async () => {
      const a = { a: 1, b: [ 1 ] };
      const b = { a: 2, b: [ 2 ] };
      const c = { a: 2, b: [] };
      const res = Utils.customizerMergeWithType(a, b, c);
      deepEqual(res, { a: 2, b: [] });
    });

    it('multi array overwrite 2', async () => {
      const a = { a: 1, b: [ 1 ] };
      const b = { a: 2, b: [ 2, 3 ] };
      const c = { a: 2, b: [ 4, 5 ] };
      const res = Utils.customizerMergeWithType(a, b, c);
      deepEqual(res, { a: 2, b: [ 4, 5 ] });
    });

    it('multi array overwrite 3', async () => {
      const a = { a: 1, b: [ 1, 2 ] };
      const b = { a: 2, b: [] };
      const c = { a: 2, b: [ 4, 5 ] };
      const res = Utils.customizerMergeWithType(a, b, c);
      deepEqual(res, { a: 2, b: [ 4, 5 ] });
    });

    it('array merge 1', async () => {
      const a = { a: 1, b: [ 1 ] };
      const b = { a: 2, b: [{ __merge__: true }, 1 ] };
      const res = Utils.customizerMergeWithType(a, b);
      deepEqual(res, { a: 2, b: [ 1 ] });
    });

    it('array merge 2', async () => {
      const a = { a: 1, b: [ 1, 2 ] };
      const b = { a: 2, b: [{ __merge__: true }, 1, 2, 3 ] };
      const res = Utils.customizerMergeWithType(a, b);
      deepEqual(res, { a: 2, b: [ 1, 2, 3 ] });
    });

    it('array merge 3', async () => {
      const a = { a: 1, b: [ 1, 2 ] };
      const b = { a: 2, b: [{ __merge__: true }, 3, 4 ] };
      const res = Utils.customizerMergeWithType(a, b);
      deepEqual(res, { a: 2, b: [ 1, 2, 3, 4 ] });
    });

    it('multi array merge', async () => {
      const a = { a: 1, b: [ 1, 2 ] };
      const b = { a: 2, b: [{ __merge__: true }, 3, 4 ] };
      const c = { a: 2, b: [{ __merge__: true }, 5, 6 ] };
      const res = Utils.customizerMergeWithType(a, b, c);
      deepEqual(res, { a: 2, b: [ 1, 2, 3, 4, 5, 6 ] });
    });

    it('multi array merge and overwrite 1', async () => {
      const a = { a: 1, b: [ 1, 2 ] };
      const b = { a: 2, b: [ 3, 4 ] };
      const c = { a: 2, b: [{ __merge__: true }, 5, 6 ] };
      const res = Utils.customizerMergeWithType(a, b, c);
      deepEqual(res, { a: 2, b: [ 3, 4, 5, 6 ] });
    });

    it('multi array merge and overwrite 2', async () => {
      const a = { a: 1, b: [ 1, 2 ] };
      const b = { a: 2, b: [{ __merge__: true }, 3, 4 ] };
      const c = { a: 2, b: [ 3, 4 ] };
      const res = Utils.customizerMergeWithType(a, b, c);
      deepEqual(res, { a: 2, b: [ 3, 4 ] });
    });
  });

  describe('parsePrivateConfigFileName', () => {
    it('should return undefined if fileName is invalid', async () => {
      let res = Utils.parsePrivateConfigFileName('a');
      assert(res === '');

      res = Utils.parsePrivateConfigFileName('a.json');
      assert(res === '');

      res = Utils.parsePrivateConfigFileName('a/.json');
      assert(res === '');

      res = Utils.parsePrivateConfigFileName('a_b_c.json');
      assert(res === '');
    });

    it('right case', async () => {
      let fullName = Utils.parsePrivateConfigFileName('owner/repo.json');
      const compare = join('owner', 'repo');
      assert(fullName, compare);

      fullName = Utils.parsePrivateConfigFileName('prefix/owner/repo.json');
      assert(fullName, compare);

      fullName = Utils.parsePrivateConfigFileName('prefix/prefix/owner/repo.json');
      assert(fullName, compare);
    });

  });
});
