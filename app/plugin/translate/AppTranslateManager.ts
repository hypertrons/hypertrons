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

import { AppPluginBase } from '../../basic/AppPluginBase';
import googleTranslate from 'google-translate';

export interface TranslateResult {
  translatedText: string;
  originalText: string;
  detectedSourceLanguage: string;
}

export interface DetectResult {
  language: string;
  isReliable: boolean;
  confidence: number;
  originalText: string;
}

export class AppTranslateManager extends AppPluginBase<null> {

  public async onReady(): Promise<void> { }

  public async onStart(): Promise<void> { }

  public async onClose(): Promise<void> { }

  private newTranslator(key: string): any {
    return googleTranslate(key);
  }

  public async translate<T extends string | string[]>(googleTranslationKey: string, src: T, to: string): Promise<T extends string ? TranslateResult : TranslateResult[]> {
    return new Promise<any>(resolve => {
      this.newTranslator(googleTranslationKey).translate(src, to, (err: any, result: any): void => {
        if (err) {
          this.logger.error('Error happened when translate. ' +
            `err=${JSON.stringify(err)}, src=${src}`);
          resolve();
        } else {
          if (!Array.isArray(src)) {
            resolve({
              translatedText: result.translatedText,
              originalText: result.originalText,
              detectedSourceLanguage: result.detectedSourceLanguage,
            });
          } else if (src.length > 1) {
            resolve(result.map((res: any) => {
              return {
                translatedText: res.translatedText,
                originalText: res.originalText,
                detectedSourceLanguage: res.detectedSourceLanguage,
              };
            }));
          } else {
            resolve([{
              translatedText: result.translatedText,
              originalText: result.originalText,
              detectedSourceLanguage: result.detectedSourceLanguage,
            }]);
          }
        }
      });
    });
  }

  public async detectLanguage(googleTranslationKey: string, src: string): Promise<DetectResult> {
    return new Promise<DetectResult>(resolve => {
      this.newTranslator(googleTranslationKey).detectLanguage(src, (err: any, result: any) => {
        if (err) {
          this.logger.error(`Error happened when detect language. err=${err}, src=${src}`);
          resolve();
        } else {
          resolve({
            language: result.language,
            isReliable: result.isReliable,
            confidence: result.confidence,
            originalText: result.originalText,
          });
        }
      });
    });
  }
}
