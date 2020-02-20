// Copyright 2019 - present Xlab
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { Application } from 'egg';
import { GloablEvents } from './app/basic/Utils';

export default class AppBootHook {
  private app: Application;
  constructor(app: Application) {
    this.app = app;
    app.messenger.setMaxListeners(20);
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
