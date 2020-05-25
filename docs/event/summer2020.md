# Summer 2020

![logo](https://isrc.iscas.ac.cn/summer2020/help/assets/summer2020.svg)

"Open Source Software Supply Chain Lightening Project - Summer 2020"(henceforth referred as Summer 2020) is a summer coding event held by Intelligent Software Research Center of Institute of Software Chinese Academy of Sciences and openEuler community which combines with major open source projects and communities to provide mini projects for students. Student can apply to any projects they are interested in and complete the projects with the guidance from community maintainers or mentors after being selected.

Hypertrons community also join the Summer 2020 and hope students can build the community together.

## Resources

- [Open Source Software Supply Chain Lightening Project - Summer 2020 Website](https://isrc.iscas.ac.cn/summer2020/)
- [Hypertrons Website](https://hypertrons.io/)
- [Hypertrons Code of Conduct](https://github.com/hypertrons/hypertrons/blob/master/CODE_OF_CONDUCT.md)
- [Hypertrons Contributing Guide](https://github.com/hypertrons/hypertrons/blob/master/CONTRIBUTING.md)
- [Hypertrons Source Code](https://github.com/hypertrons/hypertrons/)

## Ideas

Hypertrons community provides several ideas for students to choose.

### 1. Configration document auto generation

-   Description
    - Hypertrons is able to connect all kinds of open platforms and provide cross-platform interaction ablity which means the configuration of the project will be quite complex. So it will be a vital problem how to make sure the configuration structure and documentation is identical. Hypertrons uses Attribute of TypeScript to decorate configuration, see [code](https://github.com/hypertrons/hypertrons/blob/master/app/basic/HostingPlatform/HostingConfigBase.ts). By doing this, Hypertrons can generate configuration structure and default values in runtime and it is quite easy to use offline scripts generate documentations for the project, thus we can achieve code is documentation.

-   Expected outcomes
    - A whole set of offline scripts which can generate project configuration documentation automatically.
    - Integrate the logic into project CI procedure which will submit documentation while code changes.
    - Expand the mechanism to offline scripts with automate execution which can be a universal function to other open source projects.

-   Skills required
    - Experience in Object Oriented Programming, prefer familiarity of JavaScript or TypeScript
    - Written communication ablity in English

-   Mentor
    - Shengyu Zhao

-   Mentor contact
    - frank_zsy@hypertrons.io

-   Difficulty
    - Medium

-   Repositories
    - [https://github.com/hypertrons/hypertrons](https://github.com/hypertrons/hypertrons)

### 2. Open document platforms integration

-   Description
    - As a cross-platform RPA, Hypertrons needs to integrate all kinds of open platforms, like source code platform(GitHub, GitLab, Gitee), CI platform(Jenkins), IM(Slack) and etc. And document collaboration is also very important to open orgnization like Google Docs, shimo, yuque, lark, QQ docs and etc. So it is a very important part for the project on how to abstract document platform interaction APIs and integrate mainstream document platforms.

-   Expected outcomes
    - A comprehensive document collaboration interface design includes docs, sheets and other document formats.
    - At least two main stream document platforms integration into Hypertrons.

-   Skills required
    - Experience in Object Oriented Programming, prefer familiarity of JavaScript or TypeScript
    - Written communication ablity in English

-   Mentor
    - Shaoling Wu

-   Mentor contact
    - wsl@hypertrons.io

-   Difficulty
    - High

-   Repositories
    - [https://github.com/hypertrons/hypertrons](https://github.com/hypertrons/hypertrons)

### 3. Mini dashboard

-   Description
    - As a cross-platform RPA platform, Hypertrons provides interaction ablities and collects open data as same time to support user decision. These data will support community operation and used to analysis community health. We start the project of browser plugin as we don't want to change user's habbit. With the project, we can embed mini dashboard into certain platforms for monitor and operation purpose, so the project will be an important part of Hypertrons.

-   Expected outcome
    - A highly configurable browser extension used to display project data
    - At least support GitHub, GitLab, Gitee

-   Skills required
    - Experience in Object Oriented Programming, prefer familiarity of JavaScript, HTML, JQuery, echarts
    - Written communication ablity in English

-   Mentor
    - Shengyu Zhao

-   Mentor contact
    - frank_zsy@hypertrons.io

-   Difficulty
    - High

-   Repositories
    - [https://github.com/hypertrons/hypertrons](https://github.com/hypertrons/hypertrons)
    - [https://github.com/hypertrons/hypertrons-crx](https://github.com/hypertrons/hypertrons-crx)
