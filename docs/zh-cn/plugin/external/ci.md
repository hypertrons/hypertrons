# 持续集成(CI)

hypertrons 设计为支持接入多个持续集成平台，目前已经接入 Jenkins 平台，提供了运行 Job 的接口。

## 接口说明

`async runJenkins(jobName: string, pullNum: string, config: JenkinsConfig): Promise<void>`

该接口提供运行 Jenkins Job 的功能。

参数说明：

- jobName: 用户 Jenkins 平台 Job 名
- pullNum: Pull Request ID
- config: 用户定义的配置
