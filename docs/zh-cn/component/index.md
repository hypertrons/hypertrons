# 组件

组件(Component)是 hypertrons 提供的功能组件，可以执行具体的任务。一个组件主要包括 lua 语言编写的脚本文件(非必需)、配置定义文件、默认配置文件和版本文件。

组件的执行环境是隔离的，

以仓库为基本单位。hypertrons 将组件设计为开源开放的，任何人都可以贡献新的组件或者优化现有组件。

hypertrons 组件的触发主要包含以下两种：

- 定时任务
- 事件驱动

目前，hypertrons 提供了以下组件：

- [approve](/zh-cn/component/approve.md)
- [auto_label](/zh-cn/component/auto_label.md)
- [ci](/zh-cn/component/ci.md)
- [command](/zh-cn/component/command.md)
- [complete_checklist](/zh-cn/component/complete_checklist.md)
- [im](/zh-cn/component/im.md)
- [label_setup](/zh-cn/component/label_setup.md)
- [rerun](/zh-cn/component/rerun.md)
- [role](/zh-cn/component/role.md)
- [self_assign](/zh-cn/component/self_assign.md)
- [vote](/zh-cn/component/vote.md)
