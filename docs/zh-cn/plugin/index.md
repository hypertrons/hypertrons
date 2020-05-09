# 插件

插件是系统中的单例，对于每一个 app 进程仅包含一个实例。与 service 相较而言，插件与 app 进程共享生命周期，即插件可以是有状态的。

我们包含两种插件，核心插件和外部插件。

## 核心插件

核心插件是用来管理框架内部功能的插件，此类插件不与外部平台通信。

目前，框架中包含以下核心插件：

- [配置管理](/zh-cn/plugin/core/configuration.md)
- [事件管理](/zh-cn/plugin/core/event_manager.md)
- [定时任务调度](/zh-cn/plugin/core/scheduler_manager.md)
- [Promise 管理器](/zh-cn/plugin/core/promise_handler_manager.md)

## 外部插件

外部插件用于与外部平台或线上服务通信，例如 GitHub、GitLab、Slack、邮件服务等。

目前，框架中包含以下外部插件：

- [代码托管平台](/zh-cn/plugin/external/hosting_platform.md)
- [视频会议](/zh-cn/plugin/external/video_meeting.md)
- [邮件](/zh-cn/plugin/external/mail.md)
- [即时通信](/zh-cn/plugin/external/im.md)
- [翻译](/zh-cn/plugin/external/translation.md)
- [持续集成](/zh-cn/plugin/external/ci.md)
