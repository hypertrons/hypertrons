# Translation

`hypertrons` provides translation function for other plugins or components to use. It currently works with the `Google Translation API`.

## API

### Translate

Translate one or more strings.

```ts
public async translate<T extends string | string[]>(googleTranslationKey: string, src: T, to: string): Promise<T extends string ? TranslateResult : TranslateResult[]>
```

Parameters：

- `googleTranslationKey`: Google Translation API key.   
- `src`: Can be a string or an array of strings.
- `to`: Language to translate to. [Available languages](https://cloud.google.com/translate/docs/languages).

Then it would return the `TranslateResult` (or an array of `TranslateResult`) which is defined as:

```ts
export interface TranslateResult {
  translatedText: string;
  originalText: string;
  detectedSourceLanguage: string;
}
```

### Detect language

Detect language of the given string.

```ts
public async detectLanguage(googleTranslationKey: string, src: string): Promise<DetectResult>
```

Parameters：

- `googleTranslationKey`: Google Translation API key.   
- `src`: The string to be detected。

Then it would return the `DetectResult` which is defined as:

```ts
export interface DetectResult {
  language: string;
  isReliable: boolean;
  confidence: number;
  originalText: string;
}
```
