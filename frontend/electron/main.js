const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const isDev = !app.isPackaged;

// Set AppUserModelId for Windows notifications
if (process.platform === 'win32') {
  app.setAppUserModelId(isDev ? process.execPath : 'com.ajans.app');
}

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    // Hide the menu bar by default (optional, makes it look more native)
    autoHideMenuBar: true,
    // Icon configuration (windows uses .ico)
    // icon: path.join(__dirname, '../public/favicon.ico'), 
  });

  // Load the app
  const startUrl = isDev
    ? 'http://localhost:3000'
    : 'http://localhost:3000'; // TODO: Change this to production URL or static file path

  mainWindow.loadURL(startUrl);

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
  
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
