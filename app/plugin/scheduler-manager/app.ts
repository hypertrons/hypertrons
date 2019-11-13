import { Application } from 'egg';
import { AppSchedulerManager } from './AppSchedulerManager';
import { AppPluginBase } from '../../basic/AppPluginBase';

declare module 'egg' {
  interface Application {
    sched: AppSchedulerManager;
  }
}

module.exports = (app: Application) => {
  AppPluginBase.LoadToApp('sched', AppSchedulerManager, app);
};
