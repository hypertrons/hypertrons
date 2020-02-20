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

/**
 * Event handler map for event registry
 */
export class EventHandlerMap {

  private map: Map<string, any[]>;

  constructor() {
    this.map = new Map<string, any[]>();
  }

  add(key: string, func: any): void {
    const arr = this.map.get(key);
    if (arr) {
      arr.push(func);
    } else {
      this.map.set(key, Array.of(func));
    }
  }

  remove(key: string, func: any): void {
    const arr = this.map.get(key);
    if (arr) {
      const id = arr.indexOf(func);
      if (id > -1) {
        arr.splice(id, 1);
      }
    }
  }

  async exec(key: string, param: any): Promise<void> {
    const arr = this.map.get(key);
    if (arr) {
      arr.forEach(async fn => {
        await fn(param);
      });
    }
  }

}
