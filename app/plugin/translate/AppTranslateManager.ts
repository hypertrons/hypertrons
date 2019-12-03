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

import { AppPluginBase } from '../../basic/AppPluginBase';
import googleTranslate from 'google-translate';

export interface Translator {
    translate(strings: string, target: string): Promise<TranslateResult>;
    translateArray(strings: string[], target: string): Promise<TranslateResult[]>;
    detectLanguage(strings: string): Promise<DetectResult>;
}

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

  public async translate(googleTranslationKey: string, strings: string, target: string): Promise<TranslateResult> {
      return this.getTranslator(googleTranslationKey).translate(strings, target);
  }

  public async translateArray(googleTranslationKey: string, strings: string[], target: string): Promise<TranslateResult[]> {
      return this.getTranslator(googleTranslationKey).translateArray(strings, target);
  }

  public async detectLanguage(googleTranslationKey: string, strings: string): Promise<DetectResult> {
      return this.getTranslator(googleTranslationKey).detectLanguage(strings);
  }

  private newTranslator(key: string): any {
      return googleTranslate(key);
  }

  private getTranslator(key: string): Translator {
    const translator = this.newTranslator(key);
    return {
        translate: (strings: string, target: string): Promise<TranslateResult> => {
            return new Promise<TranslateResult>(resolve => {
                translator.translate(strings, target, (err: any, result: any): void => {
                    if (err) {
                        this.logger.error('Error happened when translate. ' +
                            `err=${JSON.stringify(err)}, strings=${strings}`);
                        resolve();
                    } else {
                        resolve({
                            translatedText: result.translatedText,
                            originalText: result.originalText,
                            detectedSourceLanguage: result.detectedSourceLanguage,
                        });
                    }
                });
            });
        },
        translateArray: (strings: string[], target: string): Promise<TranslateResult[]> => {
            return new Promise<TranslateResult[]>(resolve => {
                translator.translate(strings, target, (err: any, result: any[]): void => {
                    if (err) {
                        this.logger.error('Error happened when translateArray. ' +
                            `err=${JSON.stringify(err)}, strings=${strings}`);
                        resolve();
                    } else {
                        resolve(result.map((res: any) => {
                            return {
                                translatedText: res.translatedText,
                                originalText: res.originalText,
                                detectedSourceLanguage: res.detectedSourceLanguage,
                            };
                        }));
                    }
                });
            });
        },
        detectLanguage: (strings: string): Promise<DetectResult> => {
            return new Promise<DetectResult>(resolve => {
                translator.detectLanguage(strings, (err: any, result: any) => {
                    if (err) {
                        this.logger.error(`Error happened when detect language. err=${err}, strings=${strings}`);
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
        },
    };
    }
}
