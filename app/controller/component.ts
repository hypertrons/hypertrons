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
