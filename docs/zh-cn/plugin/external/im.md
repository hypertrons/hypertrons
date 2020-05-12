# 即时通信

hypertrons 提供了向聊天软件发送消息的接口，可以根据用户的配置将消息发送到不同的聊天软件。目前 hypertrons 提供 Slack、钉钉(DingTalk)、邮件(SMTP) 等平台的消息发送接口。

用户需要添加相关配置才能使用即时通信功能，hypertrons 定义了 `im` 组件，并在组件中对不同平台的配置进行了定义，配置定义和说明请参考 [im](/zh-cn/component/im.md)

## Slack

hypertrons 使用 Slack [官方 NPM 包](https://www.npmjs.com/package/slack) 提供的接口来发送消息到 Slack。

接口：`async sendToSlack(message: IncomingWebhookSendArguments, config: SlackConfig): Promise<void>`

该接口包含两个参数：

- message：消息体，`IncomingWebhookSendArguments` 为 Slack 官方 npm 包定义的消息结构，具体可参考[官方NPM包](https://www.npmjs.com/package/slack)
- config：具体的配置，该方法根据这个配置将 message 发送到 Slack

## 钉钉(DingTalk)

hypertrons 使用 [dingtalk-robot](https://github.com/x-cold/dingtalk-robot) 来实现发送消息到钉钉。

接口：`async sendToDingTalk(message: DingTalkMessageType, config: DingTalkConfig): Promise<void>`

接口包含两个参数：

- message：消息体，`DingTalkMessageType` 定义在 `app/basic/IMDataTypes.ts` 中，具体可参考[dingtalk-robot](https://github.com/x-cold/dingtalk-robot)
- config：具体的配置，该方法根据这个配置将 message 发送到钉钉

## 邮件(SMTP)

hypertrons 使用开源组件 nodemailer 来发送邮件。

接口：`async sendToMail(message: Nodemailer.SendMailOptions, config: MailConfig): Promise<void>`

该接口包含两个参数：

- message：消息体，`Nodemailer.SendMailOptions` 定义在 NPM 包 `nodemailer` 中，具体可参考[官方 NPM 包](https://www.npmjs.com/package/nodemailer)
- config：配置信息，该方法将通过配置提供的 SMTP 服务器信息将 message 发送到指定的邮箱
