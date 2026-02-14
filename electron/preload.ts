import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Placeholder for future API methods
  getVersion: () => ipcRenderer.invoke('get-version'),
  getBuildNumber: () => ipcRenderer.invoke('get-build-number'),
});
