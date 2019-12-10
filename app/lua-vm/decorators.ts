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

import 'reflect-metadata';

export const luaEvents: Map<string, {toLuaEvent: (e: any) => any}> = new Map<string, {toLuaEvent: (e: any) => any}>();

export function luaMethod(): MethodDecorator {
  return (target, property, descriptor) => {
    const obj = target as any;
    const key = String(property);
    if (typeof obj.setInjectFunction === 'function' && String(key).startsWith('lua_')) {
      obj.setInjectFunction(key.substring(4), descriptor.value);
    }
  };
}

interface LuaEventParam {
  description: string;
  luaEventType: any;
  name?: string;
}

export function luaEvent(p: LuaEventParam): ClassDecorator {
  return target => {
    const c = new (target as any)();
    c.name = target.name;
    c.returnType = p;
    if (!c.toLuaEvent) {
      console.log('Need to have toLuaEvent function');
    }
    luaEvents.set(p.name ? p.name : target.name, c);
  };
}
