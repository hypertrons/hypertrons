import { Application } from 'egg';
import { AppInstallationManager } from './AppInstallationManager';
import { AppPluginBase } from '../../basic/AppPluginBase';

declare module 'egg' {
  interface Application {
    installation: AppInstallationManager;
  }
}

module.exports = (app: Application) => {
  AppPluginBase.LoadToApp('installation', AppInstallationManager, app);
};
