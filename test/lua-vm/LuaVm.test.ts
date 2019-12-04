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
import { LuaVm } from '../../app/lua-vm/LuaVm';
import { prepareTestApplication, testClear, waitFor } from '../Util';
import { Application, Agent } from 'egg';

describe('LuaVm', () => {

  let luaVm: LuaVm;

  beforeEach(() => {
    luaVm = new LuaVm();
  });

  it('Should run simple print', () => {
    luaVm.run('print("Lua test internal string")');
  });

  it('Should get passed string', () => {
    luaVm.set('var', 'Lua test with passed string');
    luaVm.run('print(var)');
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

  it('Should exec injected functions', () => {
    const a = 2, b = 3;
    const add = (a: number, b: number): number => {
      return a + b;
    };
    luaVm.set('add', add).set('a', a).set('b', b);
    const result = luaVm.run('return add(a, b)');
    assert(result === a + b);
  });

  it('Should exec inject functions with callback', () => {
    const a = 2, b = 3, c = 4;
    let res = 0;
    const func = (a: number, b: number, cb: (r: number) => void): void => {
      cb(a - b);
    };
    const cb = (r: number): void => {
      res = r;
    };
    luaVm.set('func', func).set('cb', cb).set('a', a).set('b', b).set('c', c);
    luaVm.run(`
func(a, b, function (r)
    cb(r + c)
end)`);
    assert(res === a - b + c);
  });

  it('Should exec inject functions with multiple callbacks', () => {
    const a = 2, b = 3, c = 4;
    let res1 = 0, res2 = 0;
    const func = (a: number, b: number, cb1: (r: number) => void, cb2: (r: number) => void): void => {
      cb1(a - b);
      cb2(a + b);
    };
    const cb1 = (r: number): void => {
      res1 = r;
    };
    const cb2 = (r: number): void => {
      res2 = r;
    };
    luaVm.set('func', func).set('cb1', cb1).set('cb2', cb2).set('a', a).set('b', b).set('c', c);
    luaVm.run(`
func(a, b, function (r)
  cb1(r + c)
end, function (r)
  cb2(r - c)
end)`);
    assert((res1 === a - b + c) && (res2 === a + b - c));
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

  it('Should get value inside a map', () => {
    const a = 2, b = 3, c = 4;
    let res = 0;
    const func = (m: Map<string, number>, cb: (r: Map<string, any>) => void): void => {
      const map = new Map<string, number>();
      const a = m.get('a') || 0;
      const b = m.get('b') || 0;
      map.set('num', a - b);
      cb(map);
    };
    const cb = (r: Map<string, number>): void => {
      res = r.get('num') || 0;
    };

    const map = new Map<string, number>().set('a', a).set('b', b).set('c', c);
    luaVm.set('func', func).set('cb', cb).set('map', map);
    luaVm.run(`
func(map, function (r)
  t = {}
  t['num'] = r.num + map.c
  cb(t)
end)`);
    assert(res === a - b + c);
  });

  describe('Integrate test with app', () => {
    let app: Application;
    let agent: Agent;

    class TestEvent {
      num: number;
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
      const test = (e: TestEvent): void => {
        res = e.num;
      };
      luaVm.set('on', on).set('test', test);
      luaVm.run(`
on('TestEvent', function (e)
    test(e)
end)`);
      agent.event.publish('worker', TestEvent, { num: 5 });
      await waitFor(20);
      assert(res === 5);
    });
  });

});
