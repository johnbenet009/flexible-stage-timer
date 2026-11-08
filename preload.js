const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    clearCache: () => ipcRenderer.invoke('clear-cache'),
    openAdvancedMultiScreen: () => ipcRenderer.send('open-advanced-multiscreen'),
    getDisplays: () => ipcRenderer.invoke('get-displays'),
    checkInternetConnection: () => ipcRenderer.invoke('check-internet-connection'),
    startChromeSpeechRecognition: (request) => ipcRenderer.invoke('start-chrome-speech-recognition', request),
    stopChromeSpeechRecognition: () => ipcRenderer.invoke('stop-chrome-speech-recognition'),
    openCopilotTokenPage: () => ipcRenderer.invoke('open-copilot-token-page'),
    onSpeechRecognitionEvent: (callback) => {
        const listener = (event, data) => callback(data);
        ipcRenderer.on('speech-recognition-event', listener);
        return () => ipcRenderer.removeListener('speech-recognition-event', listener);
    },
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
    getCopilotTokenStatus: () => ipcRenderer.invoke('copilot-token-status'),
    saveCopilotToken: (token) => ipcRenderer.invoke('save-copilot-token', token),
    clearCopilotToken: () => ipcRenderer.invoke('clear-copilot-token'),
    analyzeChurchTranscript: (request) => ipcRenderer.invoke('analyze-church-transcript', request),
    saveSelectedDisplay: (displayId) => ipcRenderer.send('save-selected-display', displayId),
    dbGet: (key) => ipcRenderer.invoke('db-get', key),
    dbSet: (key, value) => ipcRenderer.invoke('db-set', key, value),
    dbGetAll: () => ipcRenderer.invoke('db-get-all'),
    remoteStart: () => ipcRenderer.invoke('remote-server-start'),
    remoteStop: () => ipcRenderer.invoke('remote-server-stop'),
    remoteStatus: () => ipcRenderer.invoke('remote-server-status'),
    remoteSetPin: (pin) => ipcRenderer.invoke('remote-server-set-pin', pin),
    remotePublish: (state) => ipcRenderer.send('remote-publish-state', state),
    onRemoteCommand: (callback) => {
        const listener = (event, command) => callback(command);
        ipcRenderer.on('remote-command', listener);
        return () => ipcRenderer.removeListener('remote-command', listener);
    },
    onRemoteClientsChanged: (callback) => {
        const listener = (event, count) => callback(count);
        ipcRenderer.on('remote-clients-changed', listener);
        return () => ipcRenderer.removeListener('remote-clients-changed', listener);
    },
    openExternalUrl: (url) => ipcRenderer.send('open-external-url', url),
});
