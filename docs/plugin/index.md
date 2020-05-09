# Plugins

Plugins are singletons in the framework, which only have one instance for one app process. Compare with services, plugins are created with app process and share the life cycle with app process which makes plugins can have their own states rather than stateless services.

We have two kinds of plugins in the framework, core plugins and external plugins.

## Core plugins

Core plugins are used to manage framework internal functionalities which do not communicate with external platforms.

Currently, we have following core plugins

- [Configuration](/plugin/core/configuration.md)
- [Event Manager](/plugin/core/event_manager.md)
- [Scheduler manager](/plugin/core/scheduler_manager.md)
- [Promise handler manager](/plugin/core/promise_handler_manager.md)

## External plugins

External plugins are those which interact with external online services or platforms, like GitHub, GitLab, Slack, mail service, etc.

Currently, we have following external plugins

- [Hosting Platform](/plugin/external/hosting_platform.md)
- [Video Meeting](/plugin/external/video_meeting.md)
- [Mail](/plugin/external/mail.md)
- [IM](/plugin/external/im.md)
- [Translation](/plugin/external/translation.md)
- [CI](/plugin/external/ci.md)
