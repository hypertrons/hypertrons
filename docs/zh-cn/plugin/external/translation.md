# 翻译

`hypertrons` 提供了翻译插件，可供其他插件或组件使用。目前支持 `Google 翻译`。

## 接口说明

### 文本翻译

该接口提供翻译功能。

```ts
public async translate<T extends string | string[]>(googleTranslationKey: string, src: T, to: string): Promise<T extends string ? TranslateResult : TranslateResult[]>
```

参数说明：

- `googleTranslationKey`: `Google 翻译`的 `API key`。   
- `src`: 待翻译的字符串或字符串数组。
- `to`: 目标语言。查看[支持的语言种类](https://cloud.google.com/translate/docs/languages)。

返回结果说明：

- 如果传入的参数 `src` 为字符串，则返回对应的`TranslateResult`。
- 如果传入的参数`src`为字符串数组，则返回对应的`TranslateResult`数组。

`TranslateResult` 结构体声明如下。

```ts
export interface TranslateResult {
  translatedText: string;
  originalText: string;
  detectedSourceLanguage: string;
}
```

其中：

- `originalText` 为原文本。
- `translatedText` 为翻译之后的文本。
- `detectedSourceLanguage` 为检测到的原文本的语言种类。

### 检测语言种类

该接口提供语言种类检测功能。查看[支持的语言种类](https://cloud.google.com/translate/docs/languages)。

```ts
public async detectLanguage(googleTranslationKey: string, src: string): Promise<DetectResult>
```

参数说明：

- `googleTranslationKey`: `Google 翻译`的 `API key`。   
- `src`: 待检测的字符串。

返回结果说明：返回对应的`DetectResult`。该结构体声明如下。

```ts
export interface DetectResult {
  language: string;
  isReliable: boolean;
  confidence: number;
  originalText: string;
}
```

其中：

- `language` 为检测出来的语言种类。
- `isReliable` 表示检测结果是否可靠。
- `confidence` 为检测结果可信度。
- `originalText` 为原文本。
