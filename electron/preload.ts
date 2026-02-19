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
});
