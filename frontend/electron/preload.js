const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  // Expose specific capabilities to the frontend here if needed
  // Example: sendNotification: (message) => ipcRenderer.send('notify', message)
});
