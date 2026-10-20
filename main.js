const { app, BrowserWindow, screen, dialog, nativeTheme, Menu, shell, powerSaveBlocker, ipcMain, safeStorage, session, net } = require('electron');
const path = require('path');
const { readFileSync, writeFileSync, existsSync, unlinkSync, mkdirSync } = require('fs');
const url = require('url');
const http = require('http');
const puppeteer = require('puppeteer-core');


let mainWindow;
let secondWindow;
let secondWindowDisplayId = null;
let greenScreenWindow;
let overlayWindowDisplayId = null;
let timerWindows = new Map(); // Store multiple timer windows
let speechBrowser = null;
let speechPage = null;
let speechServer = null;
let keepAwakeBlockerId = null;

// Improve timer reliability in background
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-background-timer-throttling');

// Single instance functionality
const gotTheLock = app.requestSingleInstanceLock();

app.on('before-quit', () => {
    if (speechBrowser) void speechBrowser.close();
    if (speechServer?.listening) speechServer.close();
    if (keepAwakeBlockerId !== null && powerSaveBlocker.isStarted(keepAwakeBlockerId)) {
        powerSaveBlocker.stop(keepAwakeBlockerId);
    }
});

if (!gotTheLock) {
  // Another instance is already running, quit this one
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, focus our window instead
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      mainWindow.show();
    }
  });
}

app.on('ready', () => {
    // Set Dark Theme
    nativeTheme.themeSource = 'dark';

    session.defaultSession.setPermissionRequestHandler((webContents, permission, callback, details) => {
        const requestingLocalApp = webContents.getURL().startsWith('file://');
        const audioOnlyRequest = Array.isArray(details?.mediaTypes)
            && details.mediaTypes.includes('audio')
            && !details.mediaTypes.includes('video');
        callback(permission === 'media' && audioOnlyRequest && requestingLocalApp);
    });

    session.defaultSession.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
        const audioOnlyRequest = details?.mediaType === 'audio';
        return permission === 'media' && audioOnlyRequest && requestingOrigin.startsWith('file://');
    });
    
    // Keep both the computer and display awake while Stage Timer is open.
    keepAwakeBlockerId = powerSaveBlocker.start('prevent-display-sleep');

    mainWindow = new BrowserWindow({
        width: 1050,
        height: 900,
        minWidth: 1050,
        minHeight: 600,
        title: 'Stage Timer - v2.1.0',
        backgroundColor: '#111827',
        darkTheme: true,
        frame: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            webSecurity: true,
            cache: false,
            backgroundThrottling: false,
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, 'public', 'icon.ico'),
        maximizable: true,
        resizable: true
    });

    // Clear cache and load the built React app
    mainWindow.webContents.session.clearCache().then(() => {
        const indexPath = path.join(__dirname, 'public', 'index.html');
        mainWindow.loadFile(indexPath);
    });

    // Customize scrollbar
    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.insertCSS(`
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-thumb {
          background: #666;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-track {
          background: #333;
        }
        `);
    });

    // Setup menu
    setupMenu();


    mainWindow.on('closed', () => {
        app.quit();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
    }
});

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1050,
        height: 900,
        title: 'Stage Timer - v2.0.1',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
        icon: path.join(__dirname, 'public', 'icon.ico'),
        maximizable: false,
        resizable: false
    });

    const indexPath = path.join(__dirname, 'public', 'index.html');
    mainWindow.loadFile(indexPath);
}

function createSecondWindow() {
    const displays = screen.getAllDisplays();
    let targetDisplay = displays[0];

    if (displays.length > 1) {
        // Filter out primary display and create options for secondary displays only
        const secondaryDisplays = displays.filter((display, index) => !display.internal && index > 0);
        
        if (secondaryDisplays.length > 0) {
            const options = secondaryDisplays.map((display, index) => `Secondary Display ${index + 1}: ${display.bounds.width}x${display.bounds.height}`);
            
            // Create a custom dialog with dark theme
            const { BrowserWindow } = require('electron');
            const dialogWindow = new BrowserWindow({
                width: 450,
                height: 300,
                parent: mainWindow,
                modal: true,
                show: false,
                frame: false,
                backgroundColor: '#1a1a1a',
                webPreferences: {
                    nodeIntegration: true,
                    contextIsolation: false
                }
            });
            
            const dialogHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body {
                            margin: 0;
                            padding: 20px;
                            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
                            color: #ffffff;
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                            display: flex;
                            flex-direction: column;
                            height: 100vh;
                            box-sizing: border-box;
                        }
                        .header {
                            text-align: center;
                            margin-bottom: 20px;
                        }
                        .title {
                            font-size: 18px;
                            font-weight: 600;
                            margin-bottom: 8px;
                            color: #4ade80;
                        }
                        .message {
                            font-size: 14px;
                            color: #d1d5db;
                            line-height: 1.4;
                        }
                        .options {
                            flex: 1;
                            display: flex;
                            flex-direction: column;
                            gap: 10px;
                            margin: 20px 0;
                        }
                        .option-btn {
                            padding: 12px 16px;
                            background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
                            border: 2px solid #6b7280;
                            border-radius: 8px;
                            color: #ffffff;
                            cursor: pointer;
                            transition: all 0.3s ease;
                            font-size: 14px;
                            text-align: left;
                        }
                        .option-btn:hover {
                            background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
                            border-color: #16a34a;
                            transform: translateY(-2px);
                            box-shadow: 0 4px 12px rgba(74, 222, 128, 0.3);
                        }
                        .buttons {
                            display: flex;
                            gap: 10px;
                            justify-content: flex-end;
                        }
                        .cancel-btn {
                            padding: 10px 20px;
                            background: #6b7280;
                            border: none;
                            border-radius: 6px;
                            color: white;
                            cursor: pointer;
                            font-size: 14px;
                            transition: background 0.3s ease;
                        }
                        .cancel-btn:hover {
                            background: #9ca3af;
                        }
                        
                        /* Custom Scrollbar */
                        ::-webkit-scrollbar {
                            width: 8px;
                        }
                        
                        ::-webkit-scrollbar-track {
                            background: #1a1a1a;
                            border-radius: 4px;
                        }
                        
                        ::-webkit-scrollbar-thumb {
                            background: linear-gradient(135deg, #4b5563 0%, #6b7280 100%);
                            border-radius: 4px;
                            border: 1px solid #374151;
                        }
                        
                        ::-webkit-scrollbar-thumb:hover {
                            background: linear-gradient(135deg, #6b7280 0%, #9ca3af 100%);
                        }
                        
                        ::-webkit-scrollbar-thumb:active {
                            background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
                        }
                        
                        /* Firefox scrollbar */
                        html {
                            scrollbar-width: thin;
                            scrollbar-color: #6b7280 #1a1a1a;
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="title">🖥️ Select Secondary Display</div>
                        <div class="message">Choose which secondary display to show the timer on:</div>
                    </div>
                    <div class="options">
                        ${options.map((option, index) => `
                            <div class="option-btn" onclick="selectDisplay(${index})">
                                📺 ${option}
                            </div>
                        `).join('')}
                    </div>
                    <div class="buttons">
                        <button class="cancel-btn" onclick="closeAll()">Close All Displays</button>
                        <button class="cancel-btn" onclick="closeDialog()">Cancel</button>
                    </div>
                    <script>
                        const { ipcRenderer } = require('electron');
                        function selectDisplay(index) {
                            ipcRenderer.send('display-selected', index);
                        }
                        function closeDialog() {
                            ipcRenderer.send('dialog-cancelled');
                        }
                        function closeAll() {
                            ipcRenderer.send('close-all-displays');
                            ipcRenderer.send('dialog-cancelled');
                        }
                    </script>
                </body>
                </html>
            `;
            
            dialogWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(dialogHtml));
            dialogWindow.show();
            
            const { ipcMain } = require('electron');
            
            // Remove any existing listeners to prevent conflicts
            ipcMain.removeAllListeners('display-selected');
            ipcMain.removeAllListeners('dialog-cancelled');
            
            ipcMain.once('display-selected', (event, index) => {
                try {
                    targetDisplay = secondaryDisplays[index];
                    openTimerWindow(targetDisplay);
                    if (dialogWindow && !dialogWindow.isDestroyed()) {
                        dialogWindow.close();
                    }
                } catch (error) {
                    console.error('Error in display-selected handler:', error);
                    if (dialogWindow && !dialogWindow.isDestroyed()) {
                        dialogWindow.close();
                    }
                }
            });
            
            ipcMain.once('dialog-cancelled', () => {
                try {
                    if (dialogWindow && !dialogWindow.isDestroyed()) {
                        dialogWindow.close();
                    }
                } catch (error) {
                    console.error('Error in dialog-cancelled handler:', error);
                }
            });
            
            // Clean up listeners when dialog is closed
            dialogWindow.on('closed', () => {
                ipcMain.removeAllListeners('display-selected');
                ipcMain.removeAllListeners('dialog-cancelled');
            });
        } else {
            // No secondary displays, show custom dark modal
            showNoSecondaryScreenModal();
        }
    } else {
        // Show custom alert when no secondary screen is detected
        showNoSecondaryScreenModal();
    }
}

function showNoSecondaryScreenModal() {
    const modalWindow = new BrowserWindow({
        width: 600,
        height: 520,
        minWidth: 400,
        minHeight: 350,
        parent: mainWindow,
        modal: true,
        resizable: true,
        frame: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
        icon: path.join(__dirname, 'public', 'icon.ico'),
    });

    const modalHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
                    color: #ffffff;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }
                
                .header {
                    background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
                    padding: 16px 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 2px solid #6b7280;
                    flex-shrink: 0;
                    gap: 10px;
                }
                
                .title {
                    font-size: 16px;
                    font-weight: 600;
                    color: #fbbf24;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex: 1;
                    min-width: 0;
                }
                
                .close-btn {
                    background: none;
                    border: none;
                    color: #d1d5db;
                    font-size: 22px;
                    cursor: pointer;
                    padding: 4px 8px;
                    border-radius: 4px;
                    transition: all 0.3s ease;
                    flex-shrink: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .close-btn:hover {
                    background: #ef4444;
                    color: white;
                }
                
                .content {
                    flex: 1;
                    padding: 24px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    gap: 16px;
                    overflow-y: auto;
                    min-height: 0;
                }
                
                .icon {
                    font-size: 56px;
                    color: #fbbf24;
                    margin-bottom: 8px;
                    flex-shrink: 0;
                }
                
                .message {
                    font-size: 18px;
                    font-weight: 600;
                    color: #fbbf24;
                    margin-bottom: 8px;
                    flex-shrink: 0;
                }
                
                .description {
                    font-size: 13px;
                    color: #d1d5db;
                    line-height: 1.5;
                    max-width: 95%;
                }
                
                .warning {
                    background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
                    padding: 12px 16px;
                    border-radius: 8px;
                    border: 2px solid #fca5a5;
                    margin: 12px 0;
                    font-size: 12px;
                    color: #ffffff;
                    font-weight: 500;
                    line-height: 1.4;
                    max-width: 95%;
                }
                
                .buttons {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                    margin-top: 16px;
                    justify-content: center;
                    flex-shrink: 0;
                }
                
                .btn {
                    padding: 10px 16px;
                    border: none;
                    border-radius: 8px;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    white-space: nowrap;
                    flex: 1;
                    min-width: 120px;
                    max-width: 140px;
                }
                
                .btn-refresh {
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                    color: white;
                }
                
                .btn-refresh:hover {
                    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
                }
                
                .btn-close {
                    background: linear-gradient(135deg, #6b7280 0%, #9ca3af 100%);
                    color: white;
                }
                
                .btn-close:hover {
                    background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                }
                
                .btn-continue {
                    background: linear-gradient(135deg, #059669 0%, #10b981 100%);
                    color: white;
                }
                
                .btn-continue:hover {
                    background: linear-gradient(135deg, #047857 0%, #059669 100%);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
                }
                
                .btn-continue:focus {
                    outline: 2px solid #10b981;
                    outline-offset: 2px;
                }
                
                /* Responsive design */
                @media (max-width: 500px) {
                    .header {
                        padding: 12px 16px;
                    }
                    
                    .title {
                        font-size: 14px;
                    }
                    
                    .close-btn {
                        font-size: 20px;
                    }
                    
                    .content {
                        padding: 16px;
                        gap: 12px;
                    }
                    
                    .icon {
                        font-size: 48px;
                    }
                    
                    .message {
                        font-size: 16px;
                    }
                    
                    .description {
                        font-size: 12px;
                    }
                    
                    .btn {
                        padding: 8px 12px;
                        font-size: 12px;
                        min-width: 100px;
                        max-width: 130px;
                    }
                }
                
                /* Custom Scrollbar */
                ::-webkit-scrollbar {
                    width: 8px;
                }
                
                ::-webkit-scrollbar-track {
                    background: #1a1a1a;
                    border-radius: 4px;
                }
                
                ::-webkit-scrollbar-thumb {
                    background: linear-gradient(135deg, #4b5563 0%, #6b7280 100%);
                    border-radius: 4px;
                    border: 1px solid #374151;
                }
                
                ::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(135deg, #6b7280 0%, #9ca3af 100%);
                }
                
                ::-webkit-scrollbar-thumb:active {
                    background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
                }
                
                /* Firefox scrollbar */
                html {
                    scrollbar-width: thin;
                    scrollbar-color: #6b7280 #1a1a1a;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="title">
                    <span>⚠️</span>
                    <span>No Secondary Screen Detected</span>
                </div>
                <button class="close-btn" onclick="closeModal()" title="Close">&times;</button>
            </div>
            
            <div class="content">
                <div class="icon">🖥️</div>
                <div class="message">No Secondary Screen Detected!</div>
                <div class="description">
                    For optimal experience, please connect a secondary screen and restart the application. 
                    You can continue with a single display, but you won't be able to use the timer display feature.
                </div>
                
                <div class="warning">
                    ⚠️ <strong>Important:</strong> Without a secondary screen, you cannot display the timer on a separate display. 
                    The timer display feature requires an external monitor or projector.
                </div>
                
                <div class="buttons">
                    <button class="btn btn-refresh" onclick="refreshDisplays()" title="Check for displays">
                        <span>🔄</span>
                        <span>Refresh</span>
                    </button>
                    <button class="btn btn-close" onclick="closeApp()" title="Close application">
                        <span>🚪</span>
                        <span>Close</span>
                    </button>
                    <button class="btn btn-continue" onclick="continueSingleDisplay()" title="Continue with single display">
                        <span>▶️</span>
                        <span>Continue</span>
                    </button>
                </div>
            </div>
            
            <script>
                const { ipcRenderer } = require('electron');
                
                function closeModal() {
                    ipcRenderer.send('modal-closed');
                }
                
                function closeApp() {
                    ipcRenderer.send('close-app');
                }
                
                function continueSingleDisplay() {
                    ipcRenderer.send('continue-single-display');
                }
                
                function refreshDisplays() {
                    ipcRenderer.send('refresh-displays');
                }
                
                // Close modal when clicking outside (on the body)
                document.body.addEventListener('click', (e) => {
                    if (e.target === document.body) {
                        closeModal();
                    }
                });
                
                // Handle escape key
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') {
                        closeModal();
                    }
                });
            </script>
        </body>
        </html>
    `;
    
    modalWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(modalHtml));
    modalWindow.show();
    
    // Handle IPC messages
    ipcMain.once('modal-closed', () => {
        if (modalWindow && !modalWindow.isDestroyed()) {
            modalWindow.close();
        }
    });
    
    ipcMain.once('close-app', () => {
        if (modalWindow && !modalWindow.isDestroyed()) {
            modalWindow.close();
        }
                app.quit();
    });
    
    ipcMain.once('continue-single-display', () => {
        if (modalWindow && !modalWindow.isDestroyed()) {
            modalWindow.close();
        }
        // Do NOT open timer window - just continue with main app
        console.log('Continuing with single display - timer display not available');
    });
    
    ipcMain.once('refresh-displays', () => {
        // Check for displays again
        const displaysList = screen.getAllDisplays();
        const secondaryDisplaysList = displaysList.filter((display, index) => !display.internal && index > 0);
        
        if (secondaryDisplaysList.length > 0) {
            // Secondary screens found - close modal and show advanced multi-screen modal
            console.log(`Display refresh: Found ${secondaryDisplaysList.length} secondary display(s)`);
            if (modalWindow && !modalWindow.isDestroyed()) {
                modalWindow.close();
            }
            // Reopen with options
            setTimeout(() => {
                showAdvancedMultiScreenModal();
            }, 500);
        } else {
            // Still no secondary screens - keep modal open and show message
            console.log('Display refresh: No secondary displays found');
            if (modalWindow && !modalWindow.isDestroyed()) {
                modalWindow.webContents.executeJavaScript(`
                    const msg = document.querySelector('.message');
                    if (msg) {
                        const originalText = msg.textContent;
                        msg.textContent = '📭 Still No Displays Found';
                        setTimeout(() => {
                            msg.textContent = originalText;
                        }, 3000);
                    }
                `);
            }
        }
    });
    
    // Clean up listeners when modal is closed
    modalWindow.on('closed', () => {
        ipcMain.removeAllListeners('modal-closed');
        ipcMain.removeAllListeners('close-app');
        ipcMain.removeAllListeners('continue-single-display');
        ipcMain.removeAllListeners('refresh-displays');
    });
}

// Display Options Functions
function showAdvancedMultiScreenModal() {
    const displays = screen.getAllDisplays();
    const secondaryDisplays = displays.filter((display, index) => !display.internal && index > 0);
    
    if (secondaryDisplays.length === 0) {
        showNoSecondaryScreenModal();
        return;
    }
    
    const modalWindow = new BrowserWindow({
        width: 600,
        height: 500,
        parent: mainWindow,
        modal: true,
        resizable: false,
        frame: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        icon: path.join(__dirname, 'public', 'icon.ico'),
    });

    const modalHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    margin: 0;
                    padding: 20px;
                    background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
                    color: #ffffff;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    display: flex;
                    flex-direction: column;
                    height: 100vh;
                    box-sizing: border-box;
                }
                
                .header {
                    text-align: center;
                    margin-bottom: 20px;
                }
                
                .title {
                    font-size: 20px;
                    font-weight: 600;
                    margin-bottom: 8px;
                    background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                
                .message {
                    font-size: 14px;
                    color: #d1d5db;
                    line-height: 1.5;
                }
                
                .options {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                    margin: 20px 0;
                }
                
                .option-btn {
                    padding: 15px 20px;
                    background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
                    border: 2px solid #6b7280;
                    border-radius: 10px;
                    color: #ffffff;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-size: 14px;
                    text-align: left;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .option-btn:hover {
                    background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
                    border-color: #16a34a;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(74, 222, 128, 0.3);
                }
                
                .option-icon {
                    font-size: 18px;
                    min-width: 24px;
                }
                
                .option-text {
                    flex: 1;
                }
                
                .option-title {
                    font-weight: 600;
                    margin-bottom: 4px;
                }
                
                .option-desc {
                    font-size: 12px;
                    color: #d1d5db;
                    opacity: 0.8;
                }
                
                .buttons {
                    display: flex;
                    gap: 10px;
                    justify-content: flex-end;
                    margin-top: 20px;
                }
                
                .cancel-btn {
                    padding: 10px 20px;
                    background: #6b7280;
                    border: none;
                    border-radius: 6px;
                    color: white;
                    cursor: pointer;
                    font-size: 14px;
                    transition: background 0.2s;
                }
                
                        .cancel-btn:hover {
                            background: #4b5563;
                        }
                        
                        /* Custom Scrollbar */
                        ::-webkit-scrollbar {
                            width: 8px;
                        }
                        
                        ::-webkit-scrollbar-track {
                            background: #1a1a1a;
                            border-radius: 4px;
                        }
                        
                        ::-webkit-scrollbar-thumb {
                            background: linear-gradient(135deg, #4b5563 0%, #6b7280 100%);
                            border-radius: 4px;
                            border: 1px solid #374151;
                        }
                        
                        ::-webkit-scrollbar-thumb:hover {
                            background: linear-gradient(135deg, #6b7280 0%, #9ca3af 100%);
                        }
                        
                        ::-webkit-scrollbar-thumb:active {
                            background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
                        }
                        
                        /* Firefox scrollbar */
                        html {
                            scrollbar-width: thin;
                            scrollbar-color: #6b7280 #1a1a1a;
                        }
            </style>
        </head>
        <body>
             <div class="header">
                 <div class="title">🖥️ Display Options</div>
                 <div class="message">Choose how you want to display the timer:</div>
             </div>
            
             <div class="options">
                 <div class="option-btn" onclick="selectOption('single')">
                     <div class="option-icon">📺</div>
                     <div class="option-text">
                         <div class="option-title">Single Display</div>
                         <div class="option-desc">Display timer on one secondary screen only</div>
                     </div>
                 </div>
                 
                 <div class="option-btn" onclick="selectOption('duplicate')">
                     <div class="option-icon">🔄</div>
                     <div class="option-text">
                         <div class="option-title">Duplicate Display</div>
                         <div class="option-desc">Mirror the same timer to multiple screens</div>
                     </div>
                 </div>
             </div>
            
            <div class="buttons">
                <button class="cancel-btn" onclick="closeDialog()">Cancel</button>
            </div>
            
            <script>
                const { ipcRenderer } = require('electron');
                
                function selectOption(option) {
                    ipcRenderer.send('multi-screen-option-selected', option);
                }
                
                function closeDialog() {
                    ipcRenderer.send('multi-screen-dialog-cancelled');
                }
                
                // Close modal when clicking outside
                document.body.addEventListener('click', (e) => {
                    if (e.target === document.body) {
                        closeDialog();
                    }
                });
                
                // Handle escape key
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') {
                        closeDialog();
                    }
                });
            </script>
        </body>
        </html>
    `;
    
    modalWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(modalHtml));
    modalWindow.show();
    
    // Handle IPC messages
    ipcMain.once('multi-screen-option-selected', (event, option) => {
        try {
            modalWindow.close();
            handleMultiScreenOption(option, secondaryDisplays);
        } catch (error) {
            console.error('Error handling multi-screen option:', error);
        }
    });
    
    ipcMain.once('multi-screen-dialog-cancelled', () => {
        try {
            modalWindow.close();
        } catch (error) {
            console.error('Error closing dialog:', error);
        }
    });
    
    // Clean up listeners when modal is closed
    modalWindow.on('closed', () => {
        ipcMain.removeAllListeners('multi-screen-option-selected');
        ipcMain.removeAllListeners('multi-screen-dialog-cancelled');
    });
}

 function handleMultiScreenOption(option, displays) {
     switch (option) {
         case 'single':
             // Close any existing timer windows first
             if (secondWindow) {
                 secondWindow.close();
             }
             timerWindows.forEach((window) => {
                 if (window && !window.isDestroyed()) {
                     window.close();
                 }
             });
             timerWindows.clear();
             // Use existing single display logic
             createSecondWindow();
             break;
         case 'duplicate':
             showDuplicateDisplaySelector(displays);
             break;
     }
 }

function showDuplicateDisplaySelector(displays) {
    // Close any existing timer windows first
    if (secondWindow) {
        secondWindow.close();
    }
    timerWindows.forEach((window) => {
        if (window && !window.isDestroyed()) {
            window.close();
        }
    });
    timerWindows.clear();
    
    // Create the same timer window on multiple displays
    displays.forEach((display, index) => {
        setTimeout(() => {
            createTimerWindow(display, `duplicate-${index}`);
        }, index * 500);
    });
}

function createTimerWindow(display, windowId) {
    const timerWindow = new BrowserWindow({
        x: display.bounds.x,
        y: display.bounds.y,
        width: display.bounds.width,
        height: display.bounds.height,
        fullscreen: true,
        frame: false,
        skipTaskbar: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            backgroundThrottling: false,
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, 'public', 'icon.ico'),
    });

    // Load the same timer display system as single screen
    const indexPath = path.join(__dirname, 'public', 'index.html');
    timerWindow.loadURL(url.format({
        pathname: indexPath,
        protocol: 'file:',
        slashes: true,
        hash: '/timer'
    }));
    
    // Store the window reference
    timerWindows.set(windowId, timerWindow);
    
    // Clean up when window is closed
    timerWindow.on('closed', () => {
        timerWindows.delete(windowId);
    });
    
    return timerWindow;
}

function openTimerWindow(display) {
    if (secondWindow) {
        secondWindow.close();
    }

    secondWindowDisplayId = display.id;

    secondWindow = new BrowserWindow({
        x: display.bounds.x,
        y: display.bounds.y,
        width: display.bounds.width,
        height: display.bounds.height,
        fullscreen: true,
        frame: false,
        skipTaskbar: true,
        title: 'Stage Display',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            backgroundThrottling: false
        },
        icon: path.join(__dirname, 'public', 'icon.ico'),
    });

    // Load the timer route
    const indexPath = path.join(__dirname, 'public', 'index.html');
    secondWindow.loadURL(url.format({
        pathname: indexPath,
        protocol: 'file:',
        slashes: true,
        hash: '/timer'
    }));

    secondWindow.on('closed', () => {
        secondWindow = null;
    });
}

// Close all secondary/overlay displays without quitting the app
function closeAllDisplays() {
    if (secondWindow && !secondWindow.isDestroyed()) {
        secondWindow.close();
    }
    secondWindow = null;
    secondWindowDisplayId = null;
    timerWindows.forEach((win) => {
        if (win && !win.isDestroyed()) {
            win.close();
        }
    });
    timerWindows.clear();
    if (greenScreenWindow && !greenScreenWindow.isDestroyed()) {
        greenScreenWindow.close();
    }
    greenScreenWindow = null;
    overlayWindowDisplayId = null;
}

function setupMenu() {
    const template = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'Open Timer Display',
                    accelerator: 'CmdOrCtrl+T',
                    click: createSecondWindow
                },
                 {
                     label: 'Display Options',
                     accelerator: 'CmdOrCtrl+M',
                     click: showAdvancedMultiScreenModal
                 },
                { type: 'separator' },
                {
                    label: 'Switch Timer Display',
                    accelerator: 'CmdOrCtrl+Shift+T',
                    click: () => {
                        // Close existing timer display and create new one
                        if (secondWindow) {
                            secondWindow.close();
                        }
                        // Wait a moment for the window to close, then create new one
                        setTimeout(() => {
                            createSecondWindow();
                        }, 500);
                    }
                },
                {
                    label: 'Close All Displays',
                    accelerator: 'CmdOrCtrl+W',
                    click: closeAllDisplays
                },
                { type: 'separator' },
                {
                    label: 'Refresh',
                    accelerator: 'CmdOrCtrl+R',
                    click: () => {
                        // Clear app cache
                        if (mainWindow && mainWindow.webContents) {
                            mainWindow.webContents.session.clearCache();
                            mainWindow.webContents.reload();
                        }
                        // Refresh secondary window if it exists
                        if (secondWindow && secondWindow.webContents) {
                            secondWindow.webContents.session.clearCache();
                            secondWindow.webContents.reload();
                        }
                        // Refresh all timer windows
                        timerWindows.forEach((window) => {
                            if (window && window.webContents) {
                                window.webContents.session.clearCache();
                                window.webContents.reload();
                            }
                        });
                    }
                },
                {
                    label: 'Force Refresh (Clear All Cache)',
                    accelerator: 'CmdOrCtrl+Shift+R',
                    click: async () => {
                        // Clear all types of cache and storage
                        if (mainWindow && mainWindow.webContents) {
                            const session = mainWindow.webContents.session;
                            await session.clearCache();
                            await session.clearStorageData();
                            await session.clearCodeCaches({});
                            mainWindow.webContents.reloadIgnoringCache();
                        }
                        // Force refresh secondary window if it exists
                        if (secondWindow && secondWindow.webContents) {
                            const session = secondWindow.webContents.session;
                            await session.clearCache();
                            await session.clearStorageData();
                            await session.clearCodeCaches({});
                            secondWindow.webContents.reloadIgnoringCache();
                        }
                        // Force refresh all timer windows
                        for (const [windowId, window] of timerWindows) {
                            if (window && window.webContents) {
                                const session = window.webContents.session;
                                await session.clearCache();
                                await session.clearStorageData();
                                await session.clearCodeCaches({});
                                window.webContents.reloadIgnoringCache();
                            }
                        }
                    }
                },
                { type: 'separator' },
                {
                    label: 'Clear All Data (Reset App)',
                    accelerator: 'CmdOrCtrl+Shift+Delete',
                    click: async () => {
                        const result = await dialog.showMessageBox(mainWindow, {
                            type: 'warning',
                            buttons: ['Cancel', 'Clear All Data'],
                            defaultId: 0,
                            title: 'Clear All Data',
                            message: 'This will clear all saved data including:',
                            detail: '• Programs and categories\n• Timer history\n• Display settings\n• Background preferences\n\nThis action cannot be undone. Are you sure you want to continue?'
                        });
                        
                        if (result.response === 1) {
                            // Clear all storage data
                            if (mainWindow && mainWindow.webContents) {
                                const session = mainWindow.webContents.session;
                                await session.clearCache();
                                await session.clearStorageData();
                                await session.clearCodeCaches({});
                                mainWindow.webContents.reloadIgnoringCache();
                            }
                            // Clear secondary window if it exists
                            if (secondWindow && secondWindow.webContents) {
                                const session = secondWindow.webContents.session;
                                await session.clearCache();
                                await session.clearStorageData();
                                await session.clearCodeCaches({});
                                secondWindow.webContents.reloadIgnoringCache();
                            }
                        }
                    }
                },
                { type: 'separator' },
                {
                    label: 'Exit',
                    accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                    click: () => {
                        app.quit();
                    }
                }
            ]
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'About',
                    click: () => {
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'About Stage Timer',
                            message: 'Stage Timer App v2.0.0',
                            detail: 'A flexible timer application for stage management.'
                        });
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// IPC Handlers
ipcMain.on('open-advanced-multiscreen', () => {
    showAdvancedMultiScreenModal();
});

ipcMain.handle('get-displays', () => {
    const displays = screen.getAllDisplays();
    const primaryDisplay = screen.getPrimaryDisplay();
    return displays.map((display, idx) => ({
        id: display.id,
        label: display.label || `Display ${idx + 1}: ${display.bounds.width}x${display.bounds.height}`,
        bounds: display.bounds,
        isPrimary: display.id === primaryDisplay.id,
        isUsedByMainTimer: display.id === secondWindowDisplayId,
        isUsedByOverlay: display.id === overlayWindowDisplayId
    }));
});

ipcMain.handle('check-internet-connection', async () => {
    const endpoints = [
        'https://www.google.com/generate_204',
        'https://api.github.com/rate_limit',
        'https://www.cloudflare.com/cdn-cgi/trace',
    ];
    const checks = await Promise.all(endpoints.map(async endpoint => {
        try {
            const response = await net.fetch(endpoint, { signal: AbortSignal.timeout(7000) });
            return { endpoint, online: response.status >= 200 && response.status < 500, status: response.status };
        } catch (error) {
            return { endpoint, online: false, error: error instanceof Error ? error.message : String(error) };
        }
    }));
    return { online: checks.some(check => check.online), checkedAt: Date.now(), checks };
});

const findChromeExecutable = () => {
        const candidates = process.platform === 'win32'
                ? [
                        path.join(process.env.PROGRAMFILES || 'C:\\Program Files', 'Google', 'Chrome', 'Application', 'chrome.exe'),
                        path.join(process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)', 'Google', 'Chrome', 'Application', 'chrome.exe'),
                        path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
                ]
                : process.platform === 'darwin'
                        ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']
                        : ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
        return candidates.find(candidate => candidate && existsSync(candidate));
};

const getSpeechPageHtml = () => `<!doctype html><html><head><meta charset="utf-8"><title>Stage Timer Speech Bridge</title></head><body><script>
let recognition = null;
let microphoneStream = null;
const emit = data => window.__stageTimerEmit(data);
window.startStageRecognition = async ({ language, deviceLabel }) => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) throw new Error('SpeechRecognition is not available in the installed Google Chrome build.');
    try {
        const permissionStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const selected = deviceLabel && devices.find(device => device.kind === 'audioinput' && device.label === deviceLabel);
        permissionStream.getTracks().forEach(track => track.stop());
        microphoneStream = await navigator.mediaDevices.getUserMedia({ audio: selected ? { deviceId: { exact: selected.deviceId } } : true });
        const audioTrack = microphoneStream.getAudioTracks()[0];
        recognition = new Recognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        recognition.lang = language || 'en-US';
        recognition.onstart = () => emit({ type: 'start' });
        recognition.onend = () => {
            emit({ type: 'end' });
            microphoneStream?.getTracks().forEach(track => track.stop());
            microphoneStream = null;
            recognition = null;
        };
        recognition.onerror = event => {
            emit({ type: 'error', error: event.error });
            microphoneStream?.getTracks().forEach(track => track.stop());
            microphoneStream = null;
        };
        recognition.onresult = event => {
            let finalText = '';
            let interimText = '';
            for (let index = event.resultIndex; index < event.results.length; index += 1) {
                const result = event.results[index];
                if (result.isFinal) finalText += result[0].transcript;
                else interimText += result[0].transcript;
            }
            emit({ type: 'result', finalText, interimText });
        };
        try {
            recognition.start(audioTrack);
            return { selectedDevice: selected?.label || audioTrack.label, customTrack: true };
        } catch (error) {
            if (!(error instanceof TypeError)) throw error;
            recognition.start();
            return { selectedDevice: audioTrack.label, customTrack: false };
        }
    } catch (error) {
        microphoneStream?.getTracks().forEach(track => track.stop());
        microphoneStream = null;
        throw error;
    }
};
window.stopStageRecognition = () => {
    recognition?.stop();
    recognition = null;
    microphoneStream?.getTracks().forEach(track => track.stop());
    microphoneStream = null;
};
</script></body></html>`;

const ensureSpeechBrowser = async () => {
        if (speechBrowser && speechPage && !speechBrowser.connected) {
                speechBrowser = null;
                speechPage = null;
        }
        if (speechBrowser && speechPage) return speechPage;

        const executablePath = findChromeExecutable();
        if (!executablePath) throw new Error('Google Chrome was not found. Install Google Chrome to use live transcription.');

        if (!speechServer) {
                speechServer = http.createServer((request, response) => {
                        response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
                        response.end(getSpeechPageHtml());
                });
                await new Promise((resolve, reject) => {
                        speechServer.once('error', reject);
                        speechServer.listen(0, '127.0.0.1', resolve);
                });
        }
        const address = speechServer.address();
        if (!address || typeof address === 'string') throw new Error('Could not start the local Chrome speech bridge.');
        const origin = `http://127.0.0.1:${address.port}`;

        speechBrowser = await puppeteer.launch({
                executablePath,
            headless: true,
                userDataDir: path.join(app.getPath('userData'), 'speech-chrome-profile'),
                defaultViewport: { width: 400, height: 300 },
                args: [
                        '--no-first-run',
                        '--no-default-browser-check',
                        '--disable-background-timer-throttling',
                        '--disable-renderer-backgrounding',
                ],
        });
        await speechBrowser.defaultBrowserContext().overridePermissions(origin, ['microphone']);
        speechPage = await speechBrowser.newPage();
        await speechPage.exposeFunction('__stageTimerEmit', data => {
                if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('speech-recognition-event', data);
        });
        await speechPage.goto(origin);
        speechBrowser.on('disconnected', () => {
                speechBrowser = null;
                speechPage = null;
        });
        return speechPage;
};

ipcMain.handle('start-chrome-speech-recognition', async (event, request) => {
        const page = await ensureSpeechBrowser();
        return page.evaluate(options => window.startStageRecognition(options), {
                language: typeof request?.language === 'string' ? request.language : 'en-US',
                deviceLabel: typeof request?.deviceLabel === 'string' ? request.deviceLabel : '',
        });
});

ipcMain.handle('stop-chrome-speech-recognition', async () => {
        if (speechPage) await speechPage.evaluate(() => window.stopStageRecognition());
        return { ok: true };
});

ipcMain.handle('open-copilot-token-page', () => shell.openExternal('https://github.com/settings/tokens'));

const getGitHubTokenPath = () => path.join(app.getPath('userData'), 'copilot-token.bin');
const isSecureStorageAvailable = () => Boolean(safeStorage && safeStorage.isEncryptionAvailable());

const readGitHubModelsToken = () => {
    const tokenPath = getGitHubTokenPath();
    if (!isSecureStorageAvailable() || !existsSync(tokenPath)) return null;
    try {
        return safeStorage.decryptString(readFileSync(tokenPath));
    } catch {
        return null;
    }
};

const splitTranscript = (transcript, maxCharacters = 40000) => {
    const chunks = [];
    let remaining = transcript.trim();
    while (remaining.length > maxCharacters) {
        let splitAt = remaining.lastIndexOf('\n', maxCharacters);
        if (splitAt < maxCharacters * 0.65) splitAt = remaining.lastIndexOf(' ', maxCharacters);
        if (splitAt < maxCharacters * 0.65) splitAt = maxCharacters;
        chunks.push(remaining.slice(0, splitAt).trim());
        remaining = remaining.slice(splitAt).trim();
    }
    if (remaining) chunks.push(remaining);
    return chunks;
};

const getMostRecentSundayLabel = () => {
    const date = new Date();
    date.setDate(date.getDate() - date.getDay());
    return `Sunday, ${date.getDate()} ${date.toLocaleString('en-US', { month: 'short' })} ${date.getFullYear()}`;
};

ipcMain.handle('copilot-token-status', () => ({
    configured: Boolean(readGitHubModelsToken()),
    encryptionAvailable: isSecureStorageAvailable(),
}));

ipcMain.handle('save-copilot-token', (event, token) => {
    if (typeof token !== 'string' || token.trim().length < 10) return { ok: false, error: 'Enter a valid GitHub token for Copilot.' };
    if (!isSecureStorageAvailable()) return { ok: false, error: 'Secure token storage is unavailable in this Electron version. Update Electron before saving a token; no token was stored.' };
    try {
        const userDataPath = app.getPath('userData');
        mkdirSync(userDataPath, { recursive: true });
        writeFileSync(getGitHubTokenPath(), safeStorage.encryptString(token.trim()), { mode: 0o600 });
        return { ok: true };
    } catch {
        return { ok: false, error: 'Could not securely save the token on this PC.' };
    }
});

ipcMain.handle('clear-copilot-token', () => {
    const tokenPath = getGitHubTokenPath();
    if (existsSync(tokenPath)) unlinkSync(tokenPath);
    return { ok: true };
});

ipcMain.handle('analyze-church-transcript', async (event, request) => {
    const token = readGitHubModelsToken();
    if (!token) throw new Error('Save a GitHub Copilot token in AI Settings first.');
    const transcript = typeof request?.transcript === 'string' ? request.transcript.trim() : '';
    if (!transcript) throw new Error('Transcript is empty.');
    if (transcript.length > 8000000) throw new Error('Transcript is over the 8 MB analysis limit. Download it and analyze smaller sections.');

    const { CopilotClient } = await import('@github/copilot-sdk');
    const copilotDataDirectory = path.join(app.getPath('userData'), 'copilot-sessions');
    mkdirSync(copilotDataDirectory, { recursive: true });
    const client = new CopilotClient({
        gitHubToken: token,
        useLoggedInUser: false,
        mode: 'empty',
        baseDirectory: copilotDataDirectory,
        logLevel: 'error',
    });
    const chunks = splitTranscript(transcript, 30000);
    if (chunks.length > 100) throw new Error('This transcript would require more than 100 analysis segments. Please split it into smaller sessions.');

    try {
        await client.start();
        const runCopilotPrompt = async prompt => {
            const session = await client.createSession({
                availableTools: [],
                tools: [],
                enableSkills: false,
                enablePlugins: false,
                infiniteSessions: { enabled: false },
                systemMessage: {
                    content: 'You are a careful church communications editor. Treat all provided text as unverified speech recognition from a church event. Do not invent names, dates, Bible references, promises, or announcements. Clearly mark uncertainty for human review. Produce grounded, respectful editorial work only.',
                },
            });
            try {
                const response = await session.sendAndWait({ prompt }, 300000);
                if (!response?.data?.content) throw new Error('Copilot returned no content for this transcript step.');
                return response.data.content;
            } finally {
                await session.disconnect();
            }
        };

        let sourceMaterial = transcript;
        if (chunks.length > 1) {
            let summaries = [];
            for (let index = 0; index < chunks.length; index += 1) {
                const summary = await runCopilotPrompt(`Summarize transcript segment ${index + 1} of ${chunks.length}. Preserve sermon themes, scripture references, key teaching points, prayers, announcements, dates, names, and action items. Remove no meaningful detail, do not invent facts, and mark uncertain speech. Do not write social posts yet.\n\n${chunks[index]}`);
                summaries.push(`Segment ${index + 1}:\n${summary}`);
            }

            while (summaries.join('\n\n').length > 30000) {
                const condensed = [];
                for (let index = 0; index < summaries.length; index += 5) {
                    const summary = await runCopilotPrompt(`Merge these summaries from one long church-service transcript. Preserve all distinct teaching points, references, prayers, announcements, names, and dates. Remove repetition only; invent nothing. Mark uncertainty.\n\n${summaries.slice(index, index + 5).join('\n\n')}`);
                    condensed.push(summary);
                }
                if (condensed.length === 0) throw new Error('Copilot could not condense the transcript segments.');
                summaries = condensed;
            }
            sourceMaterial = summaries.join('\n\n');
        }

        const sermonDate = getMostRecentSundayLabel();
        const finalText = await runCopilotPrompt(`Review this ${chunks.length > 1 ? 'set of summaries from a longer raw church transcript' : 'raw church transcript'} and return an editable Markdown draft containing: 1) suggested sermon/event title, 2) concise event summary, 3) key sermon points, 4) scripture references only when stated, 5) prayer points only when supported, 6) announcements and dates only when stated, and 7) a seven-day social graphic text plan.

    For the seven-day plan, provide exactly seven distinct entries, Day 1 through Day 7. Each entry must contain exactly two short lines: first, a memorable keyword, direct phrase, or practical advice drawn faithfully from the sermon (ideally 4-12 words, suitable as the large headline on a square social graphic); second, this attribution line using this exact date and the suggested sermon title: From ${sermonDate} sermon titled \"[suggested sermon title]\". Keep the headline and attribution as the entire post: no paragraphs, setup copy, hashtags, emoji, scripture reference additions, or commentary. Use a different sermon-grounded headline each day. Never invent a title, quote, date, fact, or promise; paraphrase when exact wording is uncertain and mark uncertain details [VERIFY].

    Keep the summary and sermon sections useful but concise. Do not claim posts have been scheduled or published.\n\n${sourceMaterial}`);
        return { text: finalText };
    } finally {
        await client.stop();
    }
});


ipcMain.on('open-green-screen-timer', (event, displayId) => {
    const displays = screen.getAllDisplays();
    const targetDisplay = displays.find(d => d.id === displayId) || screen.getPrimaryDisplay();

    if (greenScreenWindow) {
        greenScreenWindow.close();
    }

    greenScreenWindow = new BrowserWindow({
        x: targetDisplay.bounds.x,
        y: targetDisplay.bounds.y,
        width: targetDisplay.bounds.width,
        height: targetDisplay.bounds.height,
        fullscreen: true,
        frame: false,
        skipTaskbar: true,
        title: 'Green Screen Timer',
        backgroundColor: '#000000',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            backgroundThrottling: false
        },
        icon: path.join(__dirname, 'public', 'icon.ico'),
    });

    const indexPath = path.join(__dirname, 'public', 'index.html');
    greenScreenWindow.loadURL(url.format({
        pathname: indexPath,
        protocol: 'file:',
        slashes: true,
        hash: '/green-screen'
    }));

    overlayWindowDisplayId = targetDisplay.id;

    greenScreenWindow.on('closed', () => {
        greenScreenWindow = null;
        overlayWindowDisplayId = null;
    });
});

// Bible projection window support
let bibleWindow = null;
let bibleWindowDisplayId = null;
ipcMain.on('open-bible-projection', (event, displayId) => {
    const displays = screen.getAllDisplays();
    const targetDisplay = displays.find(d => d.id === displayId) || screen.getPrimaryDisplay();

    if (bibleWindow) {
        if (bibleWindowDisplayId !== targetDisplay.id) {
            bibleWindow.setFullScreen(false);
            bibleWindow.setBounds({
                x: targetDisplay.bounds.x,
                y: targetDisplay.bounds.y,
                width: targetDisplay.bounds.width,
                height: targetDisplay.bounds.height,
            });
            bibleWindowDisplayId = targetDisplay.id;
            bibleWindow.setFullScreen(true);
        }
        bibleWindow.show();
        return;
    }

    bibleWindow = new BrowserWindow({
        x: targetDisplay.bounds.x,
        y: targetDisplay.bounds.y,
        width: targetDisplay.bounds.width,
        height: targetDisplay.bounds.height,
        fullscreen: true,
        frame: false,
        skipTaskbar: true,
        title: 'Bible Projection',
        backgroundColor: '#000000',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            backgroundThrottling: false
        },
        icon: path.join(__dirname, 'public', 'icon.ico'),
    });

    const indexPath = path.join(__dirname, 'public', 'index.html');
    bibleWindow.loadURL(url.format({
        pathname: indexPath,
        protocol: 'file:',
        slashes: true,
        hash: '/bible-projection'
    }));

    bibleWindowDisplayId = targetDisplay.id;

    bibleWindow.on('closed', () => {
        bibleWindow = null;
        bibleWindowDisplayId = null;
    });
});

ipcMain.on('close-bible-projection', () => {
    if (bibleWindow) {
        bibleWindow.close();
    }
    bibleWindowDisplayId = null;
});

ipcMain.on('open-timer-display', (event, displayId) => {
    const displays = screen.getAllDisplays();
    const targetDisplay = displays.find(d => d.id === displayId) || screen.getPrimaryDisplay();

    if (secondWindow) {
        secondWindow.close();
    }

    secondWindowDisplayId = targetDisplay.id;

    secondWindow = new BrowserWindow({
        x: targetDisplay.bounds.x,
        y: targetDisplay.bounds.y,
        width: targetDisplay.bounds.width,
        height: targetDisplay.bounds.height,
        fullscreen: true,
        frame: false,
        skipTaskbar: true,
        title: 'Stage Display',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            backgroundThrottling: false
        },
        icon: path.join(__dirname, 'public', 'icon.ico'),
    });

    const indexPath = path.join(__dirname, 'public', 'index.html');
    secondWindow.loadURL(url.format({
        pathname: indexPath,
        protocol: 'file:',
        slashes: true,
        hash: '/timer'
    }));

    secondWindow.on('closed', () => {
        secondWindow = null;
        secondWindowDisplayId = null;
    });
});

ipcMain.on('close-timer-display', () => {
    if (secondWindow) {
        secondWindow.close();
    }
    secondWindowDisplayId = null;
});

ipcMain.on('test-display', (event, displayId) => {
    const displays = screen.getAllDisplays();
    const targetDisplay = displays.find(d => d.id === displayId) || screen.getPrimaryDisplay();

    const testWindow = new BrowserWindow({
        x: targetDisplay.bounds.x,
        y: targetDisplay.bounds.y,
        width: targetDisplay.bounds.width,
        height: targetDisplay.bounds.height,
        fullscreen: true,
        frame: false,
        skipTaskbar: true,
        alwaysOnTop: true,
        focusable: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <title>Test Display</title>
          <style>
            body { margin:0; display:flex; align-items:center; justify-content:center; background:#000; color:#fff; font-family:system-ui, sans-serif; }
            .box { text-align:center; }
            .title { font-size: 4rem; font-weight: 700; margin-bottom: 1rem; }
            .sub { font-size: 1.5rem; opacity: 0.8; }
          </style>
        </head>
        <body>
          <div class="box">
            <div class="title">Bible Displays Here</div>
            <div class="sub">(This is a test screen)</div>
          </div>
        </body>
        </html>
    `;

    testWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));

    setTimeout(() => {
        if (!testWindow.isDestroyed()) {
            testWindow.close();
        }
    }, 2000);
});

ipcMain.on('close-green-screen-timer', () => {
    if (greenScreenWindow) {
        greenScreenWindow.close();
    }
    overlayWindowDisplayId = null;
});

ipcMain.handle('clear-cache', async () => {
    try {
        // Clear all types of cache and storage
        if (mainWindow && mainWindow.webContents) {
            const session = mainWindow.webContents.session;
            await session.clearCache();
            await session.clearCodeCaches({});
            mainWindow.webContents.reloadIgnoringCache();
        }
        // Force refresh secondary window if it exists
        if (secondWindow && secondWindow.webContents) {
            const session = secondWindow.webContents.session;
            await session.clearCache();
            await session.clearCodeCaches({});
            secondWindow.webContents.reloadIgnoringCache();
        }
        return { success: true };
    } catch (error) {
        console.error('Error clearing cache:', error);
        return { success: false, error: error.message };
    }
});

// Window controls for custom title bar
ipcMain.on('window:minimize', () => {
    if (mainWindow) {
        mainWindow.minimize();
    }
});

ipcMain.on('window:toggle-maximize', () => {
    if (!mainWindow) return;
    if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
    } else {
        mainWindow.maximize();
    }
});

ipcMain.on('window:close', () => {
    if (mainWindow) {
        mainWindow.close();
    }
});

ipcMain.handle('window:is-maximized', () => {
    return mainWindow ? mainWindow.isMaximized() : false;
});

// Close all displays (IPC)
ipcMain.on('close-all-displays', () => {
    closeAllDisplays();
});
