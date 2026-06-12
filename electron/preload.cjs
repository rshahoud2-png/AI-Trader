const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('terminalShell', {
  platform: process.platform,
  packagedAt: new Date().toISOString(),
  apiBase: process.env.ELECTRON_API_BASE || 'https://ai-trader-alpha-green.vercel.app'
});
