const { app, BrowserWindow, screen, dialog, nativeTheme, Menu, shell } = require('electron');
const path = require('path');
const { readFileSync } = require('fs');
const url = require('url');

let mainWindow;
let secondWindow;

app.on('ready', () => {
    // Set Dark Theme
    nativeTheme.themeSource = 'dark';

    mainWindow = new BrowserWindow({
        width: 1050,
        height: 900,
        minWidth: 1050,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            webSecurity: true,
            cache: false
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
            // No secondary displays, show the no secondary screen alert
            dialog.showMessageBox(mainWindow, {
                type: 'warning',
                buttons: ['Close App', 'Continue with Single Display'],
                defaultId: 1,
                title: 'No Secondary Screen Detected',
                message: 'No secondary screen detected!',
                detail: 'For optimal experience, please connect a secondary screen and restart the application. You can continue with a single display, but the timer display will open on the same screen.',
            }).then((result) => {
                if (result.response === 0) {
                    app.quit();
                } else {
                    openTimerWindow(targetDisplay);
                }
            });
        }
    } else {
        // Show custom alert when no secondary screen is detected
        dialog.showMessageBox(mainWindow, {
            type: 'warning',
            buttons: ['Close App', 'Continue with Single Display'],
            defaultId: 1,
            title: 'No Secondary Screen Detected',
            message: 'No secondary screen detected!',
            detail: 'For optimal experience, please connect a secondary screen and restart the application. You can continue with a single display, but the timer display will open on the same screen.',
        }).then((result) => {
            if (result.response === 0) {
                // Close app
                app.quit();
            } else {
                // Continue with single display
                openTimerWindow(targetDisplay);
            }
        });
    }
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
                    label: 'Close Timer Display',
                    accelerator: 'CmdOrCtrl+W',
                    click: () => {
                        if (secondWindow) {
                            secondWindow.close();
                        }
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
                            message: 'Stage Timer App v1.0.0',
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