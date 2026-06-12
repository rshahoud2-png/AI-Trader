const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('terminalShell', {
  platform: process.platform,
  packagedAt: new Date().toISOString()
});
