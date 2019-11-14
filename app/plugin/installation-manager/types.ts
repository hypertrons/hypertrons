export type InstallationType = 'github' | 'gitlab' | undefined;

export class InstallationInitEvent {
  installationId: number;
  name: string;
  type: InstallationType;
  config: any;
}

export class InstallationClientReadyEvent {
  installationId: number;
  name: string;
}
