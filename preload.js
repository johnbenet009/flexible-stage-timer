const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    clearCache: () => ipcRenderer.invoke('clear-cache'),
    openAdvancedMultiScreen: () => ipcRenderer.send('open-advanced-multiscreen')
});
