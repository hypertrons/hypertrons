import { EggPlugin } from 'egg';
import { join } from 'path';

const plugin: EggPlugin = {
  event: {
    enable: true,
    path: join(__dirname, '../app/plugin/event-manager'),
  },

  sched: {
    enable: true,
    path: join(__dirname, '../app/plugin/scheduler-manager'),
  },

  installation: {
    enable: true,
    path: join(__dirname, '../app/plugin/installation-manager'),
  },

  githubClient: {
    enable: true,
    path: join(__dirname, '../app/plugin/github-client-manager'),
  },
};

export default plugin;
