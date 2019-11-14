import { IClient } from '../installation-manager/IClient';
import Octokit = require('@octokit/rest');

export class AppGitHubClient implements IClient {
  public installationId: number;
  public name: string;
  public rawClient: Octokit;

  constructor(installationId: number, name: string) {
    this.installationId = installationId;
    this.name = name;
    this.rawClient = new Octokit();
  }
}
