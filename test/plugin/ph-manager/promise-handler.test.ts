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

import delay from 'delay';
import PromiseHandler from '../../../app/plugin/ph-manager/promise-handler';
import assert from 'power-assert';

describe('promise-handler', () => {

  it('sequential request', async () => {
    const promiseHandler: PromiseHandler = new PromiseHandler({ queue: { concurrency: 1 } });
    const res: any[] = [];
    promiseHandler.add(async () => { await delay(5); res.push('1. 🐯'); });
    promiseHandler.add(async () => { await delay(1); res.push('2. 🐷'); });
    promiseHandler.add(async () => { await delay(3); res.push('3. 🐻'); });
    promiseHandler.add(async () => { await delay(2); res.push('4. 🐼'); });
    promiseHandler.add(async () => { await delay(4); res.push('5. 🦊'); });
    await delay(30);
    console.log(res);
    assert.deepStrictEqual(res, [ '1. 🐯', '2. 🐷', '3. 🐻', '4. 🐼', '5. 🦊' ]);
  });

  it('3 concurrent request', async () => {
    const promiseHandler: PromiseHandler = new PromiseHandler({ queue: { concurrency: 2 } });
    const res: any[] = [];
    promiseHandler.add(async () => { await delay(5 * 1); res.push('1. 🐯'); });
    promiseHandler.add(async () => { await delay(5 * 1); res.push('2. 🐷'); });
    promiseHandler.add(async () => { await delay(5 * 1); res.push('3. 🐻'); });
    promiseHandler.add(async () => { await delay(5 * 4); res.push('4. 🐼'); });
    promiseHandler.add(async () => { await delay(5 * 2); res.push('5. 🦊'); });
    await delay(50);
    console.log(res);
    assert.deepStrictEqual(res, [ '1. 🐯', '2. 🐷', '3. 🐻', '5. 🦊', '4. 🐼' ]);
  });

  it('infinity concurrent request (defalut)', async () => {
    const promiseHandler: PromiseHandler = new PromiseHandler();
    const res: any[] = [];
    promiseHandler.add(async () => { await delay(5 * 5); res.push('1. 🐯'); });
    promiseHandler.add(async () => { await delay(5 * 1); res.push('2. 🐷'); });
    promiseHandler.add(async () => { await delay(5 * 3); res.push('3. 🐻'); });
    promiseHandler.add(async () => { await delay(5 * 2); res.push('4. 🐼'); });
    promiseHandler.add(async () => { await delay(5 * 4); res.push('5. 🦊'); });
    await delay(50);
    console.log(res);
    assert.deepStrictEqual(res, [ '2. 🐷', '4. 🐼', '3. 🐻', '5. 🦊', '1. 🐯' ]);
  });

  it('on error retry', async () => {
    const promiseHandler: PromiseHandler = new PromiseHandler({ retry: { minTimeout: 10 } });
    let n = 0;
    let res = '';
    const getEmoji = async () => {
      if (n === 3) {
        return res;
      } else {
        n++;
        res += '🐷 ';
        throw new Error('plz retry');
      }
    };
    const emoji = await promiseHandler.add(async () => await getEmoji());
    console.log(emoji);
    assert.deepEqual(emoji, '🐷 🐷 🐷 ');
  });

  it('sequential request and on error retry', async () => {
    const promiseHandler: PromiseHandler = new PromiseHandler({ queue: { concurrency: 1 }, retry: { minTimeout: 10 } });
    let n = 0;
    let res = '';
    const getPig = async () => {
      if (n === 3) {
        return res;
      } else {
        n++;
        await delay(5);
        res += '🐷 ';
        throw new Error('plz retry');
      }
    };
    const getPanda = () => {
      res += '🐼 ';
      return res;
    };
    promiseHandler.add(async () => await getPig());
    const emoji = await promiseHandler.add(() => getPanda());
    console.log(emoji);
    assert.deepEqual(emoji, '🐷 🐷 🐷 🐼 ');
  });

});
