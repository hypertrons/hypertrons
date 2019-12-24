import { Controller } from 'egg';

export default class Installation extends Controller {

  public async getInstallationConfig() {
    const installationName = this.ctx.params.installationName;
    const installationInfo = this.app.installation.getInstallationInfoByName(installationName);
    switch (installationInfo.type) {
      case 'github':
        this.ctx.body = this.app.github.getConfigType();
        break;
      case 'gitlab':
        this.ctx.body = this.app.gitlab.getConfigType();
        break;
      default:
        this.ctx.body = { };
    }
  }

}
