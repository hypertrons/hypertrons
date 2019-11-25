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

'use strict';

import assert from 'assert';
import * as Utils from '../../../app/basic/Utils';

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

  });

  describe('parseDate', () => {

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

});
