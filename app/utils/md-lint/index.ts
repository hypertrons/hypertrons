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

import { readFileSync, existsSync } from 'fs';
// tslint:disable-next-line: no-var-requires
const deglob = require('deglob');
// tslint:disable-next-line: no-var-requires
const gutil = require('gulp-util');

const moduleName = 'md-lint';

interface Config {
  patterns: string[];
  options: {
    useGitIgnore?: boolean;
    usePackageJson?: boolean;
    configKey?: string;
    gitIgnoreFile?: string;
    ignore?: string[];
    cwd?: string;
  };
}

function loadConfig(): Config {
  const defaultConfig: Config = {
    patterns: [ '**/*.md' ],
    options: {
      useGitIgnore: true,
      ignore: [ 'node_modules/**/*' ],
    },
  };

  if (!existsSync('./package.json')) {
    gutil.log(moduleName, gutil.colors.yellow('Can not found package.json, use default config'));
    return defaultConfig;
  }

  const packageConfig = readFileSync('./package.json').toString();
  if (packageConfig) {
    const config = JSON.parse(packageConfig);
    if (config[moduleName]) return config[moduleName];
  }

  gutil.log(moduleName, gutil.colors.yellow('Load config from package.json error, use default config'));
  return defaultConfig;
}

function getMarkdownLint() {
  // remark-preset-lint-markdown-style-guide
  // https://www.npmjs.com/package/remark-preset-lint-markdown-style-guide
  return [
    require('remark-lint'),

    // http://www.cirosantilli.com/markdown-style-guide/#file-extension
    [ require('remark-lint-file-extension'), 'md' ],

    // http://www.cirosantilli.com/markdown-style-guide/#file-name
    require('remark-lint-no-file-name-mixed-case'),
    require('remark-lint-no-file-name-articles'),
    require('remark-lint-no-file-name-irregular-characters'),
    require('remark-lint-no-file-name-consecutive-dashes'),
    require('remark-lint-no-file-name-outer-dashes'),

    // http://www.cirosantilli.com/markdown-style-guide/#newlines
    // http://www.cirosantilli.com/markdown-style-guide/#empty-lines-around-lists
    // http://www.cirosantilli.com/markdown-style-guide/#tables
    require('remark-lint-no-consecutive-blank-lines'),

    // http://www.cirosantilli.com/markdown-style-guide/#spaces-after-sentences.
    // Not enforced, cannot be done properly without false positives, if you
    // want this, use remark-retext and retext-sentence-spacing.

    // http://www.cirosantilli.com/markdown-style-guide/#line-wrapping
    // [ require('remark-lint-maximum-line-length'), 80 ], // it's too strict

    // http://www.cirosantilli.com/markdown-style-guide/#dollar-signs-in-shell-code
    require('remark-lint-no-shell-dollars'),

    // http://www.cirosantilli.com/markdown-style-guide/#what-to-mark-as-code.
    // This is a tip, not a rule.

    // http://www.cirosantilli.com/markdown-style-guide/#spelling-and-grammar.
    // Spelling is not in the scope of remark-lint.  If you want this,
    // use remark-retext and retext-spell.

    // http://www.cirosantilli.com/markdown-style-guide/#line-breaks
    require('remark-lint-hard-break-spaces'),

    // http://www.cirosantilli.com/markdown-style-guide/#headers
    [ require('remark-lint-heading-style'), 'atx' ],
    require('remark-lint-heading-increment'),
    require('remark-lint-no-duplicate-headings'),

    // http://www.cirosantilli.com/markdown-style-guide/#top-level-header
    require('remark-lint-no-multiple-toplevel-headings'),

    // http://www.cirosantilli.com/markdown-style-guide/#header-case.
    // Heading case isn’t tested yet: new rules to fix this are ok though!

    // http://www.cirosantilli.com/markdown-style-guide/#end-of-a-header.
    // Cannot be checked?

    // http://www.cirosantilli.com/markdown-style-guide/#header-length
    require('remark-lint-maximum-heading-length'),

    // http://www.cirosantilli.com/markdown-style-guide/#punctuation-at-the-end-of-headers
    [ require('remark-lint-no-heading-punctuation'), ':.' ],

    // http://www.cirosantilli.com/markdown-style-guide/#header-synonyms.
    // Cannot be checked?

    // http://www.cirosantilli.com/markdown-style-guide/#blockquotes
    [ require('remark-lint-blockquote-indentation'), 2 ],
    require('remark-lint-no-blockquote-without-marker'),

    // http://www.cirosantilli.com/markdown-style-guide/#unordered
    [ require('remark-lint-unordered-list-marker-style') ],

    // http://www.cirosantilli.com/markdown-style-guide/#ordered
    [ require('remark-lint-ordered-list-marker-style'), '.' ],
    [ require('remark-lint-ordered-list-marker-value'), 'ordered' ],

    // http://www.cirosantilli.com/markdown-style-guide/#spaces-after-list-marker
    [ require('remark-lint-list-item-indent'), 'mixed' ],

    // http://www.cirosantilli.com/markdown-style-guide/#indentation-of-content-inside-lists
    require('remark-lint-list-item-content-indent'),

    // http://www.cirosantilli.com/markdown-style-guide/#empty-lines-inside-lists
    require('remark-lint-list-item-spacing'),

    // http://www.cirosantilli.com/markdown-style-guide/#case-of-first-letter-of-list-item
    // Not checked.

    // http://www.cirosantilli.com/markdown-style-guide/#punctuation-at-the-end-of-list-items.
    // Not checked.

    // http://www.cirosantilli.com/markdown-style-guide/#definition-lists.
    // Not checked.

    // http://www.cirosantilli.com/markdown-style-guide/#code-blocks
    [ require('remark-lint-code-block-style'), 'fenced' ],
    [ require('remark-lint-fenced-code-flag'), { allowEmpty: false }],
    [ require('remark-lint-fenced-code-marker'), '`' ],

    // http://www.cirosantilli.com/markdown-style-guide/#horizontal-rules
    [ require('remark-lint-rule-style'), '---' ],

    // http://www.cirosantilli.com/markdown-style-guide/#tables
    require('remark-lint-no-table-indentation'),
    require('remark-lint-table-pipes'),
    require('remark-lint-table-pipe-alignment'),
    [ require('remark-lint-table-cell-padding'), 'padded' ],

    // http://www.cirosantilli.com/markdown-style-guide/#separate-consecutive-elements.
    // Not checked.

    // http://www.cirosantilli.com/markdown-style-guide/#span-elements
    require('remark-lint-no-inline-padding'),

    // http://www.cirosantilli.com/markdown-style-guide/#reference-style-links
    require('remark-lint-no-shortcut-reference-image'),
    require('remark-lint-no-shortcut-reference-link'),
    require('remark-lint-final-definition'),
    require('remark-lint-definition-case'),
    require('remark-lint-definition-spacing'),

    // http://www.cirosantilli.com/markdown-style-guide/#single-or-double-quote-titles
    [ require('remark-lint-link-title-style'), '"' ],

    // http://www.cirosantilli.com/markdown-style-guide/#bold
    [ require('remark-lint-strong-marker'), '*' ],

    // http://www.cirosantilli.com/markdown-style-guide/#italic
    [ require('remark-lint-emphasis-marker'), '*' ],

    // http://www.cirosantilli.com/markdown-style-guide/#uppercase-for-emphasis.
    // Not checked.

    // http://www.cirosantilli.com/markdown-style-guide/#emphasis-vs-headers
    require('remark-lint-no-emphasis-as-heading'),

    // http://www.cirosantilli.com/markdown-style-guide/#automatic-links-without-angle-brackets
    require('remark-lint-no-literal-urls'),

    // http://www.cirosantilli.com/markdown-style-guide/#content-of-automatic-links
    require('remark-lint-no-auto-link-without-protocol'),

    // http://www.cirosantilli.com/markdown-style-guide/#email-automatic-links.
    // Not checked.

    // [ require('remark-lint-no-dead-urls') ],
    require('remark-lint-final-newline'),
    require('remark-lint-list-item-bullet-indent'),
    require('remark-lint-no-duplicate-definitions'),
    require('remark-lint-no-heading-content-indent'),
    require('remark-lint-no-undefined-references'),
    require('remark-lint-no-unused-definitions'),
  ];

}

function doCheck(files: string[]) {
  const remark = require('remark');
  const report = require('vfile-reporter');
  const remarkInstance = remark().use(getMarkdownLint());
  files.forEach(filePath => {
    const mdContent = readFileSync(filePath, 'utf8');
    if (mdContent) {
      remarkInstance.process(mdContent, (err: any, file: any) => {
        const res = report(err || file);
        console.log(filePath);
        console.log(res);
        console.log();
        if (res !== 'no issues found') process.exitCode = -1;
      });
    }
  });
}

const config = loadConfig();
deglob(config.patterns, config.options, (err: any, files: string[]) => {
  if (err) {
    gutil.log(moduleName, gutil.colors.red(err));
    process.exit(-1);
  }
  doCheck(files);
});
