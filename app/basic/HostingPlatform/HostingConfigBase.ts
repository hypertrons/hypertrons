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

import { configClass, configProp } from '../../config-generator/decorators';

@configClass({
  description: 'The remote config path stored on hosting platform',
})
class HostingConfigCompConfigRemote {
  @configProp({
    description: 'The remote config file path under project repo',
    defaultValue: './hypertrons.json',
  })
  filePath: string;
}

@configClass({
  description: 'The private config if using file system',
})
class HostingConfigCompConfigPrivateFile {
  @configProp({
    description: 'The root path of the private configs',
    defaultValue: './repo_configs/',
  })
  rootPath: string;
}

@configClass({
  description: 'The private config if using Mysql',
})
class HostingConfigCompConfigPrivateMysql {
  @configProp({
    description: 'The host of Mysql server',
    defaultValue: 'localhost',
  })
  host: string;

  @configProp({
    description: 'The port of Mysql server',
    defaultValue: 3306,
  })
  port: number;

  @configProp({
    description: 'The db name of Mysql server',
    defaultValue: '',
  })
  db: string;

  @configProp({
    description: 'The user of Mysql server',
    defaultValue: 'root',
  })
  user: string;

  @configProp({
    description: 'The password of user',
    defaultValue: '',
  })
  pass: string;
}

@configClass({
  description: 'The private config for this robot',
})
class HostingConfigCompConfigPrivate {
  @configProp({
    description: 'The private config if using file system',
    defaultValue: new HostingConfigCompConfigPrivateFile(),
    classType: HostingConfigCompConfigPrivateFile,
    optional: true,
  })
  file?: HostingConfigCompConfigPrivateFile;

  @configProp({
    description: 'The private config if using Mysql',
    defaultValue: new HostingConfigCompConfigPrivateMysql(),
    classType: HostingConfigCompConfigPrivateMysql,
    optional: true,
  })
  mysql?: HostingConfigCompConfigPrivateMysql;
}

@configClass({
  description: 'Config description of current config',
})
class HostingConfigCompConfig {
  @configProp({
    description: 'The remote config path stored on hosting platform',
    defaultValue: new HostingConfigCompConfigRemote(),
    classType: HostingConfigCompConfigRemote,
  })
  remote: HostingConfigCompConfigRemote;

  @configProp({
    description: 'The private config for this robot',
    defaultValue: new HostingConfigCompConfigPrivate(),
    classType: HostingConfigCompConfigPrivate,
    scope: 'private',
  })
  private: HostingConfigCompConfigPrivate;
}

@configClass({
  description: 'Hosting config base',
})
export class HostingConfigBase {
  @configProp({
    description: 'The name of current config',
    defaultValue: '',
  })
  name: string;

  @configProp({
    description: 'Config description of current config',
    defaultValue: new HostingConfigCompConfig(),
    classType: HostingConfigCompConfig,
  })
  config: HostingConfigCompConfig;
}
