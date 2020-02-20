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

import { Controller } from 'egg';

export default class Component extends Controller {

  public async getComponentConfig() {
    this.ctx.body = {};
    const installationName = this.ctx.params.installationName;
    const { id, type } = this.app.installation.getInstallationInfoByName(installationName);
    switch (type) {
      case 'github':
        const github = this.app.github.getHostPlatform(id);
        if (github) this.ctx.body = github.compService.getLatestConfigStructure();
        break;
      case 'gitlab':
        const gitlab = this.app.gitlab.getHostPlatform(id);
        if (gitlab) this.ctx.body = gitlab.compService.getLatestConfigStructure();
        break;
      default:
    }
  }

  public async getComponentConfigByNameVersion() {
    this.ctx.body = {};
    const { name, version, installationName } = this.ctx.params;
    const { id, type } = this.app.installation.getInstallationInfoByName(installationName);
    switch (type) {
      case 'github':
        const github = this.app.github.getHostPlatform(id);
        if (github) this.ctx.body = github.compService.getConfigStructureByVersion(name, version);
        break;
      case 'gitlab':
        const gitlab = this.app.gitlab.getHostPlatform(id);
        if (gitlab) this.ctx.body = gitlab.compService.getConfigStructureByVersion(name, version);
        break;
      default:
    }
  }
}
