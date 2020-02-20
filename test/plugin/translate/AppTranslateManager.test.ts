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
import { TranslateResult, DetectResult } from '../../../app/plugin/translate/AppTranslateManager';
import { prepareTestApplication, testClear } from '../../Util';
import { Application } from 'egg';

describe('AppTranslateManager', () => {
  let app: Application;

  beforeEach(async () => {
    ({ app } = await prepareTestApplication());
  });
  afterEach(() => {
    testClear(app);
  });

  it('Test translate string correct', async () => {
    (app.translate as any).newTranslator = (_key: string) => {
      return {
        translate: (strings: string, _target: string, cb: (err: any, result: any) => void) => {
          const result: TranslateResult = {
            translatedText: 'apple',
            originalText: strings,
            detectedSourceLanguage: 'zh-CN',
          };
          cb(null, result);
        },
      };
    };
    const res: any = await app.translate.translate('', '苹果', 'en');
    assert.strictEqual(res.translatedText, 'apple');
  });

  it('Test translate string array correct, array length = 1', async () => {
    (app.translate as any).newTranslator = (_key: string) => {
      return {
        translate: (strings: string, _target: string, cb: (err: any, result: any) => void) => {
          const result: TranslateResult = {
            translatedText: '苹果',
            originalText: strings,
            detectedSourceLanguage: 'en',
          };
          cb(null, result);
        },
      };
    };
    const originalText: string[] = [ 'apple' ];
    const expectedText: string[] = [ '苹果' ];
    const target = 'zh-CN';
    const res: any = await app.translate.translate('', originalText, target);
    assert.strictEqual(Array.isArray(res), true);
    for (const i in originalText) {
      assert.strictEqual(res[i].translatedText, expectedText[i]);
    }
  });

  it('Test translate string array correct, array length > 1', async () => {
    (app.translate as any).newTranslator = (_key: string) => {
      return {
        translate: (strings: string[], _target: string, cb: (err: any, result: any) => void) => {
          const result: TranslateResult[] = [
            {
              translatedText: '苹果',
              originalText: strings[0],
              detectedSourceLanguage: 'en',
            },
            {
              translatedText: '香蕉',
              originalText: strings[1],
              detectedSourceLanguage: 'en',
            },
          ];
          cb(null, result);
        },
      };
    };
    const originalText: string[] = [ 'apple', 'banana' ];
    const expectedText: string[] = [ '苹果', '香蕉' ];
    const target = 'zh-CN';
    const res: any = await app.translate.translate('', originalText, target);
    assert.strictEqual(Array.isArray(res), true);
    for (const i in originalText) {
      assert.strictEqual(res[i].translatedText, expectedText[i]);
    }
  });

  describe('Test error hanppend when translate', () => {
    beforeEach(async () => {
      (app.translate as any).newTranslator = (_key: string) => {
        return {
          translate: (_strings: string, _target: string, cb: (err: any, result?: any) => void) => {
            cb('ERROR_TEST_TRANSLATE');
          },
        };
      };
    });
    it('translate string error', async () => {
      const res: any = await app.translate.translate('', '苹果', 'en');
      assert.strictEqual(res, undefined);
    });

    it('test translate array error', async () => {
      const res = await app.translate.translate('', [ 'apple', 'banana' ], 'zh-CN');
      assert.strictEqual(res, undefined);
    });
  });

  it('Test detectLanguage correct', async () => {
    (app.translate as any).newTranslator = (_key: string) => {
      return {
        detectLanguage: (strings: string, cb: (err: any, result: any) => void) => {
          const result: DetectResult = {
            language: 'en',
            isReliable: true,
            confidence: 1,
            originalText: strings,
          };
          cb(null, result);
        },
      };
    };
    const res: DetectResult = await app.translate.detectLanguage('', 'apple');
    assert.strictEqual(res.language, 'en');
  });

  it('Test error hanppend when detectLanguage', async () => {
    (app.translate as any).newTranslator = (_key: string) => {
      return {
        detectLanguage: (_strings: string, cb: (err: any, result?: any) => void) => {
          cb('ERROR_TEST_DETECTLANGUAGE');
        },
      };
    };
    const res: DetectResult = await app.translate.detectLanguage('', 'apple');
    assert.strictEqual(res, undefined);
  });
});
