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

import assert from 'assert';
import { configClass, configProp, getConfigMeta } from '../../app/config-generator/decorators';

describe('ConfigGenerator', () => {

  const structure = {
    description: 'Test',
    type: 'object',
    properties: [
      {
        name: 'boolValue',
        type: 'boolean',
        description: 'Boolean value',
        defaultValue: true,
        scope: 'public',
        optional: false,
      },
      {
        name: 'stringValue',
        type: 'string',
        description: 'String value',
        defaultValue: 'default string',
        scope: 'public',
        optional: false,
      },
      {
        name: 'numberPrivateValue',
        type: 'number',
        description: 'Number value',
        defaultValue: 10,
        scope: 'private',
        optional: false,
      },
      {
        name: 'arrayValue',
        description: 'Nest array',
        type: 'array',
        scope: 'public',
        optional: true,
        arrayType: {
          description: 'Nest type',
          type: 'object',
          properties: [
            {
              name: 'field',
              description: 'Field',
              type: 'string',
              defaultValue: 'field',
              scope: 'public',
              optional: false,
            },
          ],
        },
        defaultValue: [
          {
            field: 'test',
          },
        ],
      },
      {
        name: 'nestValue',
        description: 'Nest type',
        type: 'object',
        scope: 'private',
        optional: false,
        properties: [
          {
            name: 'field',
            type: 'string',
            description: 'Field',
            defaultValue: 'field',
            scope: 'public',
            optional: false,
          },
        ],
      },
    ],
  };

  @configClass({
    description: 'Nest type',
  })
  class NestType {
    @configProp({
      description: 'Field',
      defaultValue: 'field',
    })
    field: string;
  }

  @configClass({
    description: 'Test',
  })
  class Config {

    @configProp({
      description: 'Boolean value',
      defaultValue: true,
    })
    boolValue: boolean;

    @configProp({
      description: 'String value',
      defaultValue: 'default string',
    })
    stringValue: string;

    @configProp({
      description: 'Number value',
      defaultValue: 10,
      scope: 'private',
    })
    numberPrivateValue: number;

    @configProp({
      description: 'Nest array',
      arrayType: NestType,
      defaultValue: [{ field: 'test' }],
      optional: true,
    })
    arrayValue: NestType[];

    @configProp({
      description: 'Nest value',
      type: 'object',
      classType: NestType,
      scope: 'private',
      defaultValue: new NestType(),
    })
    nestValue: NestType;
  }

  // this stringify will sort the keys of object and array items to ensure the orders
  const stringify = (obj: any): string => {
    const type = typeof obj;
    let ret = '';
    if (Array.isArray(obj)) {
      const arr = obj as any[];
      ret += '[' + arr.sort((a, b) => a.name > b.name ? 1 : -1).map(stringify).join(',') + ']';
    } else if (type === 'object') {
      let properties = '';
      const keys = Object.keys(obj).sort((a, b) => a > b ? 1 : -1);
      keys.forEach((key, index) => {
        properties += `"${key}":${stringify(obj[key])}`;
        if (index !== keys.length - 1) {
          properties += ',';
        }
      });
      ret = `{${properties}}`;
    } else if (type === 'string') {
      ret += `"${obj}"`;
    } else {
      ret += String(obj);
    }
    return ret;
  };

  it('Should generate correct types and correct default value', () => {
    const meta = getConfigMeta(Config);
    assert(stringify(meta) === stringify(structure));
  });

});
