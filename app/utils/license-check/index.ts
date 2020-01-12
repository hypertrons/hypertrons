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

import defaultConfig from './config';
import * as gutil from 'gulp-util';
import * as gulp from 'gulp';
// tslint:disable-next-line: no-var-requires
const license = require('gulp-license-check');

let blocking = false;
let logInfo = false;
let logError = true;

function initParam() {
  const argv = require('yargs').argv;
  blocking = (argv.blocking === 'true' ? true : false);
  logInfo = (argv.logInfo === 'true' ? true : false);
  logError = (argv.logError === 'false' ? false : true);
}

function doCheck(files: string[], licenseHeaderPath: string) {
  files.forEach(filePath => {
    gulp.src(filePath).pipe(license({
      path: licenseHeaderPath,
      blocking,
      logInfo,
      logError,
    }));
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
