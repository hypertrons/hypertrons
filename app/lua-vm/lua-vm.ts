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

import fengari from 'fengari';
import { luaopen_base } from 'fengari/src/lbaselib';
import { luaopen_math } from 'fengari/src/lmathlib';
import { luaopen_string } from 'fengari/src/lstrlib';
import { luaopen_table } from 'fengari/src/ltablib';
import { luaopen_coroutine } from 'fengari/src/lcorolib';
import { readFileSync } from 'fs';
import { join } from 'path';

const lua = fengari.lua;
const lauxlib = fengari.lauxlib;

const luaBuidinCode = readFileSync(join(__dirname, 'helpers.lua')).toString();

export class LuaVm {

  private L: any;
  private ctx: Map<string, any>;

  constructor() {
    this.L = lauxlib.luaL_newstate();
    // only load basic apis to vm
    const map = new Map<string, any>();
    map.set('_G', luaopen_base)
      .set('string', luaopen_string)
      .set('table', luaopen_table)
      .set('math', luaopen_math)
      .set('coroutine', luaopen_coroutine);
    map.forEach((lib, name) => {
      lauxlib.luaL_requiref(this.L, fengari.to_luastring(name), lib, 1);
      lua.lua_pop(this.L, 1);
    });
    this.ctx = new Map<string, any>();
  }

  public run(source: string): any {
    source = luaBuidinCode + source;
    for (const [ key, value ] of this.ctx) {
      const n = this.pushStackValue(this.L, value);
      if (n !== 0) {
        lua.lua_setglobal(this.L, key);
      }
    }
    lauxlib.luaL_dostring(this.L, fengari.to_luastring(source));
    return this.getStackValue(this.L, -1);
  }

  public set(key: string, value: any, target?: any): this {
    if (typeof value === 'function') {
      value = this.wrapFunc(key, value, target);
    }
    this.ctx.set(key, value);
    return this;
  }

  private wrapFunc(key: string, func: (...args: any[]) => any, target?: any): any {
    const wrapped = (L: any): any => {
      // call in ts
      const getArgs = (): any[] => {
        const nArgs = lua.lua_gettop(L);
        const args: any[] = [];
        for (let i = 0 ; i < nArgs; i++) {
          const value = this.getStackValue(L, i + 1);
          args.push(value);
        }
        return args;
      };
      const args = getArgs();
      // use call function to inject this object
      const res = func.call(target, ...args);
      if (res instanceof Promise && lua.lua_isyieldable(L)) {
        // if a coroutine happened, yield and resume when promise return
        Promise.resolve(res).then(r => {
          if (r === undefined) {
            // no return value
            lua.lua_resume(L, this.L, 0);
          } else {
            this.pushStackValue(L, r);
            lua.lua_resume(L, this.L, 1);
          }
        });
        return lua.lua_yield(L, 0);
      } else {
        // set return value
        return this.pushStackValue(L, res);
      }
    };
    // save key as function name for debugging use
    Object.defineProperty(func, 'name', { value: key });
    return wrapped;
  }

  private getStackValue(L: any, index: number): any {
    if (lua.lua_gettop(L) === 0) {
      // no value, return undefined first
      // otherwise, absindex will fail
      return undefined;
    }
    index = lua.lua_absindex(L, index); // change to abs index in case iterate call error
    const type = lua.lua_type(L, index);
    switch (type) {
      case lua.LUA_TNUMBER:
        return lua.lua_tonumber(L, index);
      case lua.LUA_TSTRING:
        return lua.lua_tojsstring(L, index);
      case lua.LUA_TBOOLEAN:
        return lua.lua_toboolean(L, index);
      case lua.LUA_TUSERDATA:
        return lua.lua_touserdata(L, index);
      case lua.LUA_TFUNCTION:
        // lua_pushvalue will load index value on stack top
        // luaL_ref will pop the value and store as a ref for later use
        lua.lua_pushvalue(L, index);
        const cbRef = lauxlib.luaL_ref(L, lua.LUA_REGISTRYINDEX);
        return (...args: any[]): any => {
          // get callback funtion and push to stack top
          const oldStackTop = lua.lua_gettop(L);
          lua.lua_rawgeti(L, lua.LUA_REGISTRYINDEX, cbRef);
          args.forEach(p => {
            // push all args in sequence
            this.pushStackValue(L, p);
          });
          // call current function
          let ret = lua.lua_pcall(L, args.length, lua.LUA_MULTRET, 0);
          if (ret !== lua.LUA_OK) {
            // If ret !=== lua.LUA_OK, means there are errors while executing the function
            console.log(`Error when exec function, ret=${ret}, msg=${this.getStackValue(L, -1)}`);
          }
          ret = undefined;
          if (lua.lua_gettop(L) !== oldStackTop) {
            // after function call, stack top not equal means have return value
            // get the last return value from stack
            ret = this.getStackValue(L, -1);
          }
          return ret;
        };
      case lua.LUA_TTABLE:
        // only support array and object
        let v: any;
        try {
          lua.lua_rawgeti(L, index, 1);
          v = this.getStackValue(L, -1);
          lua.lua_pop(L, 1);
        // tslint:disable-next-line: no-empty
        } catch { }
        if (v !== null && v !== undefined) {  // need to check like this
          // array
          const arr: any[] = [];
          for (let i = 1; ; i++) {
            lua.lua_rawgeti(L, index, i);
            const v = this.getStackValue(L, -1);
            lua.lua_pop(L, 1);
            if (!v) break;
            arr.push(v);
          }
          return arr;
        } else {
          const ret: any = {};
          lua.lua_pushnil(L);
          while (lua.lua_next(L, index) !== 0) {
            // iterate keys and values from table at index
            // lua_next will push key and value on stack
            const value = this.getStackValue(L, -1);
            const key = this.getStackValue(L, -2);
            if (value && key) {
              ret[key] = value;
            }
            lua.lua_pop(L, 1);
          }
          return ret;
        }
      case lua.LUA_TTHREAD:
        return lua.lua_tothread(L, index);
      case lua.LUA_TNONE:
        return undefined;
      case lua.LUA_TNIL:
        return null;
      default:
        console.log(`Not supported type=${type}, index=${index}`);
        return undefined;
    }
  }

  private pushStackValue(L: any, value: any, target?: any): number {
    const type = typeof value;
    switch (type) {
      case 'number':
        lua.lua_pushnumber(L, value);
        break;
      case 'string':
        lua.lua_pushstring(L, value);
        break;
      case 'boolean':
        lua.lua_pushboolean(L, value);
        break;
      case 'object':
        if (value === null || value === undefined) {
          return 0;
        } else if (Array.isArray(value)) {
          // if pass in an array, push as a table, set index and value
          lua.lua_newtable(L);
          (value as any[]).forEach((v, i) => {
            const n = this.pushStackValue(L, v);
            if (n !== 0) {
              lua.lua_rawseti(L, -2, i + 1);
            } else {
              lua.lua_pop(L, 1);
            }
          });
        } else if (value instanceof Date) {
          lua.lua_pushstring(L, value.toDateString());
          break;
        } else {
          lua.lua_newtable(L);
          Object.keys(value).forEach(key => {
            lua.lua_pushstring(L, key);
            const v = value[key];
            let n = 0;
            if (typeof v === 'function') {
              // if the value is function, wrap and bind target and push back
              const f = this.wrapFunc(v.name, v, target);
              n = this.pushStackValue(L, f, value);
            } else {
              n = this.pushStackValue(L, value[key]);
            }
            if (n === 0) {
              // not support type or not push into stack
              // pop out the key
              lua.lua_pop(L, 1);
            } else {
              // set table value into table
              lua.lua_settable(L, -3);
            }
          });
        }
        break;
      case 'function':
        lua.lua_pushjsfunction(L, value);
        break;
      case 'undefined':
        return 0;
      default:
        console.log(`Not supported type: ${type}`);
        return 0;
    }
    return 1;
  }

  public getLuaBuidinCodeLines(): number {
    return luaBuidinCode.split('\n').length;
  }

}
