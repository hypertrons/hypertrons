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

import PQueue from 'p-queue/dist';
import pRetry = require('p-retry');
import { PHConfig, QueueConfig, RetryConfig } from './ph-config';

declare type Task<TaskResultType> = (() => PromiseLike<TaskResultType>) | (() => TaskResultType);

export default class PromiseHandler {
  private queue: PQueue;
  private queueConfig: QueueConfig;
  private retryConfig: RetryConfig;

  constructor(config?: Partial<PHConfig>) {
    this.queueConfig = {
      ...new QueueConfig(),
      ...config?.queue,
    };
    this.retryConfig = {
      ...new RetryConfig(),
      ...config?.retry,
    };
    this.queue = new PQueue(this.queueConfig);
  }

  add<TaskResultType>(fn: Task<TaskResultType>): Promise<TaskResultType> {
    return this.queue.add(async () => await pRetry(fn, this.retryConfig));
  }

  getQueue(): PQueue {
    return this.queue;
  }

  getQueueConfig(): QueueConfig {
    return this.queueConfig;
  }

  getRetryConfig(): RetryConfig {
    return this.retryConfig;
  }
}
