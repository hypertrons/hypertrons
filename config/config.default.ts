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

import { EggAppConfig, EggAppInfo, PowerPartial, Context } from 'egg';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

export default (appInfo: EggAppInfo) => {
  const config = {} as PowerPartial<EggAppConfig>;

  // override config from framework / plugin
  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1573536988115_9104';

  // add your egg config in here
  config.middleware = [];

  config.security = {
    csrf: {
      enable: false,
    },
  };

  config.onerror = {
    all(err: any, ctx: Context) {
      try {
        ctx.app.errorManager.handleError('Global Onerror Uncatched Error', err);
      } catch (error) {
        ctx.logger.error(error);
      }
    },
  };

  // add your special config in here
  const bizConfig = {
    sourceUrl: `https://github.com/eggjs/examples/tree/master/${appInfo.name}`,
  };

  let pluginConfig = {};
  const globalConfigPath = process.env.GLOBAL_CONFIG;
  if (globalConfigPath) {
    const globalConfigFilePath = join(appInfo.baseDir, globalConfigPath);
    if (existsSync(globalConfigFilePath)) {
      pluginConfig = JSON.parse(readFileSync(globalConfigFilePath).toString());
    }
  }

  // the return config will combines to EggAppConfig
  return {
    ...pluginConfig,
    ...config,
    ...bizConfig,
  };
};
