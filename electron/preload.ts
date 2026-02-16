import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  getVersion: () => ipcRenderer.invoke('get-version'),
  getBuildNumber: () => ipcRenderer.invoke('get-build-number'),
  detectThemesDirectory: () => ipcRenderer.invoke('detect-themes-directory'),
  openPathInExplorer: (dirPath: string) => ipcRenderer.invoke('open-path-in-explorer', dirPath),
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
});
