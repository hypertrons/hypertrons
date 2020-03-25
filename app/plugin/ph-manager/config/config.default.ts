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

import PriorityQueue from 'p-queue/dist/priority-queue';

export default {
  phManager: {
    client: {
      queue: {
        concurrency: 50,
        autoStart: true,
        queueClass: PriorityQueue,
        intervalCap: Infinity,
        interval: 0,
        carryoverConcurrencyCount: false,
        timeout: 60000,
        throwOnTimeout: false,
      },
      retry: {
        retries: 10,
        factor: 2,
        minTimeout: 1000,
        maxTimeout: 60000,
        randomize: false,
        forever: false,
        unref: false,
        maxRetryTime: 600000,
      },
    },
  },
};
