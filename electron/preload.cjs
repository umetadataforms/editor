const { contextBridge, ipcRenderer } = require('electron');

const api = {
  selectTabularFile: () => ipcRenderer.invoke('umfe:select-tabular-file'),
  generateTabularMetadata: (options) => ipcRenderer.invoke('umfe:generate-tabular', options),
};

contextBridge.exposeInMainWorld('umfe', api);
