import { Application } from 'egg';
import { AppPluginBase } from '../../basic/AppPluginBase';
import { AppConfigManager } from './AppConfigManager';

declare module 'egg' {
  interface App {
    config: AppConfigManager;
  }
}

module.exports = (app: Application) => {
  AppPluginBase.LoadToApp('config', AppConfigManager, app);
};
