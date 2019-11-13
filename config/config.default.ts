import { EggAppConfig, EggAppInfo, PowerPartial } from 'egg';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

export default (appInfo: EggAppInfo) => {
  const config = {} as PowerPartial<EggAppConfig>;

  // override config from framework / plugin
  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1573536988115_9104';

  // add your egg config in here
  config.middleware = [];

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
