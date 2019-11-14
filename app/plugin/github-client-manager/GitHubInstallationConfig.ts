export class GitHubClientConfig {
  name: string;
  endpoint: string;
  appId: number;
  privateKeyPath: string;
  privateKeyPathAbsolute: boolean;
  webhook: {
    path: string;
    secret: string;
    proxyUrl: string;
  };
}
