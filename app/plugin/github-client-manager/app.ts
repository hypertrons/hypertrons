import { Application } from 'egg';
import { AppGitHubClientManager } from './AppGitHubClientManager';
import { AppPluginBase } from '../../basic/AppPluginBase';

declare module 'egg' {
  interface Application {
    githubClient: AppGitHubClientManager;
  }
}

module.exports = (app: Application) => {
  AppPluginBase.LoadToApp('githubClient', AppGitHubClientManager, app);
};
