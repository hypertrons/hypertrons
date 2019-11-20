// Copyright 2019 Xlab
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
import { BotLogger } from './Utils';

export class ComponentHelper {

  private componentMap: Map<string, any>;

  constructor() {
    this.componentMap = new Map<string, any>();
  }

  public register(name: string, component: any) {
    this.componentMap.set(name, component);
  }

  public getComponent(name: string): any {
    return this.componentMap.get(name);
  }

}

export interface ComponentContext<T> {
  helper: ComponentHelper;
  app: Application;
  config: T;
  logger: BotLogger;
}
