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

import assert from 'power-assert';
import { LuaVm } from '../../app/lua-vm/lua-vm';
import { prepareTestApplication, testClear, waitFor } from '../Util';
import { Application, Agent } from 'egg';

describe('LuaVm', () => {

  let luaVm: LuaVm;

  beforeEach(() => {
    luaVm = new LuaVm();
  });

  it('Should get return value', () => {
    const a = 2, b = 3;
    luaVm.set('a', a).set('b', b);
    const result = luaVm.run('return a + b');
    assert(result === a + b);
  });

  it('Should support boolean', () => {
    const c = true;
    luaVm.set('c', c);
    const result = luaVm.run(`
if (c)
then
  return true
end
return 1
`);
    assert(result === true);
  });

  it('Should support array', () => {
    luaVm.set('c', [ 1, 2, 3 ]);
    const result = luaVm.run(`
c[3] = 5;
return c
`);
    assert(result[2] === 5);
  });

  it('Should exec inject functions with multiple callbacks with return value', () => {
    const a = 2, b = 3, c = 4;
    const func = (a: number, b: number, cb1: (r: number) => number, cb2: (r: number) => number): number => {
      return cb1(a - b) * cb2(a + b);
    };
    const func2 = (a: number): number => {
      return a * b;
    };
    luaVm.set('func', func).set('func2', func2).set('a', a).set('b', b).set('c', c);
    const res = luaVm.run(`
return func(a, b,
function (r)
  return func2(r + c);
end,
function (r)
  return func2(r - c);
end)`);
    assert(res === ((a - b + c) * b) * ((a + b - c) * b));
  });

  it('Should support function execution within param call', () => {
    const a = 2, b = 3, c = 4, d = 5;
    const func = (a: number, b: number, c: number): number => {
      return a - b - c;
    };
    const add = (a: number, b: number): number => {
      return a + b;
    };
    luaVm.set('func', func).set('add', add).set('a', a).set('b', b).set('c', c).set('d', d);
    const res = luaVm.run(`
return func(a, add(b, c), d)
`);
    assert(res === a - b - c - d);
  });

  it('Should support embedded object', () => {
    let res: any = {};
    const set = (obj: any) => {
      res = obj;
    };
    luaVm.set('set', set);
    luaVm.run(`
local t = {
  ['a'] = 'test',
  ['d'] = {
    ['e'] = -1
  }
}
set(t)
`);
    assert(res.a === 'test' && res.d.e === -1);
  });

  it('Should support ts promise call', async () => {
    let res = 0;
    const test = async (a: number, b: number) => {
      await waitFor(10); // some async stuff
      return a + b;
    };
    const set = (num: number) => {
      res = num;
    };
    luaVm.set('test', test).set('set', set);
    luaVm.run(`
wrap(function()
  local res = test(1, 2)
  local res2 = test(res, 4)
  set(res2)
end)
`);
    await waitFor(30);
    assert(res === 7);
  });

  it('Should support object will async member function', async () => {
    let res = 0;
    const num = 3;
    const obj = {
      num: 5,
      async asyncAdd(num: number) {
        await waitFor(5);
        res = obj.num + num;
      },
    };
    luaVm.set('obj', obj).set('num', num);
    luaVm.run(`
wrap(function()
  obj.asyncAdd(num)
end)
`);
    await waitFor(10);
    assert(res === (obj.num + num));
  });

  describe('Integrate test with app', () => {
    let app: Application;
    let agent: Agent;

    class TestEvent {
      num1: number;
      num2: number;
    }

    beforeEach(async () => {
      await waitFor(20);
      ({ app, agent } = await prepareTestApplication());
    });
    afterEach(() => {
      testClear(app, agent);
    });

    it('Test with event plugin', async () => {
      let res = 0;
      const on = (eventType: string, cb: (e: any) => void) => {
        if (eventType === 'TestEvent') {
          app.event.subscribeOne(TestEvent, async e => {
            cb(e);
          });
        }
      };
      const test = async (e: TestEvent): Promise<void> => {
        await waitFor(5);
        res = e.num1;
      };
      const test2 = (e: TestEvent) => {
        res = e.num2;
      };
      luaVm.set('on', on).set('test', test).set('test2', test2);
      luaVm.run(`
on('TestEvent', function (e)
  wrap(function()
    test(e)
    test2(e)
  end)
end)`);
      agent.event.publish('worker', TestEvent, { num1: 5, num2: 3 });
      await waitFor(20);
      assert(res === 3);
    });
  });

});
