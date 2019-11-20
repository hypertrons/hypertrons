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

import { mergeWith, isArray } from 'lodash';
import waitFor from 'p-wait-for';

export function parseRepoName(fullName: string): { owner: string, repo: string } {
  const s = fullName.split('/');
  if (s.length !== 2) {
    return {
      owner: '',
      repo: '',
    };
  }
  return {
    owner: s[0],
    repo: s[1],
  };
}

export function getRepoFullName(owner: string, repo: string): string {
  return `${owner}/${repo}`;
}

export const GloablEvents = {
  READY: 'oss-mentor-bot-ready',
  START: 'oss-mentor-bot-start',
  CLOSE: 'oss-mentor-bot-close',
};

export class AutoCreateMap<K, V> extends Map<K, V> {

  private valueGenerator: () => V;

  constructor(valueGenerator: () => V) {
    super();
    this.valueGenerator = valueGenerator;
  }

  public get(key: K, valueGenerator?: () => V): V {
    let value = super.get(key);
    if (!value) {
      value = valueGenerator ? valueGenerator() : this.valueGenerator();
      this.set(key, value);
    }
    return value;
  }
}

export function customizerMerge(...objs: any[]): any {

  if (!objs || objs.length === 0) {
    return { };
  }
  const errorList: any[] = [];
  try {
    for (let i = 1; i < objs.length; i++) {
      mergeWith(objs[0], objs[i], (objValue: any, srcValue: any) => {
        if (typeof objValue !== typeof srcValue) {
          errorList.push(`invailed typeof ${srcValue} ${typeof srcValue}, ${objValue} require ${typeof objValue}`);
          return objValue ? objValue : {};
        }
        if (isArray(srcValue) && srcValue[0] && srcValue[0].__merge__ === true) {
            srcValue = (srcValue as any[]).shift();
            return objValue.concat(srcValue.filter(v => !objValue.includes(v)));
        }
      });
    }
    return {
      error: errorList,
      config: objs[0],
    };
  } catch (err) {
    return{
      error : [ ...errorList, err ],
      config: objs[0],
    };
  }

}

export function ParseDate(date: string | number | null): Date | null {
  try {
    if (date !== null) {
      return new Date(date);
    }
    return null;
  } catch (error) {
    return null;
  }
}

export interface BotLogger {
  debug: (msg: any, ...args: any[]) => void;
  info: (msg: any, ...args: any[]) => void;
  warn: (msg: any, ...args: any[]) => void;
  error: (msg: any, ...args: any[]) => void;
}

export function waitUntil(func: () => boolean, options?: object): Promise<void> {
  return waitFor(func, Object.assign({ interval: 1000 }, options));
}
