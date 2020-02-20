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

import defaultConfig from './config';
import * as gutil from 'gulp-util';
import { readFileSync } from 'fs';

let logInfo = true;

function initParam() {
  const argv = require('yargs').argv;
  logInfo = (argv.logInfo === 'false' ? false : true);
}

function doCheck(files: string[], licenseHeaderPaths: string[]) {

  // load headers
  const licenseHeaders: string[] = [];
  try {
    // tslint:disable-next-line: prefer-for-of
    for (let i = 0; i < licenseHeaderPaths.length; i++) {
      licenseHeaders.push(readFileSync(licenseHeaderPaths[i]).toString());
    }
  } catch (e) {
    gutil.log('license-check', gutil.colors.red(`load license header from ${licenseHeaderPaths} error, ${e}`));
    process.exit(-1);
  }

  files.forEach(filePath => {
    const fileContent = readFileSync(filePath).toString();
    let find = false;
    // tslint:disable-next-line: prefer-for-of
    for (let i = 0; i < licenseHeaders.length; i++) {
      if (fileContent.indexOf(licenseHeaders[i]) === 0) {
        find = true;
        break;
      }
    }
    if (!find) {
      process.exitCode = -1;
      gutil.log('license-check', gutil.colors.red(`${filePath} doesn't contain the license header`));
    } else if (logInfo) {
      gutil.log('license-check', gutil.colors.green(`${filePath} ok`));
    }
  });
}

function run() {
  const deglob = require('deglob');
  defaultConfig.sources.forEach(config => {
    deglob(config.src.patterns, config.src.options, (err: any, files: string[]) => {
      if (err) {
        gutil.log('license-check', gutil.colors.red(err));
        process.exit(-1);
      }
      doCheck(files, config.licenseHeaderPath);
    });
  });
}

initParam();
run();
