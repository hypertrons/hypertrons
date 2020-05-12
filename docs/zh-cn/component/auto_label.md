# 自动打标签

当含有特定关键字的 PR 或者 issue 被创建或者修改时，该 PR 或 issue 就会被打上特定标签。

## 配置参数

- actions 动作

字符串数组类型。会触发自动打标签的动作，默认为 `[ 'opened', 'edited' ]`.

- events 事件 

字符串数组类型。会触发添加标签的 webhook 事件，默认为 `[ 'IssueEvent', 'PullRequestEvent' ]`.

## 关联组件

- label_setup
