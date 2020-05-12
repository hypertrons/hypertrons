# Promise 管理器

Promise 管理器是 hypertrons 提供的一个异步任务队列插件。对于加入该管理器中的异步任务，管理器会根据配置的参数自动进行 Promise 任务的并发控制、超时重试。

## 使用方式

### 调用方式

1. 获取管理器

Promise-Handler 已作为 hypertrons 一个核心插件集成，可以从应用的 app 实例中获取全局唯一的 Promise 管理器。

``` ts
import PromiseHandler from 'app/plugin/ph-manager/promise-handler';

PromiseHandler ph = this.app.phManager.getPromiseHandler();
```

2. 添加任务

获取到 Promise 管理器以后，可调用 PromiseHandler 的 add 方法向队列中添加 Promise 任务。Promise 管理器会根据配置的参数决定各个 Promise 执行的时间和顺序。配置包括但不限于：并发执行的 Promise 数量、每个 Promise 的超时时间、超时后重试的次数等。

add 方法接收的参数是包装好的异步函数

``` ts
// delay 的作用是令代码在 x 毫秒休眠以后再执行
import delay from 'delay';
import PromiseHandler from 'app/plugin/ph-manager/promise-handler';

PromiseHandler ph = this.app.phManager.getPromiseHandler()
// 若 Promise 控制器限制并行任务只能有一个，则
// 50ms 以后，控制台输出 🐯，再过 10ms 以后，控制台输出 🐼
// 即使第二个添加的任务休眠的时间比第一个短
ph.add(async () => { await delay(50); console.log('🐯'); });
ph.add(async () => { await delay(10); console.log('🐼'); });
```

### 全局配置

Promise 管理器的各个参数在 globalConfig.json 中配置，形式如下：

``` json
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

各参数的详细说明见下。
注：由于 globalConfig 是 json 文件，只能配置数字、字符串类型，因此队列类等属性暂时无法在此配置

### 参数说明

详情可参见 `app/plugin/ph-manager/ph-config.ts`.

### 1. QueueConfig 队列配置

配置任务并发、顺序进行的参数。

- concurrency 并发量

数值类型。同时执行的任务的最大数量，默认 50.

- autoStart 任务是否自动执行

布尔类型。加入队列以后任务是否尽可能快地开始执行（只要并发量允许就开始执行），默认是。

- queueClass 队列类

类的构造方法。定义队列的类，默认为 p-queue 定义的优先队列 PriorityQueue.

- intervalCap 单位时间内最多执行次数

数值类型。在一定时间间隔内允许执行的任务的最大值，默认无穷大。

- interval 单位时间定义

数值类型，必须是有限大。上一项配置中的时间间隔，默认 0，即不启用这项配置。

- carryoverConcurrencyCount 任务完成策略

布尔类型。任务是否需要在给定时间间隔内完成，默认否。

- timeout 超时时间

数值类型。超过这个时间的任务无论结果如何都会直接返回，默认 60000 （60s）.

- throwOnTimeout 超时是否作为一个异常

布尔类型。是否将超时作为一个异常，默认否。

### 2. RetryConfig 重试配置

配置每个任务超时或错误时，重试的参数。

- retries 重试次数

数值类型。每个任务最多会重试几次，默认 10, 0 表示不重试。

- factor 重试间隔计算因子

数值类型。加入的重试时间指数增长随机因子，默认 2.

- minTimeout 最小重试间隔

数值类型。进行第一次重试的时间间隔，默认 1000 （1s）.

- maxTimeout 最大重试间隔

数值类型。两次重试间的最大时间间隔，默认 60000 （60s）.

- randomize 是否启用随机重试

布尔类型。是否将每次重试的间隔时间乘以一个 1 到 2 之间的数字，默认否，即每次重试的时间间隔均等。

- forever 是否一直重试

布尔类型。是否一直重试，直到任务成功，默认否。

- unref

布尔类型。继承自 p-retry 的参数，默认否。

- maxRetryTime 最长重试时间

数值类型。单个任务超时重试允许的最长时间，默认 600000 （600s）.

## 原理

Promise 管理器基于两个 npm 包： p-queue 和 p-retry。前者提供任务队列的管理，后者提供重试机制。配置参数亦基于此。

### p-queue

可参考 [p-queue](https://www.npmjs.com/package/p-queue)

### p-retry

可参考 [p-retry](https://www.npmjs.com/package/p-retry)

配置可参考 [node-retry](https://github.com/tim-kos/node-retry#retryoperationoptions)
