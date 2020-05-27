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
import { readFileSync } from 'fs';

let database: string;
try {
  const globalConfig = readFileSync('./globalConfig.json').toString();
  const config = JSON.parse(globalConfig);
  database = config.dataSource.database ? config.dataSource.database : 'None';
  console.log(`Gonna use ${database} as data source`);
} catch (e) {
  console.log(`Error on reading data source config, e=${e.message ? e.message : e}`);
  database = 'None';
}

export function dataSource(): MethodDecorator {
  return (target, property, descriptor: any) => {
    const obj = target as any;
    const key = String(property);
    if (database !== 'None') {
      try {
        descriptor.value = obj[key + database];
      } catch (e) {
        console.log(`Error on setting data source for query ${key}, e=${e.message ? e.message : e}`);
      }
    }
    return descriptor;
  };
}
