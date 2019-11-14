export type InstallationType = 'github' | 'gitlab' | undefined;

export class InstallationInitEvent {
  installationId: number;
  type: InstallationType;
  config: any;
}

export class InstallationClientReadyEvent {
  installationId: number;
  installationType: InstallationType;
  name: string;
}
