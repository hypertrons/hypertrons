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

import { configClass, configProp } from '../../config-generator/decorators';
import PriorityQueue from 'p-queue/dist/priority-queue';

@configClass({
  description: 'Global queue config for the promise handler. Based on p-queue. See https://github.com/sindresorhus/p-queue',
})
export class QueueConfig {

  @configProp({
    description: 'Concurrency limit.',
    defaultValue: 50,
  })
  concurrency: number = 50;

  @configProp({
    description: 'Whether queue tasks within concurrency limit, are auto-executed as soon as they are added.',
    defaultValue: true,
  })
  autoStart: boolean = true;

  @configProp({
    description: 'Class with a enqueue and dequeue method, and a size getter. See https://www.npmjs.com/package/p-queue#custom-queueclass.',
    defaultValue: PriorityQueue,
  })
  queueClass: new (...args: any) => any = PriorityQueue;

  @configProp({
    description: 'The max number of runs in the given interval of time.',
    defaultValue: Infinity,
  })
  intervalCap: number = Infinity;

  @configProp({
    description: 'The length of time in milliseconds before the interval count resets. Must be finite.',
    defaultValue: 0,
  })
  interval: number = 0;

  @configProp({
    description: 'Whether the task must finish in the given interval or will be carried over into the next interval count.',
    defaultValue: false,
  })
  carryoverConcurrencyCount: boolean = false;

  @configProp({
    description: 'Per-operation timeout in milliseconds. Operations fulfill once timeout elapses if they have not already.',
    defaultValue: 60000,
  })
  timeout: number = 60000;

  @configProp({
    description: 'Whether or not a timeout is considered an exception.',
    defaultValue: false,
  })
  throwOnTimeout: boolean = false;
}

@configClass({
  description: 'Retry strategy config for the promise handler. Based on node-retry. See https://github.com/tim-kos/node-retry#retryoperationoptions',
})
export class RetryConfig {

  @configProp({
    description: 'The maximum amount of times to retry the operation. Default is 10. Seting this to 1 means do it once, then retry it once.',
    defaultValue: 10,
  })
  retries: number = 10;

  @configProp({
    description: 'The exponential factor to use. Default is 2.',
    defaultValue: 2,
  })
  factor: number = 2;

  @configProp({
    description: 'The number of milliseconds before starting the first retry. Default is 1000.',
    defaultValue: 1000,
  })
  minTimeout: number = 1000;

  @configProp({
    description: 'The maximum number of milliseconds between two retries. Default is Infinity.',
    defaultValue: 60000,
  })
  maxTimeout: number = 60000;

  @configProp({
    description: 'Randomizes the timeouts by multiplying with a factor between 1 to 2. Default is false.',
    defaultValue: false,
  })
  randomize: boolean = false;

  @configProp({
    description: 'Whether to retry forever, defaults to false.',
    defaultValue: false,
  })
  forever: boolean = false;

  @configProp({
    description: "Whether to unref the setTimeout's, defaults to false.",
    defaultValue: false,
  })
  unref: boolean = false;

  @configProp({
    description: 'The maximum time (in milliseconds) that the retried operation is allowed to run. Default is 600000ms.',
    defaultValue: 600000,
  })
  maxRetryTime: number = 600000;
}

@configClass({
  description: 'The config for promise handler',
})
export class PHConfig {

  @configProp({
    description: 'Global queue config for the promise handler',
    classType: QueueConfig,
    defaultValue: new QueueConfig(),
  })
  queue: Partial<QueueConfig>;

  @configProp({
    description: 'Retry strategy config for the promise handler',
    classType: QueueConfig,
    defaultValue: new QueueConfig(),
  })
  retry: Partial<RetryConfig>;
}
