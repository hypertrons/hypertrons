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

import Config from './config';

const defaultConfig: Config = {
  enable: false,
  roles: [
    {
      name: 'owner',
      description: 'Repo owner, hold all power.',
      users: [],
    },
    {
      name: 'maintainer',
      description: 'The people who maintain the repo.',
      users: [],
    },
    {
      name: 'developer',
      description: 'Developer.',
      users: [],
    },
    {
      name: 'reporter',
      description: 'Reporter.',
      users: [],
    },
    {
      name: 'author',
      description: 'The author of a issue/comment',
      users: [],
    },
    {
      name: 'anyone',
      description: 'If a user does not have any role, He/She/It will get this default role.',
      users: [],
    },
  ],
};

export default defaultConfig;
