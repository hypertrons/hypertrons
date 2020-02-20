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
import { TextDecoder } from 'text-encoding';
import { readFileSync } from 'fs';
import { join } from 'path';

const lua = fengari.lua;
const lauxlib = fengari.lauxlib;

const luaBuidinCode = readFileSync(join(__dirname, 'helpers.lua')).toString();

export class LuaVm {

  private L: any;
  private ctx: Map<string, any>;
  private decoder: any;

  constructor() {
    this.L = lauxlib.luaL_newstate();
    // only load basic apis to vm
    const map = new Map<string, any>();
    map.set('_G', luaopen_base).set('string', luaopen_string).set('table', luaopen_table).set('math', luaopen_math);
    map.forEach((lib, name) => {
      lauxlib.luaL_requiref(this.L, fengari.to_luastring(name), lib, 1);
      lua.lua_pop(this.L, 1);
    });
    this.ctx = new Map<string, any>();
    this.decoder = new TextDecoder('utf-8');
  }

  public run(source: string): any {
    source = luaBuidinCode + source;
    for (const [ key, value ] of this.ctx) {
      const n = this.pushStackValue(value);
      if (n !== 0) {
        lua.lua_setglobal(this.L, key);
      }
    }
    lauxlib.luaL_dostring(this.L, fengari.to_luastring(source));
    return this.getStackValue(-1);
  }

  public set(key: string, value: any, target?: any): this {
    if (typeof value === 'function') {
      value = this.wrapFunc(key, value, target);
    }
    this.ctx.set(key, value);
    return this;
  }

  private wrapFunc(key: string, func: (...args: any[]) => any, target?: any): any {
    const wrapped = (): any => {
      // call in ts
      const nArgs = lua.lua_gettop(this.L);
      const args: any[] = [];
      for (let i = 0 ; i < nArgs; i++) {
        args.push(this.getStackValue(i + 1));
      }
      // use call function to inject this object
      const res = func.call(target, ...args);
      // set return value
      return this.pushStackValue(res);
    };
    // save key as function name for debugging use
    Object.defineProperty(func, 'name', { value: key });
    return wrapped;
  }

  private getStackValue(index: number): any {
    if (lua.lua_gettop(this.L) === 0) {
      // has no value on stack
      return undefined;
    }
    index = lua.lua_absindex(this.L, index);
    const type = this.getStackType(index);
    switch (type) {
      case 'number':
        return lua.lua_tonumber(this.L, index);
      case 'string':
        return lua.lua_tojsstring(this.L, index);
      case 'boolean':
        return lua.lua_toboolean(this.L, index);
      case 'userdata':
        return lua.lua_touserdata(this.L, index);
      case 'function':
        // lua_pushvalue will load index value on stack top
        // luaL_ref will pop the value and store as a ref for later use
        lua.lua_pushvalue(this.L, index);
        const cbRef = lauxlib.luaL_ref(this.L, lua.LUA_REGISTRYINDEX);
        return (...args: any[]): any => {
          // get callback funtion and push to stack top
          const oldStackTop = lua.lua_gettop(this.L);
          lua.lua_rawgeti(this.L, lua.LUA_REGISTRYINDEX, cbRef);
          args.forEach(p => {
            // push all args in sequence
            this.pushStackValue(p);
          });
          // call current function
          let ret = lua.lua_pcall(this.L, args.length, lua.LUA_MULTRET, 0);
          if (ret !== lua.LUA_OK) {
            // If ret !=== lua.LUA_OK, means there are errors while executing the function
            console.log(`Error when exec function, ret=${ret}, msg=${this.getStackValue(-1)}`);
          }
          ret = undefined;
          if (lua.lua_gettop(this.L) !== oldStackTop) {
            // after function call, stack top not equal means have return value
            // get the last return value from stack
            ret = this.getStackValue(-1);
          }
          return ret;
        };
      case 'table':
        let v: any;
        try {
          lua.lua_rawgeti(this.L, index, 1);
          v = this.getStackValue(-1);
          lua.lua_pop(this.L, 1);
        // tslint:disable-next-line: no-empty
        } catch { }
        if (v !== null && v !== undefined) {  // need to check like this
          // array
          const arr: any[] = [];
          for (let i = 1; ; i++) {
            lua.lua_rawgeti(this.L, index, i);
            const v = this.getStackValue(-1);
            lua.lua_pop(this.L, 1);
            if (!v) break;
            arr.push(v);
          }
          return arr;
        } else {
          const ret: any = {};
          lua.lua_pushnil(this.L);
          while (lua.lua_next(this.L, index) !== 0) {
            // iterate keys and values from table at index
            // lua_next will push key and value on stack
            const value = this.getStackValue(-1);
            const key = this.getStackValue(-2);
            if (value && key) {
              ret[key] = value;
            }
            lua.lua_pop(this.L, 1);
          }
          return ret;
        }
      case 'no value':
        return undefined;
      case 'nil':
        return null;
      default:
        console.log(`Not supported type=${type}, index=${index}`);
        return undefined;
    }
  }

  private pushStackValue(value: any): number {
    const type = typeof value;
    switch (type) {
      case 'number':
        lua.lua_pushnumber(this.L, value);
        break;
      case 'string':
        lua.lua_pushstring(this.L, value);
        break;
      case 'boolean':
        lua.lua_pushboolean(this.L, value);
        break;
      case 'object':
        if (value === null) {
          return 0;
        } else if (value instanceof Map) {
          // if pass in a Map, push as a table, so can use it in lua
          // the key must be in string type, the value can be any type
          lua.lua_newtable(this.L);
          for (const [ k, v ] of value) {
            if (typeof k === 'string') {
              lua.lua_pushstring(this.L, k);
              const n = this.pushStackValue(v);
              if (n === 0) {
                // not support type or not push into stack
                // pop out the key
                lua.lua_pop(this.L, 1);
              } else {
                // set table value into table
                lua.lua_settable(this.L, -3);
              }
            }
          }
        } else if (Array.isArray(value)) {
          // if pass in an array, push as a table, set index and value
          lua.lua_newtable(this.L);
          (value as any[]).forEach((v, i) => {
            const n = this.pushStackValue(v);
            if (n !== 0) {
              lua.lua_rawseti(this.L, -2, i + 1);
            } else {
              lua.lua_pop(this.L, 1);
            }
          });
        } else if (value instanceof Date) {
          lua.lua_pushstring(this.L, value.toDateString());
          break;
        } else {
          lua.lua_newtable(this.L);
          Object.keys(value).forEach(key => {
            if (typeof key === 'string') {
              lua.lua_pushstring(this.L, key);
              const n = this.pushStackValue(value[key]);
              if (n === 0) {
                // not support type or not push into stack
                // pop out the key
                lua.lua_pop(this.L, 1);
              } else {
                // set table value into table
                lua.lua_settable(this.L, -3);
              }
            }
          });
        }
        break;
      case 'function':
        lua.lua_pushjsfunction(this.L, value);
        break;
      case 'undefined':
        return 0;
      default:
        console.log(`Not supported type: ${type}`);
        return 0;
    }
    return 1;
  }

  private getStackType(index: number): string {
    const luaType = lua.lua_type(this.L, index);
    const type = lua.lua_typename(this.L, luaType);
    return this.decoder.decode(type);
  }

  public getLuaBuidinCodeLines(): number {
    return luaBuidinCode.split('\n').length;
  }

}
