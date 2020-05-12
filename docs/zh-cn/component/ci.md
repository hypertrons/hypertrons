# 持续集成(CI)

该组件对应外部插件中的持续集成模块，这里仅有配置定义，无具体实现，相关的功能及用法请参考 [持续集成外部插件](/zh-cn/plugin/external/ci.md)

## 配置说明

```TypeScript
// Jenkins 平台配置
class RepoJobMap {
  repo: string;
  job: string;
}

// Jenkins 平台配置
class JenkinsConfig {
  name: string;
  platform: 'jenkins';
  endpoint: string;
  user: string;
  token: string;
  repoToJobMap: RepoJobMap[];
  timeout: number;
}

// CI 组件配置
class Config {
  configs: JenkinsConfig[];
}
```

CI 组件配置说明

- configs: hypertrons 设计为支持多个 CI 平台，目前仅支持 Jenkins 平台，因此，这里的配置类型仅为 JenkinsConfig 类型的数组，未来拓展其他平台时，数组类型也会增加相应的配置类型

Jenkins 平台配置说明

- name: 配置名
- platform: 平台标识，值为 `jenkins`，固定值
- endpoint: Jenkins 服务地址
- user: 身份认证用户名
- token: 身份认证 token
- repoToJobMap: 从仓库到 Jenkins Job 的映射，用户 Jenkins 平台中仓库名和 Jenkins Job 名可能不相同，因此，需要配置映射关系，使得组件能正确从仓库名解析到对应的 Job，这里是数组类型，可以配置多个映射关系
- timeout: 请求超时时间，默认为 30000 ms

RepoJobMap 说明

- repo: 仓库名
- job: Jenkins 平台 Job 名

## 组件依赖

- 无
