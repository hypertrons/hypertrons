export type InstallationType = 'github' | 'gitlab' | undefined;

export class InstallationInitEvent {
  type: InstallationType;
  config: any;
  installationId: number;
}
