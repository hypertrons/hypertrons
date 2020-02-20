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

import 'reflect-metadata';

const CLASS_CALLBACKS_KEY = Symbol.for('Config#Class#Configs');
const CLASS_META_KEY = Symbol.for('Meta#Class#Key');

interface ConfigClassMetaData {
  description: string;
}

interface ConfigPropertyMetaData {
  name?: string;
  description: string;
  defaultValue: any;
  type?: 'string' | 'number' | 'object' | 'boolean' | 'array' | 'enum' | 'cron' | 'object' | 'render_string';
  scope?: 'public' | 'private';
  optional?: boolean;
  isValid?: (v: any) => boolean;
  // class
  classType?: any;
  // enum
  enumValues?: string[];
  // render_string
  renderParams?: string[];
  // array
  arrayType?: any;
}

export function configClass(meta: ConfigClassMetaData): ClassDecorator {
  return target => {
    const propertyMetaFuncs: Array<() => ConfigPropertyMetaData> = Reflect.getMetadata(CLASS_CALLBACKS_KEY, target.prototype);
    try {
      (meta as any).type = 'object';
      if (propertyMetaFuncs) {
        (meta as any).properties = [];
        propertyMetaFuncs.forEach(fn => {
          const pMeta = fn();
          (meta as any).properties.push(pMeta);
        });
      }
    } catch (e) {
      console.error(e);
    }
    Reflect.defineMetadata(CLASS_META_KEY, meta, target);
    return target;
  };
}

export function configProp(meta: ConfigPropertyMetaData): PropertyDecorator {
  return (target, key) => {
    meta.name = String(key);
    if (!meta.scope) {
      meta.scope = 'public';
    }
    if (!meta.optional) {
      meta.optional = false;
    }
    if (meta.classType) {
      meta.type = 'object';
    }
    if (!meta.type) {
      const type = Reflect.getMetadata('design:type', target, key);
      meta.type = type.name.toLowerCase();
    }
    if (meta.type === 'enum' && (!meta.enumValues || meta.enumValues.length === 0)) {
      throw new Error(`Config type for ${meta.name} is not valid with empty enum value`);
    }
    if (meta.renderParams) {
      meta.type = 'render_string';
    }
    if (meta.type === 'object') {
      if (!meta.classType) {
        throw new Error(`Config type for ${meta.name} is not valid with empty class type`);
      }
      meta = {
        ...Reflect.getMetadata(CLASS_META_KEY, meta.classType),
        name: String(key),
        scope: meta.scope,
        optional: meta.optional,
      };
    }
    if (meta.type === 'array') {
      if (!meta.arrayType) {
        throw new Error(`Config type for ${meta.name} is not valid with empty array type`);
      }
      if (typeof meta.arrayType === 'function') {
        // a nested type, get type info from the type
        meta.arrayType = Reflect.getMetadata(CLASS_META_KEY, meta.arrayType);
      }
    }

    let propertyMetaFuncs: Array<() => ConfigPropertyMetaData> = Reflect.getMetadata(CLASS_CALLBACKS_KEY, target);
    if (!propertyMetaFuncs) {
      Reflect.defineMetadata(CLASS_CALLBACKS_KEY, [], target);
    }
    propertyMetaFuncs = Reflect.getMetadata(CLASS_CALLBACKS_KEY, target);
    propertyMetaFuncs.push(() => {
      return meta;
    });
  };
}

export function getConfigMeta(target: any): ConfigClassMetaData {
  let meta: any = {};
  while (target) {
    const m = Reflect.getMetadata(CLASS_META_KEY, target);
    if (m) {
      meta = Object.assign(m, meta);
    }
    target = target.prototype;
  }
  return meta;
}
