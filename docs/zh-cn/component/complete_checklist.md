# complete_checklist

勾选 issue 中的 checklist。

在项目管理中，通常会在 issue 中设置多个 checklist，用于制定开发任务和计划，如果协作者没有修改 issue 的权限，即使协作者完成了某个任务，也无法自己勾选对应的项，该组件允许协作者通过命令的方式勾选某一项，并会在项后面追加是由谁来解决的。

## 使用方式

`/complete-checklist param1 param2 [param3]`

参数说明：

-   param1：需要勾选的 checklist 的行号，从1开始

-   param2：关联的 issue 或 pull 的 ID，如果 issue 或 pull ID 不存在，则不会勾选

-   param3(可选)：可选值为

    - `issue`：指明在 issue 列表中查找参数2指定的 ID
    - `pull` 或不指定这个参数：指明在 pull 列表中查找参数2指定的 ID

## 配置说明

```TypeScript
class Config {
  command: string;
}
```

- command: 触发组件运行的命令名，默认为 `/complete-checklist`

## 使用示例

Issue 中的 checklist 为:

```markdown
这是本周的开发任务：

[] item1
[] item2
[] item3

请大家按时完成。
```

- /complete-checklist 1 #227: 首先在 pull 列表中检查 #227是否存在，如果存在，则勾选 item1，否则不勾选。
- /complete-checklist 2 #228: 首先在 pull 列表中检查 #228是否存在，如果存在，则勾选 item2，否则不勾选。
- /complete-checklist 3 #209: 首先在 issue 列表中检查 #209是否存在，如果存在，则勾选 item3，否则不勾选。

## 组件依赖

- 无
