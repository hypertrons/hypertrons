import { IClient } from '../installation-manager/IClient';
import Octokit = require('@octokit/rest');
import { parseRepoName } from '../../basic/Utils';

export class AppGitHubClient implements IClient {
  public installationId: number;
  public name: string;
  public owner: string;
  public repo: string;
  public rawClient: Octokit;

  constructor(installationId: number, name: string) {
    this.installationId = installationId;
    this.name = name;
    const { owner, repo } = parseRepoName(name);
    this.owner = owner;
    this.repo = repo;
    this.rawClient = new Octokit();
  }

  public async getFileContent(filePath: string): Promise<string | undefined> {
    try {
      const res = await this.rawClient.repos.getContents({
        owner: this.owner,
        repo: this.repo,
        path: filePath,
      });
      const content = (res.data as any).content;
      return Buffer.from(content, 'base64').toString('ascii');
    } catch (e) {
      return undefined;
    }
  }

}
