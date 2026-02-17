export interface ThemesDirectoryResult {
  found: boolean;
  path: string | null;
  edition: string | null;
}

export interface ImageFileResult {
  filePath: string;
  fileName: string;
}

export interface ElectronAPI {
  getVersion: () => Promise<string>;
  getBuildNumber: () => Promise<string>;
  detectThemesDirectory: () => Promise<ThemesDirectoryResult>;
  openPathInExplorer: (dirPath: string) => Promise<{ success: boolean; error: string | null }>;
  openFileDialog: () => Promise<ImageFileResult | null>;
  readImageAsDataUrl: (filePath: string) => Promise<string | null>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
