# 开源软件供应链点亮计划——暑期 2020

![logo](https://isrc.iscas.ac.cn/summer2020/help/assets/summer2020.svg)

“开源软件供应链点亮计划-暑期2020”（以下简称 暑期 2020）是由中科院软件所与 openEuler 社区共同举办的一项面向高校学生的暑期活动，将联合各大开源社区针对重要开源软件的开发与维护提供 mini 项目，学生可自主选择申请感兴趣的项目，中选后获得该软件资深维护者（导师）亲自指导完成项目。

Hypertrons 社区参与了暑期 2020，并希望同学们积极参与 Hypertrons 项目共建。

## 项目资源

- [开源软件供应链点亮计划——暑期 2020 官网](https://isrc.iscas.ac.cn/summer2020/)
- [Hypertrons 项目官网](https://hypertrons.io/)
- [Hypertrons 社区行为准则](https://github.com/hypertrons/hypertrons/blob/master/CODE_OF_CONDUCT.md)
- [Hypertrons 项目贡献指南](https://github.com/hypertrons/hypertrons/blob/master/CONTRIBUTING.md)
- [Hypertrons 项目源代码地址](https://github.com/hypertrons/hypertrons/)

## 题目

Hypertrons 社区为参加该项目的同学设立了如下题目，供同学选择。

### 1. 配置描述的自动化生成

-   描述
    - Hypertrons 项目用于连接各种开放平台，并提供完整的跨平台交互能力，这也意味着项目配置会异常复杂，那么如何保证配置结构与文档描述的一致性就是一个非常重要的问题。Hypertrons 项目采用 TypeScript 的 Attribute 特性对所有配置项进行了代码化描述，请参考[源代码](https://github.com/hypertrons/hypertrons/blob/master/app/basic/HostingPlatform/HostingConfigBase.ts)。采用这种方式，不仅可以让平台在运行中自动生成配置结构与默认值，而且结构化的代码化配置可以使离线脚本轻松通过源代码直接生成配置的描述信息，做到代码即文档。

-   预计产出
    - 一套完整的离线脚本，可以做到项目配置结构文档的自动化生成
    - 将文档生成逻辑整合到项目 CI 中，做到代码变化自动生成提交新文档
    - 将该流程拓展为离线脚本+自动执行机制，成为可以服务其他开源项目的通用能力

-   所需技能
    - 有面向对象编程语言基础，熟悉 JavaScript 或 TypeScript 者优先
    - 有较好的英文文字交流能力

-   导师
    - 赵生宇

-   导师邮箱
    - frank_zsy@hypertrons.io

-   难度
    - 中

-   项目仓库
    - [https://github.com/hypertrons/hypertrons](https://github.com/hypertrons/hypertrons)

### 2. 文档协作平台交互接入

-   描述
    - Hypertrons 作为一个跨平台 RPA，各类平台的交互能力都是必不可少的，例如目前已经支持的代码托管平台（GitHub、GitLab、Gitee）、持续集成平台（Jenkins）、即时通信平台（Slack）等。而文档协作也是开放组织协作中非常重要的一环，目前大量的开放组织都在通过文档协作产出内容，例如 Google Docs、石墨文档、语雀、飞书文档、QQ 文档等等，都是这个领域的代表，如何有效的抽象在线文档协作平台的接口体系，并接入主流的文档协作平台，成为自动化协作流程的一部分，是项目关键的一部分能力。

-   预计产出
    - 一套关于文档协作开放平台的接口设计，包含文档、表格等不同文档格式。
    - 至少两个主流文档协作平台在 Hypertrons 中的接入实现。

-   所需技能
    - 有面向对象编程语言基础，熟悉 JavaScript 或 TypeScript 者优先
    - 有较好的英文文字交流能力

-   导师
    - 吴绍岭

-   导师邮箱
    - wsl@hypertrons.io

-   难度
    - 高

-   项目仓库
    - [https://github.com/hypertrons/hypertrons](https://github.com/hypertrons/hypertrons)

### 3. 迷你项目看板项目

-   描述
    - Hypertrons 作为一个跨平台的 RPA 平台，在提供跨平台交互能力的同时，为了能更好的做出决策，也采集了各平台的开放数据作为决策基础。而这些数据同时也为社区的数字化运营分析提供了有效的支撑，我们不希望深度改变用户的使用习惯，故发起一个浏览器插件项目，通过在特定网址的网页中插入迷你看板的方式为开放组织提供有效的监控和运营手段，这个项目是 Hypertrons 一大创新，也是重要的一部分。

-   预计产出
    - 一个高可配的浏览器插件项目，用于进行项目相关信息展示
    - 至少实现 GitHub、GitLab、Gitee 的插件适配

-   所需技能
    - 有面向对象编程语言基础，熟悉 JavaScript，HTML，JQuery，echarts 优先
    - 有较好的英文文字交流能力

-   导师
    - 赵生宇

-   导师邮箱
    - frank_zsy@hypertrons.io

-   难度
    - 高

-   项目仓库
    - [https://github.com/hypertrons/hypertrons](https://github.com/hypertrons/hypertrons)
    - [https://github.com/hypertrons/hypertrons-crx](https://github.com/hypertrons/hypertrons)
