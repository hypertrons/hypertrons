// Copyright 2019 - present Xlab
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

import ContributingTemplate from './config';

const contributingDefaultConfig: ContributingTemplate = {
    newBranchName: 'contributing-guide',
    filePath: 'contributing-guide.md',
    commitMessage: 'create template contibuting guide',
    defaultBranch: 'master',
    contributingGuideCommand: '/add-contributing-guide',
    prTitle: 'feat: add contributing guide',
    header: `# How To Contribute
`,
    body : `
It is walmly welcomed if you have interest to contribute to {{repoName}} and help make it even better than it is today!
The following links might help you make contributions to {{repoName}}.
`,
    content: `
- [Code of Conduct](#coc)
- [Submitting an Issue](#issue)
- [Submitting a Pull Request](#pr)
- [Coding Rules](#rules)
`,
};

export default contributingDefaultConfig;
