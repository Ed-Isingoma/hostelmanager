const { contextBridge, ipcRenderer } = require('electron');

// Expose only the necessary functions to the renderer process
contextBridge.exposeInMainWorld('electron', {
  call: (funcName, params) => ipcRenderer.invoke('call', funcName, params),
});
