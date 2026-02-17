import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import path from 'path';
import fs from 'fs';

const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

let mainWindow: BrowserWindow | null = null;

function getBuildNumber(): string {
  try {
    const buildNumberPath = path.join(__dirname, '../.build-number');
    if (fs.existsSync(buildNumberPath)) {
      return fs.readFileSync(buildNumberPath, 'utf8').trim() || '1';
    }
  } catch (error) {
    console.error('Error reading build number:', error);
  }
  return '1';
}

interface ThemesDirectoryResult {
  found: boolean;
  path: string | null;
  edition: string | null;
}

function detectAbletonThemesDirectory(): ThemesDirectoryResult {
  const editions = ['Suite', 'Standard', 'Intro', 'Lite'];

  for (const edition of editions) {
    let themesPath: string;

    if (process.platform === 'darwin') {
      themesPath = `/Applications/Ableton Live 12 ${edition}.app/Contents/App-Resources/Themes`;
    } else if (process.platform === 'win32') {
      themesPath = path.join(
        process.env.PROGRAMDATA || 'C:\\ProgramData',
        'Ableton',
        `Live 12 ${edition}`,
        'Resources',
        'Themes'
      );
    } else {
      return { found: false, path: null, edition: null };
    }

    if (fs.existsSync(themesPath)) {
      return { found: true, path: themesPath, edition };
    }
  }

  return { found: false, path: null, edition: null };
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  const buildNumber = getBuildNumber();

  // Set up IPC handlers
  ipcMain.handle('get-version', () => app.getVersion());
  ipcMain.handle('get-build-number', () => buildNumber);

  ipcMain.handle('detect-themes-directory', () => {
    return detectAbletonThemesDirectory();
  });

  ipcMain.handle('open-path-in-explorer', async (_event, dirPath: string) => {
    const errorMessage = await shell.openPath(dirPath);
    return { success: errorMessage === '', error: errorMessage || null };
  });

  ipcMain.handle('read-image-as-data-url', async (_event, filePath: string) => {
    try {
      const data = fs.readFileSync(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
      return `data:${mimeType};base64,${data.toString('base64')}`;
    } catch (error) {
      console.error('Error reading image:', error);
      return null;
    }
  });

  ipcMain.handle('open-file-dialog', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'Images', extensions: ['png', 'jpg', 'jpeg'] },
      ],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    const filePath = result.filePaths[0];
    const fileName = path.basename(filePath);
    return { filePath, fileName };
  });

  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
