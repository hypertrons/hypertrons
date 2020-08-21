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

import { configClass, configProp } from '../../config-generator/decorators';
import contributingDefaultConfig from './defaultConfig';

@configClass({
    description: 'Help to generate project contributing guide',
})
export default class ContributingTemplate {
    @configProp({
        description: 'new branch name for contributing guide',
        defaultValue: contributingDefaultConfig.newBranchName,
    })
    newBranchName: string;

    @configProp({
        description: 'contributing guide filepath',
        defaultValue: contributingDefaultConfig.filePath,
    })
    filePath: string;

    @configProp({
        description: 'commit message',
        defaultValue: contributingDefaultConfig.commitMessage,
    })
    commitMessage: string;

    @configProp({
        description: 'default branch to check out from',
        defaultValue: contributingDefaultConfig.defaultBranch,
    })
    defaultBranch: string;

    @configProp({
        description: 'add contributing guide command',
        defaultValue: contributingDefaultConfig.contributingGuideCommand,
    })
    contributingGuideCommand: string;

    @configProp({
        description: 'the title of a new pull request',
        defaultValue: contributingDefaultConfig.prTitle,
    })
    prTitle: string;

    @configProp({
        description: 'contributing guide header.',
        defaultValue: contributingDefaultConfig.header,
    })
    header: string;

    @configProp({
        description: 'contributing guide body to welcome new contributors.',
        defaultValue: contributingDefaultConfig.body,
        renderParams: [ 'repoName' ],
    })
    body: string;

    @configProp({
        description: 'contributing guide content',
        defaultValue: contributingDefaultConfig.content,
    })
    content: string;
}
