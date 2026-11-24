const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    clearCache: () => ipcRenderer.invoke('clear-cache'),
    openAdvancedMultiScreen: () => ipcRenderer.send('open-advanced-multiscreen'),
    getDisplays: () => ipcRenderer.invoke('get-displays'),
    requestStartupDisplay: () => ipcRenderer.invoke('startup-display-request'),
    onDisplaysChanged: (callback) => {
        const listener = (event, displays) => callback(displays);
        ipcRenderer.on('displays-changed', listener);
        return () => ipcRenderer.removeListener('displays-changed', listener);
    },
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
    navigateBibleProjection: (direction) => ipcRenderer.send('navigate-bible-projection', direction),
    onBibleProjectionNavigate: (callback) => {
        const listener = (event, direction) => callback(direction);
        ipcRenderer.on('bible-projection-navigate', listener);
        return () => ipcRenderer.removeListener('bible-projection-navigate', listener);
    },
    typeBibleProjectionKey: (key) => ipcRenderer.send('type-bible-projection-key', key),
    onBibleProjectionKey: (callback) => {
        const listener = (event, key) => callback(key);
        ipcRenderer.on('bible-projection-key', listener);
        return () => ipcRenderer.removeListener('bible-projection-key', listener);
    },
    onBibleProjectionClosed: (callback) => {
        const listener = () => callback();
        ipcRenderer.on('bible-projection-closed', listener);
        return () => ipcRenderer.removeListener('bible-projection-closed', listener);
    },
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
    remoteTunnelStart: () => ipcRenderer.invoke('remote-tunnel-start'),
    remoteTunnelStop: () => ipcRenderer.invoke('remote-tunnel-stop'),
    remoteTunnelStatus: () => ipcRenderer.invoke('remote-tunnel-status'),
    onRemoteTunnelStatus: (callback) => {
        const listener = (event, status) => callback(status);
        ipcRenderer.on('remote-tunnel-status', listener);
        ipcRenderer.send('remote-tunnel-status-subscribe');
        return () => ipcRenderer.removeListener('remote-tunnel-status', listener);
    },
    remotePublish: (state) => ipcRenderer.send('remote-publish-state', state),
    remoteSendSignal: (target, payload) => ipcRenderer.send('remote-send-signal', target, payload),
    onRemoteSignal: (callback) => {
        const listener = (event, signal) => callback(signal);
        ipcRenderer.on('remote-signal', listener);
        return () => ipcRenderer.removeListener('remote-signal', listener);
    },
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
