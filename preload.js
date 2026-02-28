const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    clearCache: () => ipcRenderer.invoke('clear-cache'),
    openAdvancedMultiScreen: () => ipcRenderer.send('open-advanced-multiscreen'),
    getDisplays: () => ipcRenderer.invoke('get-displays'),
    openGreenScreenTimer: (displayId) => ipcRenderer.send('open-green-screen-timer', displayId),
    closeGreenScreenTimer: () => ipcRenderer.send('close-green-screen-timer'),
    windowMinimize: () => ipcRenderer.send('window:minimize'),
    windowToggleMaximize: () => ipcRenderer.send('window:toggle-maximize'),
    windowClose: () => ipcRenderer.send('window:close'),
    windowIsMaximized: () => ipcRenderer.invoke('window:is-maximized')
});
