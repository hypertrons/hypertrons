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

});
