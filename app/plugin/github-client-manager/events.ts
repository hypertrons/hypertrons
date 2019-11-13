/**
 * When agent retrieve installed repos
 */
export class ClientRetrieveInstalledReposDoneEvent {
  repos: Array<{
    fullName: string;
    token: string;
  }>;
}

export class ClientUpdateRepoTokenEvent {
  repos: Array<{
    fullName: string;
    token: string;
  }>;
}

export class InstalltaionRepoAddEvent {
  owner: string;
  repo: string;
  installationId: number;
}

export class InstallationRepoRemoveEvent {
  owner: string;
  repo: string;
  installationId: number;
}
