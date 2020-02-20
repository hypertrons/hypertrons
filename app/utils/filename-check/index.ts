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

const moduleName = 'filename-check';

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
    patterns: [ '*' ],
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

function doCheck(files: string[]) {
  const baseLen = process.cwd().length;
  files.forEach(filePath => {
    const relativePath = filePath.substr(baseLen + 1, filePath.length - baseLen);
    if (relativePath.toLowerCase() !== relativePath) {
      gutil.log(moduleName, gutil.colors.red(`${relativePath} contains uppercase characters`));
      process.exitCode = -1;
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
