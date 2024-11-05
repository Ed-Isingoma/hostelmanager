const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  call: (funcName, params = []) => ipcRenderer.invoke("call", funcName, params)
});

