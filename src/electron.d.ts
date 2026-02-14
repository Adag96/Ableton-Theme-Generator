export interface ElectronAPI {
  getVersion: () => Promise<string>;
  getBuildNumber: () => Promise<string>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
