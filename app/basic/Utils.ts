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

import { mergeWith, isArray, cloneDeep } from 'lodash';
import waitFor from 'p-wait-for';
import { EggLogger } from 'egg-logger';
import { pope } from 'pope';
import { join } from 'path';

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
  READY: 'hypertrons-ready',
  START: 'hypertrons-start',
  CLOSE: 'hypertrons-close',
};

export const IssueMetaDataFormatRegExp = /<!-- hypertronsMetaData: ([\w\W]*) --!>/g;
export const IssueMetaDataBegin = '<!-- hypertronsMetaData: ';
export const IssueMetaDataEnd = ` --!>
`;

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
  if (!objs || objs.length === 0) return {};
  const res = cloneDeep(objs[0]);
  try {
    for (let i = 1; i < objs.length; i++) {
      mergeWith(res, objs[i], (objValue: any, srcValue: any, _: string) => {
        if (typeof objValue !== typeof srcValue) return srcValue !== undefined ? srcValue : objValue;
        if (isArray(srcValue)) {
          if (srcValue[0] && srcValue[0].__merge__ === true) {
            return objValue.concat(srcValue.slice(1).filter(v => !objValue.includes(v)));
          }
          return srcValue;
        }
      });
    }
    return res;
  } catch (err) {
    return res;
  }
}

export function customizerMergeWithType(...objs: any[]): any {
  if (!objs || objs.length === 0) return {};
  const res = cloneDeep(objs[0]);
  try {
    for (let i = 1; i < objs.length; i++) {
      mergeWith(res, objs[i], (objValue: any, srcValue: any, _: string) => {
        if (typeof objValue !== typeof srcValue) {
          return objValue ? objValue : srcValue;
        }
        if (isArray(srcValue)) {
          if (srcValue[0] && srcValue[0].__merge__ === true) {
            return objValue.concat(srcValue.slice(1).filter(v => !objValue.includes(v)));
          } else {
            return srcValue;
          }
        }
      });
    }
    return res;
  } catch (err) {
    return res;
  }
}

export function ParseDate(date: string | number | null): Date | null {
  if (date !== null) {
    const res = new Date(date);
    if (res.toString() !== 'Invalid Date') return res;
  }
  return null;
}

export interface BotLogger {
  debug: (msg: any, ...args: any[]) => void;
  info: (msg: any, ...args: any[]) => void;
  warn: (msg: any, ...args: any[]) => void;
  error: (msg: any, ...args: any[]) => void;
}

export function loggerWrapper(logger: EggLogger, prefix: string | (() => string)): BotLogger {
  const isString = typeof prefix === 'string';
  const caller = prefix as () => string;
  return {
    debug: (msg, ...args) => logger.debug(isString ? prefix : caller(), msg, ...args),
    info: (msg, ...args) => logger.info(isString ? prefix : caller(), msg, ...args),
    warn: (msg, ...args) => logger.warn(isString ? prefix : caller(), msg, ...args),
    error: (msg, ...args) => logger.error(isString ? prefix : caller(), msg, ...args),
  };
}

export function waitUntil(func: () => boolean, options?: object): Promise<void> {
  return waitFor(func, Object.assign({ interval: 1000 }, options));
}

export function uniqueArray<T>(arr: T[]): T[] {
  const unique = (value: T, index: number, self: T[]) => {
      return self.indexOf(value) === index;
  };
  return arr.filter(unique);
}

export function renderString(template: string, param?: any): string {
  return pope(template, param);
}

export function getLastWeek(): Date {
  return new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000);
}

// rootPath/owner/repo.json => owner/repo
export function parsePrivateConfigFileName(configFileName: string): string {
  const parseName = configFileName.split('.');
  if (parseName.length !== 2) return '';

  const paths = parseName[0].split('/');
  if (paths.length < 2) return '';
  if (paths.find(s => s.length === 0) !== undefined) return '';

  return join(paths[paths.length - 2], paths[paths.length - 1]);
}

export function getNanoTimeStamp(): number {
  const [ sec, nano ] = process.hrtime();
  return sec * 1e9 + nano;
}
