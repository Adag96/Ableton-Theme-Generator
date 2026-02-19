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
  copyThemeToDownloads: (sourcePath: string, fileName: string) => Promise<{ success: boolean; destPath?: string; error?: string }>;
  renameThemeFile: (oldPath: string, newPath: string) => Promise<{ success: boolean; newPath?: string; error?: string }>;
  checkFileExists: (filePath: string) => Promise<boolean>;
  writeThemeFile: (filePath: string, xmlContent: string) => Promise<{ success: boolean; error?: string }>;
  deleteLibraryThemeFile: (filePath: string) => Promise<{ success: boolean; error?: string }>;
  readThemeFileAsText: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>;
  downloadCommunityTheme: (args: { url: string; name: string }) => Promise<{ success: boolean; filePath?: string; error?: string }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
