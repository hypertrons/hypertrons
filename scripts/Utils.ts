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

// tslint:disable: no-bitwise
import deflate from '../app/third_party/deflate/deflate';

export function genPlantUmlUrl(s: string): string {

  function encode64(data: any) {
    let r = '';
    for (let i = 0; i < data.length; i += 3) {
      if (i + 2 === data.length) {
        r += append3bytes(data.charCodeAt(i), data.charCodeAt(i + 1), 0);
      } else if (i + 1 === data.length) {
        r += append3bytes(data.charCodeAt(i), 0, 0);
      } else {
        r += append3bytes(data.charCodeAt(i), data.charCodeAt(i + 1),
          data.charCodeAt(i + 2));
      }
    }
    return r;
  }

  function append3bytes(b1: any, b2: any, b3: any) {
    const c1 = b1 >> 2;
    const c2 = ((b1 & 0x3) << 4) | (b2 >> 4);
    const c3 = ((b2 & 0xF) << 2) | (b3 >> 6);
    const c4 = b3 & 0x3F;
    let r = '';
    r += encode6bit(c1 & 0x3F);
    r += encode6bit(c2 & 0x3F);
    r += encode6bit(c3 & 0x3F);
    r += encode6bit(c4 & 0x3F);
    return r;
  }

  function encode6bit(b: any) {
    if (b < 10) {
      return String.fromCharCode(b + 48);
    }
    b -= 10;
    if (b < 26) {
      return String.fromCharCode(b + 65);
    }
    b -= 26;
    if (b < 26) {
      return String.fromCharCode(b + 97);
    }
    b -= 26;
    if (b === 0) {
      return '-';
    }
    if (b === 1) {
      return '_';
    }
    return '?';
  }

  s = unescape(encodeURIComponent(s));
  return 'http://www.plantuml.com/plantuml/png/' + encode64(deflate(s, 9));
}
