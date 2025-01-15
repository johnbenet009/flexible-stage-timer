const { app, BrowserWindow, screen, dialog, nativeTheme, Menu, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let secondWindow;
let serverProcess;

app.on('ready', () => {
    // Set Dark Theme
    nativeTheme.themeSource = 'dark';

    mainWindow = new BrowserWindow({
        width: 1050,
        height: 900,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
        icon: path.join(__dirname, 'public', 'icon.ico'), // Set app icon
        maximizable: false,
        resizable: false
    });

    mainWindow.loadURL('http://localhost:1000/');

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

    // Shutdown server on main window close
    mainWindow.on('closed', () => {
        if (serverProcess) {
            serverProcess.kill('SIGINT'); // Or 'SIGTERM' for a gentler shutdown
        }
        app.quit(); // Close all when the main window is closed
    });

    // Setup custom menu
    setupMenu();

    createSecondWindow();
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
        width: 900,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
        icon: path.join(__dirname, 'public', 'icon.ico'), // Set app icon
        maximizable: false,
        resizable: false
    });
    mainWindow.loadURL('http://localhost:1000/');
}

function createSecondWindow() {
    const displays = screen.getAllDisplays();
    let externalDisplay = displays.find((display) => display.bounds.x !== 0 || display.bounds.y !== 0);

    if (!externalDisplay) {
        dialog.showMessageBox({
            type: 'warning',
            title: 'No Secondary Screen Detected',
            message: 'A secondary screen was not detected. The second window will be displayed on the primary screen. Connect a secondary screen and restart the app.',
        });
        secondWindow = new BrowserWindow({
            width: 700,
            height: 500,
            x: mainWindow.getBounds().x + 50,
            y: mainWindow.getBounds().y + 50,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
            },
        });
        secondWindow.loadURL('http://localhost:1000/timer'); // Corrected: load /timer on second screen
    } else {
        secondWindow = new BrowserWindow({
            x: externalDisplay.bounds.x,
            y: externalDisplay.bounds.y,
            fullscreen: true,
            show: false,
            frame: false,
            skipTaskbar: true, // Prevent taskbar icon on secondary
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
            },
        });
        secondWindow.loadURL('http://localhost:1000/timer'); // Corrected: load /timer on second screen

        secondWindow.once('ready-to-show', () => {
            secondWindow.show();
        });
    }
    if (secondWindow) {
        secondWindow.on('closed', () => {
            secondWindow = null;
        });
    }
}

function setupMenu() {
    const template = [
        {
            label: 'Help',
            submenu: [
                {
                    label: 'Help',
                    click: () => {
                        shell.openExternal('https://github.com/johnbenet009/flexible-stage-timer/blob/main/help.md');
                    },
                },
                {
                    label: 'About',
                    click: () => {
                        shell.openExternal('https://github.com/johnbenet009/flexible-stage-timer/blob/main/about.md');
                    },
                },
            ],
        },
    ];
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}