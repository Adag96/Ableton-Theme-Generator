export interface ThemesDirectoryResult {
  found: boolean;
  path: string | null;
  edition: string | null;
}

export interface ElectronAPI {
  getVersion: () => Promise<string>;
  getBuildNumber: () => Promise<string>;
  detectThemesDirectory: () => Promise<ThemesDirectoryResult>;
  openPathInExplorer: (dirPath: string) => Promise<{ success: boolean; error: string | null }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
