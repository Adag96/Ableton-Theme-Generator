import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  getVersion: () => ipcRenderer.invoke('get-version'),
  getBuildNumber: () => ipcRenderer.invoke('get-build-number'),
  detectThemesDirectory: () => ipcRenderer.invoke('detect-themes-directory'),
  listThemeFiles: (dirPath: string) => ipcRenderer.invoke('list-theme-files', dirPath),
  deleteThemeFile: (filePath: string) => ipcRenderer.invoke('delete-theme-file', filePath),
  openPathInExplorer: (dirPath: string) => ipcRenderer.invoke('open-path-in-explorer', dirPath),
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  readImageAsDataUrl: (filePath: string) => ipcRenderer.invoke('read-image-as-data-url', filePath),
  saveThemeFile: (xmlContent: string, defaultFileName: string) =>
    ipcRenderer.invoke('save-theme-file', xmlContent, defaultFileName),
  loadThemeLibrary: () => ipcRenderer.invoke('load-theme-library'),
  saveThemeLibrary: (library: unknown) => ipcRenderer.invoke('save-theme-library', library),
  copyThemeToDownloads: (sourcePath: string, fileName: string) =>
    ipcRenderer.invoke('copy-theme-to-downloads', sourcePath, fileName),
  renameThemeFile: (oldPath: string, newPath: string) =>
    ipcRenderer.invoke('rename-theme-file', oldPath, newPath),
  checkFileExists: (filePath: string) =>
    ipcRenderer.invoke('check-file-exists', filePath),
  writeThemeFile: (filePath: string, xmlContent: string) =>
    ipcRenderer.invoke('write-theme-file', filePath, xmlContent),
  deleteLibraryThemeFile: (filePath: string) =>
    ipcRenderer.invoke('delete-library-theme-file', filePath),
  readThemeFileAsText: (filePath: string) =>
    ipcRenderer.invoke('read-theme-file-as-text', filePath),
  downloadCommunityTheme: (args: { url: string; name: string }) =>
    ipcRenderer.invoke('download-community-theme', args),
});
