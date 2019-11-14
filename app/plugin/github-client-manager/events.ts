export class GitHubRepoInitEvent {
  appId: number;
  privateKey: string;
  installationId: number;
  githubInstallationId: number;
  installationName: string;
  fullName: string;
}

export class InstallationRepoAddEvent {
  fullName: string;
  installationId: number;
  githubInstallationId: number;
}

export class InstallationRepoRemoveEvent {
  fullName: string;
  installationId: number;
}
