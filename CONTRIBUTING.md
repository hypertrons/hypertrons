# Contributing to hypertrons

It is warmly welcomed if you have interest to hack on hypertrons. First, we encourage this kind of willing very much. And here is a list of contributing guide for you.

## Topics

* [Reporting issues](#reporting-general-issues)
* [Code and doc contribution](#code-and-doc-contribution)

## Reporting general issues

To be honest, we regard every user of hypertrons as a very kind contributor. After experiencing hypertrons, you may have some feedback for the project. Then feel free to open an issue via [NEW ISSUE]('').

Since we collaborate project hypertrons in a distributed way, we appreciate **WELL-WRITTEN**, **DETAILED**, **EXPLICIT** issue reports. To make the communication more efficient, we wish everyone could search if your issue is an existing one in the searching list. If you find it existing, please add your details in comments under the existing issue instead of opening a brand new one.

To make the issue details as standard as possible, we setup an ISSUE TEMPLATE for issue reporters. Please **BE SURE** to follow the instructions to fill fields in template.

There are a lot of cases when you could open an issue:

* bug report
* feature request
* performance issues
* feature design
* help wanted
* doc incomplete
* test improvement
* any questions on project
* and so on

Also we must remind that when filling a new issue, please remember to remove the sensitive data from your post. Sensitive data could be password, secret key, network locations, private business data and so on.

## Code and doc contribution

> WE ARE LOOKING FORWARD TO ANY PR FROM YOU.

Since you are ready to improve hypertrons with a PR, we suggest you could take a look at the PR rules here.

* [Code Style Rule](#code-style-rule)

### Code Style Rule

Basiclly you need to pass TSLint checking and add apache license header.

* [TSLint Checking](#tslint-checking)
* [Apache License Header](#apache-license-header)

#### TSLint Checking

Before committing your code, you should first run `npm run lint` to check your code style. In hypertrons, we use TSLint, which is an extensible static analysis tool that checks TypeScript code for readability, maintainability, and functionality errors. It is widely supported across modern editors & build systems and can be customized with your own lint rules, configurations, and formatters.

If you use VSCode as your IDE, you may do the following steps to lint your code automatically.
* install plugin `TSLint`
* set the following content in .vscode/settings.json
``` json
{
   "editor.codeActionsOnSave": {
       "source.fixAll.tslint": true
   }
}
```
* restart VSCode

#### Apache License Header

If you add a new ts file in your modification, please make sure you add Apache License Header to all new files.
``` text
// Copyright 2019 Xlab
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
```

If you use VSCode as your IDE, you may do the following steps to add Apache License Header automatically.
* install plugin `licenser`
* set the following content in .vscode/settings.json
``` json
{
    "licenser.author": "Xlab",
    "licenser.projectName": "hypertrons",
    "licenser.useSingleLineStyle": true,
    "licenser.disableAutoHeaderInsertion": false,
    "licenser.license":"AL2"
}
```
* restart VSCode
