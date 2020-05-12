# 同意合入

当用户在 PR 评论区输入“同意”命令以后，该 PR 就会被打上特定标签。

（后续可以通过处理包含该标签的 PR 实行合并等操作）

以默认参数为例：

在 PR 评论区输入 `/approve`，则该 PR 就会被打上 `pull/approved` 标签 

## 配置参数

- label 标签

字符串类型。输入命令以后会被添加的标签，默认为 `pull/approved`.

- command 命令

字符串类型。会触发添加标签的命令，默认为 `/approve`.

## 关联组件

- command
- auto_label
