import { Controller } from 'egg';

export default class Installation extends Controller {
  public async getConfigByNameVersion() {
    const version = this.ctx.params.version;
    const name = this.ctx.params.name;
    const installationName = this.ctx.params.installationName;
    const { id, type } = this.app.installation.getInstallationInfoByName(installationName);

    switch (type) {
      case 'github':
        this.ctx.body = this.app.github.getHostPlatform(id)?.compService.getConfigStructureByVersion(name, version);
        break;
      case 'gitlab':
        this.ctx.body = this.app.gitlab.getHostPlatform(id)?.compService.getConfigStructureByVersion(name, version);
        break;
      default:
        this.ctx.body = { };
    }
  }

  public async getConfig() {
    const installationName = this.ctx.params.installationName;
    const { id, type } = this.app.installation.getInstallationInfoByName(installationName);
    switch (type) {
      case 'github':
        this.ctx.body = this.app.github.getHostPlatform(id)?.compService.getLatestConfigStructure();
        break;
      case 'gitlab':
        this.ctx.body = this.app.gitlab.getHostPlatform(id)?.compService.getLatestConfigStructure();
        break;
      default:
        this.ctx.body = { };
    }
  }
}
