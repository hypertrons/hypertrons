# rerun

该组件可以重新运行 CI 流程。用户可以通过在 PullRequest 中评论 `/rerun configName` 命令来触发该组件的运行。

该组件底层使用持续集成外部插件，依赖持续集成组件，使用前需要添加相关的配置，配置定义可参考 [持续集成组件](/zh-cn/component/ci.md)

## 使用方式

`/rerun configName`

该命令包含一个参数：

- configName: 配置在 `ci` 插件中的配置名

## 配置说明

```TypeScript
class Config {
  command: string;
}
```

- command: 触发组件运行的命令名，默认为 `/rerun`

## 使用示例

`/rerun hypertrons_jenkins_config`

rerun 组件收到该命令事件后，会在 `ci` 插件配置中查找 `hypertrons_jenkins_config` 对应的配置信息，如果不存在，则执行结束，否则，会根据配置信息触发 CI 的执行。

## 组件依赖

- [ci](/zh-cn/component/ci.md)
