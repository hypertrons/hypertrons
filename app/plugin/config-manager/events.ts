/**
 * Reload a repo's config
 * agent -> worker
 */
export class ConfigManagerInternalReLoadConfigEvent {
  installationId: number;
  fullName: string;
}

/**
 * When a repo's config is loaded
 * worker -> all
 */
export class ConfigManagerInternalConfigLoadedEvent {
  installationId: number;
  fullName: string;
  config: any;
}
