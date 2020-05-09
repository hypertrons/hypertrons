# 配置管理

配置是 hypertrons 中的一个核心概念，用户通过配置来声明启用 hypertrons 提供的哪些组件、如何使用这些组件，是用户与系统交互的一种直接的方式，只有用户通过配置显式声明的组件才会启用。配置管理模块是 hypertrons 中的核心组件，提供了以下功能：

- 从多个配置源中加载、合并用户的组件配置
- 监听配置源中配置变化事件，当配置源中的配置发生变化时，自动更新本地的配置，并通知外部
- 对外提供获取配置的接口

## 核心概念

### 组件配置(Component configuration)

hypertrons 提供了多个功能组件(Component)，每个组件都有唯一的名字，hypertrons 通过定义配置的方式为每个组件提供强大的可扩展能力。每个组件都有自己的配置定义，以 `auto_merge` 组件为例，该组件的配置定义如下:

``` TypeScript
class Config {
  schedName: string;    // Schedule Name
  sched: string;        // Schedule expression
  reminderRole: string; // Reminder Role
  message: string;      // Reminder message
  ignore: string[];     // Ignore issues with specific labels
}
```

该组件以定时任务的形式运行，用户通过 `sched` 配置项来定义执行周期，通过 `reminderRole` 配置项来定义只通知哪些用户，通过 `message` 配置项来定义通知的消息内容，通过 `ignore` 配置项来忽略带有指定 labels 的 issues。

**组件配置是配置的基本单位，一个组件配置为一个对象。**

### 仓库配置(Repository configuration)

目前 hypertrons 以仓库为服务单位，每个仓库结构中包含 `ConfigService` 成员，`ConfigService` 即为配置管理模块的封装，用于管理仓库的配置。`ConfigService` 包含 `config` 成员，该成员是一个对象，包含了用户声明的所有`组件配置`，对象的 key 为组件名，value 为组件配置。**配置管理的整个生命周期都在维护 `config` 对象。**

### 配置源(Configuration source)

配置源以仓库为单位保存用户的配置。配置管理模块提供了功能完善的配置管理功能，同时为了提高配置管理的灵活性和可扩展性，支持从多个配置源中拉取配置。目前支持三种类型的配置源：

- 默认配置
- 远程仓库
- 服务器本地文件

#### 默认配置

每个组件都有自己的配置定义，同时也有自己的默认配置，以 `issue_reminder` 组件为例，该组件的默认配置为:

```JSON
{
  "schedName": "Issue reminder",
  "sched": "0 0 9 * * *",
  "reminderRole": "replier",
  "message": "This issue has not been replied for 24 hours, please pay attention to this issue: ",
  "ignore": [ "weekly-report" ]
}
```

当用户声明启用这个组件，但是没有提供全部的配置项时，则未声明的配置项会用默认配置来代替，例如用户提供的配置为：

```JSON
{
  "sched": "0 0 12 * * *",
  "ignore": [ "weekly-report", "test" ]
}
```

则最终生成的配置为：

```JSON
{
  "schedName": "Issue reminder",
  "sched": "0 0 12 * * *",
  "reminderRole": "replier",
  "message": "This issue has not been replied for 24 hours, please pay attention to this issue: ",
  "ignore": [ "weekly-report", "test" ]
}
```

> Note: 未在配置中声明的组件不会合并到最终的配置中。

#### 远程仓库

用户的配置以文件的形式存放在远程仓库中，默认的存放路径为 `$project_root_path/.github/hypertrons.json`，配置必须保存为 json 格式，例如：

```JSON
{
  "weekly_report": {
    "version": 1,
    "generateTime": "0 0 12 * * 1"
  },
  "auto_merge": {
    "version": 1,
    "sched": "0 */5 * * * *"
  },
  "vote": {
    "version": 1
  }
}
```

使用远程仓库配置的优点是所有项目协作者都可以查看项目的配置，提高了项目的开放透明性，而且开源开放的形式更有利于项目间配置的共享。

#### 服务器本地文件

保存在远程仓库中的配置是透明公开的，有些配置是需要私有的，例如 Slack Webhook、SMTP 等配置，为了解决这个问题，配置管理模块支持服务器本地文件的方式来保存用户的私有配置，同样是以仓库为单位，保存为 json 格式。这部分配置是私有的，用户只能看到自己的私有配置。

> Note: 项目会依据需求对配置源进行进一步扩展。

## 配置的结构

如前所述，对于用户来说，可以在多个配置源中编写配置文件，每个文件为 json 格式，以`组件配置`为单位，配置示例如下所示：

```JSON
hypertrons/.github/hypertrons.json
{
  "weekly_report": {
    "version": 1,
    "generateTime": "0 0 12 * * 1"
  },
  "approve": {
    "version": 1
  },
  "auto_merge": {
    "version": 1,
    "sched": "0 */5 * * * *"
  }
}
```

这段配置表明用户在仓库上启用 `weekly_report`、`approve`、`auto_merge` 这三个组件。

在 hypertrons 内部，上面的配置会与默认配置进行合并，生成该仓库最终的配置，并保存在 `config` 对象中，对象的 key 为组件名，value 为组件配置。

## 配置合并规则

配置管理模块提供了多个配置源来保存配置，并从多个配置源中加载、合并用户的配置，配置源具有优先级，在合并过程中，如果配置项有重复，那么高优先级的配置会覆盖低优先级的配置。

配置的优先级为：`远程仓库配置` > `服务器本地文件配置` > `默认配置`

### 未定义字段的处理

为了提高扩展性，如果用户声明的配置中，有些字段在配置定义中并不存在，配置管理模块会将该部分字段合并到配置中。例如：

```JSON
用户声明的配置，默认配置中不存在 append_attribute 字段
{
  "issue_reminder": {
    "sched": "0 0 12 * * *",
    "append_attribute": "user append attribute"
  }
}
默认配置
{
  "issue_reminder": {
    "schedName": "Issue reminder",
    "sched": "0 0 9 * * *",
    "reminderRole": "replier",
    "message": "This issue has not been replied for 24 hours, please pay attention to this issue: ",
    "ignore": [ "weekly-report" ]
  }
}
最终配置
{
  "issue_reminder": {
    ......
    "sched": "0 0 12 * * *",
    "append_attribute": "user append atribute"
  }
}
```

### 数据类型处理

hypertrons 为每个组件定义了配置，且配置是有数据类型的。在合并除`默认配置`以外的配置时，高优先级的配置会覆盖低优先级的配置，不考虑数据类型的限制。例如：

```JSON
远程仓库配置
{
  "issue_reminder": {
    "ignore": "weekly-report"
  }
}
服务器本地文件配置
{
  "issue_reminder": {
    "ignore": [ "test" ]
  }
}
生成的中间配置
{
  "issue_reminder": {
    "ignore": "test"
  }
}
```

按照规则，远程仓库优先级高于服务器本地文件优先级，远程仓库配置会覆盖服务器本地文件配置，即使 `issue_reminder` 组件配置定义 `ignore` 字段为数组类型。因此，上述示例生成的中间配置的 `ignore` 字段为字符串类型。

中间配置会和默认配置进行合并然后生成最终配置，这一步的合并操作会进行数据类型限制，如果中间配置的数据类型和配置定义的数据类型不相同，则会忽略中间配置中的配置项，使用默认配置来代替。上面示例最终生成的结果为：

```JSON
最终合并的配置
{
  "issue_reminder": {
    "schedName": "Issue reminder",
    "sched": "0 0 12 * * *",
    "reminderRole": "replier",
    "message": "This issue has not been replied for 24 hours, please pay attention to this issue: ",
    "ignore": [ "weekly-report" ]
  }
}
```

可以看到 `ignore` 字段最终为定义的数组类型。

### 数组类型的配置项的合并规则

配置管理模块为数组类型的配置项合并提供了两种方式：

- 覆盖
- 合并

**覆盖**方式会直接用用户声明的配置覆盖默认配置。例如：

```JSON
远程配置
{
  "issue_reminder": {
    "ignore": [ "docs", "test" ]
  }
}
默认配置
{
  "issue_reminder": {
    ......
    "ignore": [ "weekly-report" ]
  }
}
最终配置：
{
  "issue_reminder": {
    ......
    "ignore": [ "docs", "test" ]
  }
}
```

**合并**方式会将用户的配置和默认配置进行并集操作，这种方式需要将数组的第一个元素设置为`{ "__merge__": true }`

例如：

```JSON
远程配置
{
  "issue_reminder": {
    "ignore": [ { "__merge__": true }, "docs", "test" ]
  }
}
默认配置
{
  "issue_reminder": {
    ......
    "ignore": [ "weekly-report" ]
  }
}
最终配置：
{
  "issue_reminder": {
    ......
    "ignore": [ "weekly-report", "docs", "test" ]
  }
}
```

## 多 Worker 下配置初始化、更新和同步机制

hypertrons 底层基于 eggjs 框架，eggjs 本身支持多 worker，每个 worker 为一个进程，多 worker 间通过进程间通信来实现通信。目前 hypertrons 每个 worker 都维护一份配置。

### 配置初始化

配置加载采用`单 Worker 加载，事件同步`的机制。配置管理模块在启动时，只有一个 worker 收到 `HostingClientSyncConfigEvent`，然后执行配置初始化操作，主要操作包括从配置源拉取、合并配置，然后将配置信息通过 `HostingClientConfigInitedEvent` 同步到其他的 worker，其他 worker 收到事件后会更新自己进程内的配置。

### 配置更新和同步

更新时机：

- 配置管理模块会监听 `PushEvent`，当检测到更新的文件中包含配置文件时，会触发配置的更新
- 系统会监听服务器配置文件目录下配置文件的变化，然后发出 `HostingClientOnConfigFileChangedEvent`。配置管理模块会监听 `HostingClientOnConfigFileChangedEvent`，然后触发配置的更新

每一次只有一个随机的 worker 会接收到上述两种事件，然后该 worker 会从配置源拉取配置，并通过 `HostingClientConfigInitedEvent` 同步到其他的 Worker。

### 配置更新通知机制

配置更新完成后，会调用 `HostingClient` 的 `onConfigLoaded()` 方法，当其他服务需要监听配置更新时，只需要继承 `ClientServiceBase` 并实现 `onConfigLoaded()` 方法即可。

## 配置获取的方式

配置管理模块提供了 `getConfig()` 方法，可返回当前的配置，即 `config` 对象，同时提供了 `getCompConfig<TConfig>(comp: string)` 方法，该方法参数为组件名，返回值为具体组件的配置。
