import { Application } from 'egg';
import { AppPluginBase } from '../../basic/AppPluginBase';
import { AppConfigManager } from './AppConfigManager';

declare module 'egg' {
  interface App {
    configManager: AppConfigManager;
  }
}

module.exports = (app: Application) => {
  AppPluginBase.LoadToApp('configManager', AppConfigManager, app);
};
