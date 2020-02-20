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

export interface Config {
  sources: Array<{
    src: {
      patterns: string[];
      options: {
        useGitIgnore?: boolean;
        usePackageJson?: boolean;
        configKey?: string;
        gitIgnoreFile?: string;
        ignore?: string[];
        cwd?: string;
      };
    };
    licenseHeaderPath: string[],
  }>;
}

const defalutConfig: Config = {
  sources: [
    {
      src: {
        patterns: [
          'app.ts',
          'app/**/*.ts',
          'test/**/*.ts',
          'config/**/*.ts',
          'scripts/**/*.ts',
        ],
        options: {
          useGitIgnore: true,
          ignore: [],
        },
      },
      licenseHeaderPath: [
        'app/utils/license-check/license-ts.header',
      ],
    },
    {
      src: {
        patterns: [
          'app/**/*.lua',
          'test/**/*.lua',
        ],
        options: {
          useGitIgnore: true,
          ignore: [],
        },
      },
      licenseHeaderPath: [
        'app/utils/license-check/license-lua.header',
      ],
    },
  ],
};

export default defalutConfig;
