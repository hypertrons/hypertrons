import { Application } from 'egg';
import { AppEventManager } from './AppEventManager';
import { AppPluginBase } from '../../basic/AppPluginBase';

declare module 'egg' {
  interface Application {
    event: AppEventManager;
  }
}

module.exports = (app: Application) => {
  AppPluginBase.LoadToApp('event', AppEventManager, app);
};
