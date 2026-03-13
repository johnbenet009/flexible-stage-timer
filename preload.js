const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    clearCache: () => ipcRenderer.invoke('clear-cache'),
    openAdvancedMultiScreen: () => ipcRenderer.send('open-advanced-multiscreen'),
    getDisplays: () => ipcRenderer.invoke('get-displays'),
    openGreenScreenTimer: (displayId) => ipcRenderer.send('open-green-screen-timer', displayId),
    closeGreenScreenTimer: () => ipcRenderer.send('close-green-screen-timer'),
    openBibleProjection: (displayId) => ipcRenderer.send('open-bible-projection', displayId),
    closeBibleProjection: () => ipcRenderer.send('close-bible-projection'),
    windowMinimize: () => ipcRenderer.send('window:minimize'),
    windowToggleMaximize: () => ipcRenderer.send('window:toggle-maximize'),
    windowClose: () => ipcRenderer.send('window:close'),
    windowIsMaximized: () => ipcRenderer.invoke('window:is-maximized'),
    closeAllDisplays: () => ipcRenderer.send('close-all-displays'),
    openTimerDisplay: (displayId) => ipcRenderer.send('open-timer-display', displayId),
    closeTimerDisplay: () => ipcRenderer.send('close-timer-display'),
    testDisplay: (displayId) => ipcRenderer.send('test-display', displayId),

});
