import { Application } from 'egg';
import { GloablEvents } from './app/basic/Utils';

export default class AppBootHook {
  private app: Application;
  constructor(app: Application) {
    this.app = app;
  }

  async willReady() {
    this.app.messenger.broadcast(GloablEvents.READY, {});
  }

  async serverDidReady() {
    this.app.messenger.broadcast(GloablEvents.START, {});
  }

  async beforeClose() {
    this.app.messenger.broadcast(GloablEvents.CLOSE, {});
  }
}
