# 命令

配置各个命令的使用权限、生效间隔、作用域等参数.

## 配置参数

- name 名称

字符串类型。标识命令的名称，以斜杠开头，如 `/approve`.

- scopes 作用域 

字符串数组类型。命令能够起作用的范围，如 `[ 'pull_comment', 'review', 'review_comment' ]` 表示该命令仅能在 PR 评论区、Review 区和 Review 评论区生效。

- intervalMinutes 该命令的生效间隔

数值类型。两个相同命令生效的最短时间间隔，默认 0.
