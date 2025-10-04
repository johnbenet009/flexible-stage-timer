const { app, BrowserWindow, screen, dialog, nativeTheme, Menu, shell, powerSaveBlocker, ipcMain } = require('electron');
const path = require('path');
const { readFileSync } = require('fs');
const url = require('url');

let mainWindow;
let secondWindow;
let timerWindows = new Map(); // Store multiple timer windows

// Single instance functionality
const gotTheLock = app.requestSingleInstanceLock();

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
    
    // Prevent the app from going to sleep when timer is running
    powerSaveBlocker.start('prevent-app-suspension');

    mainWindow = new BrowserWindow({
        width: 1050,
        height: 900,
        minWidth: 1050,
        minHeight: 600,
        title: 'Stage Timer - v2.0.1',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            webSecurity: true,
            cache: false,
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

    // Automatically attempt to create second window on startup
    setTimeout(() => {
        createSecondWindow();
    }, 1000);

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
        width: 500,
        height: 400,
        parent: mainWindow,
        modal: true,
        resizable: false,
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
                    padding: 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 2px solid #6b7280;
                }
                
                .title {
                    font-size: 18px;
                    font-weight: 600;
                    color: #fbbf24;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                
                .close-btn {
                    background: none;
                    border: none;
                    color: #d1d5db;
                    font-size: 24px;
                    cursor: pointer;
                    padding: 5px;
                    border-radius: 4px;
                    transition: all 0.3s ease;
                }
                
                .close-btn:hover {
                    background: #ef4444;
                    color: white;
                }
                
                .content {
                    flex: 1;
                    padding: 30px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    gap: 20px;
                }
                
                .icon {
                    font-size: 64px;
                    color: #fbbf24;
                    margin-bottom: 10px;
                }
                
                .message {
                    font-size: 20px;
                    font-weight: 600;
                    color: #fbbf24;
                    margin-bottom: 10px;
                }
                
                .description {
                    font-size: 14px;
                    color: #d1d5db;
                    line-height: 1.6;
                    max-width: 400px;
                }
                
                .warning {
                    background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
                    padding: 15px;
                    border-radius: 8px;
                    border: 2px solid #fca5a5;
                    margin: 20px 0;
                    font-size: 13px;
                    color: #ffffff;
                    font-weight: 500;
                }
                
                .buttons {
                    display: flex;
                    gap: 15px;
                    margin-top: 20px;
                }
                
                .btn {
                    padding: 12px 24px;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    min-width: 180px;
                    justify-content: center;
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
                <button class="close-btn" onclick="closeModal()">&times;</button>
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
                    <button class="btn btn-close" onclick="closeApp()">
                        <span>🚪</span>
                        <span>Close App</span>
                    </button>
                    <button class="btn btn-continue" onclick="continueSingleDisplay()">
                        <span>▶️</span>
                        <span>Continue with Single Display</span>
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
    
    // Clean up listeners when modal is closed
    modalWindow.on('closed', () => {
        ipcMain.removeAllListeners('modal-closed');
        ipcMain.removeAllListeners('close-app');
        ipcMain.removeAllListeners('continue-single-display');
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
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, 'public', 'icon.ico'),
    });

    // Load the same timer display system as single screen
    const indexPath = path.join(__dirname, 'public', 'index.html');
    timerWindow.loadFile(indexPath).then(() => {
        // Navigate to timer route after loading (using hash routing)
        timerWindow.webContents.executeJavaScript(`
            window.location.hash = '#/timer';
        `);
    });
    
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

    secondWindow = new BrowserWindow({
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
        },
        icon: path.join(__dirname, 'public', 'icon.ico'),
    });

    // Load the timer route
    const indexPath = path.join(__dirname, 'public', 'index.html');
    secondWindow.loadFile(indexPath).then(() => {
        // Navigate to timer route after loading (using hash routing)
        secondWindow.webContents.executeJavaScript(`
            window.location.hash = '#/timer';
        `);
    });

    secondWindow.on('closed', () => {
        secondWindow = null;
    });
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
                    label: 'Close All Timer Displays',
                    accelerator: 'CmdOrCtrl+W',
                    click: () => {
                        // Close single timer window
                        if (secondWindow) {
                            secondWindow.close();
                        }
                        // Close all multiple timer windows
                        timerWindows.forEach((window) => {
                            if (window && !window.isDestroyed()) {
                                window.close();
                            }
                        });
                        timerWindows.clear();
                    }
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
