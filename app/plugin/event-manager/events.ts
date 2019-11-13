/**
 * Client ready
 */
export class ClientReadyEvent {
  installationId: number;
  fullName: string;
}

/**
 * Repo removed
 */
export class RepoRemovedEvent {
  installationId: number;
  fullName: string;
}

/**
 * When a push to a repo
 */
export class RepoPushEvent {
  installationId: number;
  fullName: string;
  ref: string;
  commits: {
    added: string[];
    removed: string[];
    modified: string[];
  }[];
}

/**
 * When a repo's config is updated
 */
export class ConfigManagerConfigLoadedEvent {
  installationId: number;
  fullName: string;
  config: any;
}
