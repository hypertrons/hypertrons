export interface IClient {
  installationId: number;
  name: string;
  rawClient: any;

  getFileContent(filePath: string): Promise<string | undefined>;
}
