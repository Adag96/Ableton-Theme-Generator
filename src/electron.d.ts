import type { ThemeLibrary } from './types/theme-library';

export interface ThemesDirectoryResult {
  found: boolean;
  path: string | null;
  edition: string | null;
}

export interface ImageFileResult {
  filePath: string;
  fileName: string;
}

export interface SaveThemeResult {
  success: boolean;
  filePath: string | null;
  error: string | null;
}

export interface ThemeFileInfo {
  name: string;
  createdByApp: boolean;
}

export interface ElectronAPI {
  getVersion: () => Promise<string>;
  getBuildNumber: () => Promise<string>;
  detectThemesDirectory: () => Promise<ThemesDirectoryResult>;
  listThemeFiles: (dirPath: string) => Promise<ThemeFileInfo[]>;
  deleteThemeFile: (filePath: string) => Promise<{ success: boolean; error?: string }>;
  openPathInExplorer: (dirPath: string) => Promise<{ success: boolean; error: string | null }>;
  openFileDialog: () => Promise<ImageFileResult | null>;
  readImageAsDataUrl: (filePath: string) => Promise<string | null>;
  saveThemeFile: (xmlContent: string, defaultFileName: string) => Promise<SaveThemeResult>;
  loadThemeLibrary: () => Promise<ThemeLibrary>;
  saveThemeLibrary: (library: ThemeLibrary) => Promise<{ success: boolean; error?: string }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
