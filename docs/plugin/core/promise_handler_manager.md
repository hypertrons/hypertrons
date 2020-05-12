# Promise Handler Manager

Promise manager is an asynchronous task queue plug-in provided by hypertrons. For asynchronous tasks added to the manager, the manager will automatically perform concurrent control of the Promise task and retry overtime based on the configured parameters.

## How to use

### How to call

1. Get Manager

Promise-Handler has been integrated as a core plug-in for hypertrons, and you can obtain a globally unique Promise manager from the app instance of the application.

```ts
import PromiseHandler from 'app/plugin/ph-manager/promise-handler';

PromiseHandler ph = this.app.phManager.getPromiseHandler();
```

2. Add task

After obtaining the Promise Manager, you can call the PromiseHandler add method to add a Promise task to the queue. The Promise Manager will determine the timing and sequence of each Promise execution based on the configured parameters. The configuration includes but is not limited to: the number of concurrently executing promises, the timeout time of each promise, the number of retries after timeout, etc.

The parameters received by the add method are wrapped asynchronous functions

``` ts
// The role of delay is to make the code execute after x milliseconds sleep
import delay from 'delay';
import PromiseHandler from 'app/plugin/ph-manager/promise-handler';

PromiseHandler ph = this.app.phManager.getPromiseHandler()
// If the Promise controller limits only one parallel task, then
// After 50ms, the console outputs 🐯, and after 10ms, the console outputs 🐼
// Even if the second added task sleeps shorter than the first
ph.add(async () => { await delay(50); console.log('🐯'); });
ph.add(async () => { await delay(10); console.log('🐼'); });
```

### Global configuration

The various parameters of the Promise Manager are configured in globalConfig.json in the following form:

```json
{
  "phManager": {
    "client": {
      "queue": {
        "concurrency": 50,
        "autoStart": true,
        "intervalCap": 600000,
        "interval": 0,
        "carryoverConcurrencyCount": false,
        "timeout": 60000,
        "throwOnTimeout": false
      },
      "retry": {
        "retries": 10,
        "factor": 2,
        "minTimeout": 1000,
        "maxTimeout": 60000,
        "randomize": false,
        "forever": false,
        "unref": false,
        "maxRetryTime": 600000
      }
    }
  }
}
```

See below for detailed description of each parameter.
Note: Since globalConfig is a json file, only numbers and string types can be configured, so attributes such as queue class cannot be configured here.

### Parameter Description

See `app/plugin/ph-manager/ph-config.ts` for details

### 1. QueueConfig

Configure the parameters for concurrent and sequential tasks.

- concurrency

Number type. The maximum number of tasks to be executed simultaneously, default 50.

- autoStart

Boolean type. Whether to start the task as soon as possible after joining the queue (as long as the concurrent volume allows it), the default is.

- queueClass

The constructor of the queue class. The class that defines the queue, which defaults to the PriorityQueue defined by p-queue.

- intervalCap

Number type. The maximum value of tasks allowed to be executed within a certain time interval, the default is infinite.

- interval

Number type, must be finite. The time interval in the previous configuration, the default is 0, that is, this configuration is not enabled.

- carryoverConcurrencyCount

Boolean type. Whether the task needs to be completed within a given time interval, the default is no.

- timeout

Number type. Tasks that exceed this time will be returned directly regardless of the result. The default is 60000 (60s).

- throwOnTimeout

Boolean type. Whether to use timeout as an exception, the default is no.

### 2. RetryConfig

Configure the parameters for retrying when each task times out or fails.

- retries

Number type. Each task will be retried a few times at most, the default 10, 0 means no retry.

- factor

Number type. Added random factor for exponential growth of retry time, default 2.

- minTimeout

Number type. Time interval for the first retry, default 1000 (1s).

- maxTimeout

Number type. The maximum time interval between two retries, the default is 60000 (60s).

- randomize

Boolean type. Whether to multiply the interval between each retry by a number between 1 and 2. The default is no, that is, the interval between each retry is equal.

- forever

Boolean type. Whether to keep retrying until the task is successful, the default is no.

- unref

Boolean type. Parameters inherited from p-retry, default is no.

- maxRetryTime

Number type. The maximum time allowed for a single task timeout retry, the default is 600000 (600s).

## Mechanism

The Promise Manager is based on two npm packages: p-queue and p-retry. The former provides task queue management, and the latter provides a retry mechanism. The configuration parameters are also based on this.

### p-queue

Refer to [p-queue](https://www.npmjs.com/package/p-queue) for configuration settings.

### p-retry

Refer to [p-retry](https://www.npmjs.com/package/p-retry).

For configuration, please refer to [node-retry](https://github.com/tim-kos/node-retry#retryoperationoptions).
