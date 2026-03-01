const { contextBridge } = require('electron')

// Expone APIs seguras al renderer si las necesitas
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform
})
