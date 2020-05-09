# 即时通信(IM)

该组件对应外部插件中的即时通信模块，这里仅有配置定义，无具体实现，相关的功能及用法请参考 [即时通信](/zh-cn/plugin/external/im.md)

## 配置说明

目前 hypertrons 接入了Slack、钉钉、邮件(SMTP)平台，配置定义如下：

### 即时通信组件配置

```TypeScript
class Config {
  slack: SlackConfig[];       // Slack 平台配置列表
  dingTalk: DingTalkConfig[]; // 钉钉平台配置列表
  mail: MailConfig[];         // 邮件平台配置列表
}
```

对于每种平台，用户可以添加多个不同的配置，下面会描述每种平台的具体配置定义。

### Slack 平台配置

```TypeScript
class SlackConfig {
  name: string;     // 配置名，用来唯一标识一个配置
  webhook: string;  // Slack Incoming Webhook 地址
}
```

### 钉钉平台配置

```TypeScript
class DingTalkConfig {
  name: string;     // 配置名，用来唯一标识一个配置
  webhook: string;  // 钉钉发送消息地址
}
```

### 邮件平台配置

```TypeScript
class MailConfig {
  name: string; // 配置名
  connectOptions: MailConnectOptions; // SMTP 服务器连接选项
}

class MailConnectOptions {
  host: string;     // SMTP 服务器地址
  port: number;     // SMTP 服务器端口
  secure: boolean;  // 是否启用 SSL
  auth: MailConnectOptionsAuth; // SMTP 服务器认证信息
}

class MailConnectOptionsAuth {
  user: string; // SMTP 服务用户名
  pass: string; // SMTP 服务密码
}
```

## 组件依赖

- 无
