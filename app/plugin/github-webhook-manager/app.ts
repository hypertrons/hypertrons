import { Application } from 'egg';
import { GitHubWebhook } from './GitHubWebhook';
import { AppPluginBase } from '../../basic/AppPluginBase';

declare module 'egg' {
  interface Application {
    githubWebhook: GitHubWebhook;
  }
}

module.exports = (app: Application) => {
  AppPluginBase.LoadToApp('githubWebhook', GitHubWebhook, app);
};
