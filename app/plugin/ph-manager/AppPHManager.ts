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
import { AppPluginBase } from '../../basic/AppPluginBase';
import PromiseHandler from './promise-handler';
import { PHConfig } from './ph-config';

export class AppPHManager extends AppPluginBase<any> {

  private promiseHandler: PromiseHandler;

  constructor(config: PHConfig, app: Application) {
    super(config, app);
    this.promiseHandler = new PromiseHandler(config);
  }

  public async onReady(): Promise<void> { }

  public async onStart(): Promise<void> { }

  public async onClose(): Promise<void> { }

  public getPromiseHandler() {
    return this.promiseHandler;
  }

}
