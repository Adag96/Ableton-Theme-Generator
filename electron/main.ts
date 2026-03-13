import { app, BrowserWindow, dialog, ipcMain, shell, screen } from 'electron';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { execSync } from 'child_process';

const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

let mainWindow: BrowserWindow | null = null;

// User preferences persistence
const preferencesPath = path.join(app.getPath('userData'), 'preferences.json');

interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Preferences {
  lastImageDir?: string;
  windowBounds?: WindowBounds;
}

function loadPreferences(): Preferences {
  try {
    if (fs.existsSync(preferencesPath)) {
      return JSON.parse(fs.readFileSync(preferencesPath, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading preferences:', error);
  }
  return {};
}

function savePreferences(prefs: Preferences) {
  try {
    fs.writeFileSync(preferencesPath, JSON.stringify(prefs, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving preferences:', error);
  }
}

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

function getOsVersion(): string {
  try {
    if (process.platform === 'darwin') {
      // Get macOS marketing version (e.g., "15.7.2") instead of Darwin kernel version
      return execSync('sw_vers -productVersion', { encoding: 'utf8' }).trim();
    } else if (process.platform === 'win32') {
      // Windows: os.release() returns the actual version (e.g., "10.0.19045")
      return os.release();
    }
  } catch (error) {
    console.error('Error getting OS version:', error);
  }
  return os.release();
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
  const isMac = process.platform === 'darwin';
  const isWin = process.platform === 'win32';

  // Load saved window bounds or use defaults
  const prefs = loadPreferences();
  const defaultBounds = { width: 1200, height: 800 };
  let bounds = prefs.windowBounds || defaultBounds;

  // Validate bounds are within current display area
  const displays = screen.getAllDisplays();
  const isOnScreen = displays.some(display => {
    const { x, y, width, height } = display.bounds;
    return bounds.x !== undefined &&
           bounds.y !== undefined &&
           bounds.x >= x - 100 &&
           bounds.x < x + width &&
           bounds.y >= y - 100 &&
           bounds.y < y + height;
  });

  // If saved position is off-screen, center on primary display
  if (!isOnScreen || bounds.x === undefined || bounds.y === undefined) {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
    bounds = {
      width: bounds.width || defaultBounds.width,
      height: bounds.height || defaultBounds.height,
      x: Math.round((screenWidth - (bounds.width || defaultBounds.width)) / 2),
      y: Math.round((screenHeight - (bounds.height || defaultBounds.height)) / 2),
    };
  }

  mainWindow = new BrowserWindow({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    minWidth: 1000,
    minHeight: 667,  // 1000 / 1.5 = 667 (3:2 ratio)
    maxWidth: 1600,
    maxHeight: 1067, // 1600 / 1.5 = 1067 (3:2 ratio)
    frame: false,
    transparent: isMac, // Only on macOS for proper vibrancy
    backgroundColor: isWin ? '#f0f0f5' : undefined, // Fallback for Windows
    vibrancy: isMac ? 'under-window' : undefined, // macOS frosted effect
    visualEffectState: isMac ? 'active' : undefined,
    titleBarStyle: 'hidden',
    trafficLightPosition: isMac ? { x: 16, y: 18 } : undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Lock to 3:2 aspect ratio
  mainWindow.setAspectRatio(1.5);

  // Debounced save on resize/move
  let saveTimeout: NodeJS.Timeout | null = null;
  const saveWindowBounds = () => {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      if (mainWindow && !mainWindow.isMaximized()) {
        const currentBounds = mainWindow.getBounds();
        const currentPrefs = loadPreferences();
        currentPrefs.windowBounds = currentBounds;
        savePreferences(currentPrefs);
      }
    }, 500);
  };

  mainWindow.on('resize', saveWindowBounds);
  mainWindow.on('moved', saveWindowBounds);

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
  ipcMain.handle('get-platform', () => process.platform);
  ipcMain.handle('get-system-info', () => ({
    platform: process.platform,
    osVersion: getOsVersion(),
    arch: os.arch(),
  }));

  // Window control handlers
  ipcMain.handle('window-minimize', () => {
    mainWindow?.minimize();
  });

  ipcMain.handle('window-maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });

  ipcMain.handle('window-close', () => {
    mainWindow?.close();
  });

  ipcMain.handle('window-is-maximized', () => {
    return mainWindow?.isMaximized() ?? false;
  });

  ipcMain.handle('detect-themes-directory', () => {
    return detectAbletonThemesDirectory();
  });

  const APP_SIGNATURE = 'Generated by Ableton Theme Generator';

  ipcMain.handle('list-theme-files', async (_event, dirPath: string) => {
    try {
      if (!fs.existsSync(dirPath)) {
        return [];
      }
      const files = fs.readdirSync(dirPath);
      const themeFiles = files
        .filter(file => file.toLowerCase().endsWith('.ask'))
        .map(file => {
          const filePath = path.join(dirPath, file);
          let createdByApp = false;
          try {
            // Read first 200 bytes to check for signature
            const fd = fs.openSync(filePath, 'r');
            const buffer = Buffer.alloc(200);
            fs.readSync(fd, buffer, 0, 200, 0);
            fs.closeSync(fd);
            createdByApp = buffer.toString('utf8').includes(APP_SIGNATURE);
          } catch {
            // If we can't read the file, assume it's not ours
          }
          return { name: file, createdByApp };
        })
        .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
      return themeFiles;
    } catch (error) {
      console.error('Error listing theme files:', error);
      return [];
    }
  });

  ipcMain.handle('delete-theme-file', async (_event, filePath: string) => {
    try {
      // Safety check: only delete .ask files within the themes directory
      const themesDir = detectAbletonThemesDirectory();
      if (!themesDir.found || !themesDir.path) {
        return { success: false, error: 'Themes directory not found' };
      }
      const normalizedPath = path.normalize(filePath);
      const normalizedThemesDir = path.normalize(themesDir.path);
      if (!normalizedPath.startsWith(normalizedThemesDir) || !normalizedPath.endsWith('.ask')) {
        return { success: false, error: 'Invalid file path' };
      }

      // Verify it's a file we created
      const buffer = Buffer.alloc(200);
      const fd = fs.openSync(filePath, 'r');
      fs.readSync(fd, buffer, 0, 200, 0);
      fs.closeSync(fd);
      if (!buffer.toString('utf8').includes(APP_SIGNATURE)) {
        return { success: false, error: 'Cannot delete themes not created by this app' };
      }

      fs.unlinkSync(filePath);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  });

  ipcMain.handle('open-path-in-explorer', async (_event, dirPath: string) => {
    const errorMessage = await shell.openPath(dirPath);
    return { success: errorMessage === '', error: errorMessage || null };
  });

  ipcMain.handle('open-external', async (_event, url: string) => {
    await shell.openExternal(url);
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
    const prefs = loadPreferences();
    const defaultPath = prefs.lastImageDir || app.getPath('pictures');

    const result = await dialog.showOpenDialog({
      defaultPath,
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

    // Remember this directory for next time
    savePreferences({ ...prefs, lastImageDir: path.dirname(filePath) });

    return { filePath, fileName };
  });

  ipcMain.handle('save-theme-file', async (_event, xmlContent: string, defaultFileName: string) => {
    // Detect Ableton themes directory for default save location
    const themesDir = detectAbletonThemesDirectory();

    const result = await dialog.showSaveDialog({
      title: 'Save Ableton Theme',
      defaultPath: themesDir.found && themesDir.path
        ? path.join(themesDir.path, defaultFileName)
        : defaultFileName,
      filters: [
        { name: 'Ableton Theme', extensions: ['ask'] },
      ],
    });

    if (result.canceled || !result.filePath) {
      return { success: false, filePath: null, error: null };
    }

    try {
      fs.writeFileSync(result.filePath, xmlContent, 'utf8');
      return { success: true, filePath: result.filePath, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, filePath: null, error: errorMessage };
    }
  });

  // Theme library persistence
  const themeLibraryPath = path.join(app.getPath('userData'), 'theme-library.json');

  ipcMain.handle('load-theme-library', async () => {
    const defaultLibrary = { version: 1, themes: [] };

    try {
      if (fs.existsSync(themeLibraryPath)) {
        const data = fs.readFileSync(themeLibraryPath, 'utf8');
        const parsed = JSON.parse(data);

        // Validate structure
        if (parsed && typeof parsed === 'object' && Array.isArray(parsed.themes)) {
          return parsed;
        }

        // Invalid structure - backup and reset
        console.error('Theme library has invalid structure, resetting...');
        const backupPath = themeLibraryPath.replace('.json', `-backup-${Date.now()}.json`);
        fs.renameSync(themeLibraryPath, backupPath);
        console.log(`Backed up corrupted file to: ${backupPath}`);
      }
    } catch (error) {
      console.error('Error loading theme library:', error);

      // JSON parse failed - file is corrupted, backup and reset
      if (fs.existsSync(themeLibraryPath)) {
        try {
          const backupPath = themeLibraryPath.replace('.json', `-backup-${Date.now()}.json`);
          fs.renameSync(themeLibraryPath, backupPath);
          console.log(`Backed up corrupted file to: ${backupPath}`);
        } catch (backupError) {
          console.error('Failed to backup corrupted file:', backupError);
        }
      }
    }

    return defaultLibrary;
  });

  ipcMain.handle('save-theme-library', async (_event, library: unknown) => {
    try {
      const jsonString = JSON.stringify(library, null, 2);

      // Write to temp file first, then rename (atomic write to prevent corruption)
      const tempPath = themeLibraryPath + '.tmp';
      fs.writeFileSync(tempPath, jsonString, 'utf8');
      fs.renameSync(tempPath, themeLibraryPath);

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error saving theme library:', error);
      return { success: false, error: errorMessage };
    }
  });

  // Copy theme file to Downloads folder
  ipcMain.handle('copy-theme-to-downloads', async (_event, sourcePath: string, fileName: string) => {
    try {
      if (!fs.existsSync(sourcePath)) {
        return { success: false, error: 'Source file not found' };
      }
      const downloadsPath = app.getPath('downloads');
      let destPath = path.join(downloadsPath, fileName);

      // Handle name collision by appending number
      let counter = 1;
      const ext = path.extname(fileName);
      const baseName = path.basename(fileName, ext);
      while (fs.existsSync(destPath)) {
        destPath = path.join(downloadsPath, `${baseName} (${counter})${ext}`);
        counter++;
      }

      fs.copyFileSync(sourcePath, destPath);
      return { success: true, destPath };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  });

  // Rename theme file
  ipcMain.handle('rename-theme-file', async (_event, oldPath: string, newPath: string) => {
    try {
      if (!fs.existsSync(oldPath)) {
        return { success: false, error: 'File not found' };
      }
      if (fs.existsSync(newPath)) {
        return { success: false, error: 'A theme with that name already exists' };
      }
      fs.renameSync(oldPath, newPath);
      return { success: true, newPath };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  });

  // Check if a file exists
  ipcMain.handle('check-file-exists', async (_event, filePath: string) => {
    return fs.existsSync(filePath);
  });

  // Write theme file directly (for install/regenerate)
  ipcMain.handle('write-theme-file', async (_event, filePath: string, xmlContent: string) => {
    try {
      // Safety check: only write .ask files within the themes directory
      const themesDir = detectAbletonThemesDirectory();
      if (!themesDir.found || !themesDir.path) {
        return { success: false, error: 'Themes directory not found' };
      }
      const normalizedPath = path.normalize(filePath);
      const normalizedThemesDir = path.normalize(themesDir.path);
      if (!normalizedPath.startsWith(normalizedThemesDir) || !normalizedPath.endsWith('.ask')) {
        return { success: false, error: 'Invalid file path' };
      }

      fs.writeFileSync(filePath, xmlContent, 'utf8');
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  });

  // Update theme file with delete+recreate pattern (for better file change detection by Ableton)
  ipcMain.handle('update-theme-file', async (_event, filePath: string, xmlContent: string) => {
    try {
      // Safety check: only update .ask files within the themes directory
      const themesDir = detectAbletonThemesDirectory();
      if (!themesDir.found || !themesDir.path) {
        return { success: false, error: 'Themes directory not found' };
      }
      const normalizedPath = path.normalize(filePath);
      const normalizedThemesDir = path.normalize(themesDir.path);
      if (!normalizedPath.startsWith(normalizedThemesDir) || !normalizedPath.endsWith('.ask')) {
        return { success: false, error: 'Invalid file path' };
      }

      // Verify file exists before attempting update
      if (!fs.existsSync(filePath)) {
        return { success: false, error: 'Theme file not found' };
      }

      // Delete existing file first, then write new content
      // This ensures Ableton detects the file change
      fs.unlinkSync(filePath);
      fs.writeFileSync(filePath, xmlContent, 'utf8');

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  });

  // Read .ask file content as UTF-8 text (used for uploading to community gallery)
  ipcMain.handle('read-theme-file-as-text', async (_event, filePath: string) => {
    try {
      if (!fs.existsSync(filePath) || !filePath.endsWith('.ask')) {
        return { success: false, error: 'File not found or invalid type' };
      }
      const content = fs.readFileSync(filePath, 'utf8');
      return { success: true, content };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  });

  // Source image caching for community gallery submissions
  const sourceImagesDir = path.join(app.getPath('userData'), 'source-images');

  // Preview image storage (Ableton screenshots for My Themes view)
  const previewImagesDir = path.join(app.getPath('userData'), 'preview-images');

  // Ensure directories exist
  if (!fs.existsSync(sourceImagesDir)) {
    fs.mkdirSync(sourceImagesDir, { recursive: true });
  }
  if (!fs.existsSync(previewImagesDir)) {
    fs.mkdirSync(previewImagesDir, { recursive: true });
  }

  ipcMain.handle('save-source-image', async (_event, { sourcePath, themeId }: { sourcePath: string; themeId: string }) => {
    try {
      if (!fs.existsSync(sourcePath)) {
        return { success: false, error: 'Source image not found' };
      }
      const ext = path.extname(sourcePath).toLowerCase();
      const destPath = path.join(sourceImagesDir, `${themeId}${ext}`);
      fs.copyFileSync(sourcePath, destPath);
      return { success: true, cachedPath: destPath };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  });

  ipcMain.handle('delete-source-image', async (_event, themeId: string) => {
    try {
      // Check for any extension
      const files = fs.readdirSync(sourceImagesDir);
      const match = files.find(f => f.startsWith(themeId + '.'));
      if (match) {
        fs.unlinkSync(path.join(sourceImagesDir, match));
      }
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  });

  ipcMain.handle('get-source-image-data-url', async (_event, cachedPath: string) => {
    try {
      if (!cachedPath || !fs.existsSync(cachedPath)) {
        return null;
      }
      const data = fs.readFileSync(cachedPath);
      const ext = path.extname(cachedPath).toLowerCase();
      const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
      return `data:${mimeType};base64,${data.toString('base64')}`;
    } catch (error) {
      console.error('Error reading cached source image:', error);
      return null;
    }
  });

  // Preview image storage - saves base64 data URL to file, returns file path
  ipcMain.handle('save-preview-image', async (_event, { dataUrl, themeId }: { dataUrl: string; themeId: string }) => {
    try {
      // Parse data URL: data:image/png;base64,xxxx
      const matches = dataUrl.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/);
      if (!matches) {
        return { success: false, error: 'Invalid data URL format' };
      }
      const ext = matches[1] === 'jpg' ? 'jpeg' : matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');

      const destPath = path.join(previewImagesDir, `${themeId}.${ext}`);
      fs.writeFileSync(destPath, buffer);

      return { success: true, previewPath: destPath };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error saving preview image:', error);
      return { success: false, error: errorMessage };
    }
  });

  // Delete preview image when theme is deleted
  ipcMain.handle('delete-preview-image', async (_event, themeId: string) => {
    try {
      const files = fs.readdirSync(previewImagesDir);
      const match = files.find(f => f.startsWith(themeId + '.'));
      if (match) {
        fs.unlinkSync(path.join(previewImagesDir, match));
      }
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  });

  // Get preview image as data URL for display
  ipcMain.handle('get-preview-image-data-url', async (_event, previewPath: string) => {
    try {
      if (!previewPath || !fs.existsSync(previewPath)) {
        return null;
      }
      const data = fs.readFileSync(previewPath);
      const ext = path.extname(previewPath).toLowerCase();
      const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
      return `data:${mimeType};base64,${data.toString('base64')}`;
    } catch (error) {
      console.error('Error reading preview image:', error);
      return null;
    }
  });

  // Download a community theme from a URL and write it to the Ableton themes directory
  ipcMain.handle('download-community-theme', async (_event, { url, name }: { url: string; name: string }) => {
    try {
      const themesDir = detectAbletonThemesDirectory();
      if (!themesDir.found || !themesDir.path) {
        return { success: false, error: 'Ableton themes directory not found. Check Settings.' };
      }

      const response = await fetch(url);
      if (!response.ok) {
        return { success: false, error: `Download failed: ${response.statusText}` };
      }

      const buffer = Buffer.from(await response.arrayBuffer());

      // Sanitize name for use as a filename
      const sanitizedName = name.replace(/[/\\:*?"<>|]/g, '').trim() || 'Community Theme';
      let fileName = `${sanitizedName}.ask`;
      let filePath = path.join(themesDir.path, fileName);

      // Handle name collision
      let counter = 1;
      while (fs.existsSync(filePath)) {
        fileName = `${sanitizedName} (${counter}).ask`;
        filePath = path.join(themesDir.path, fileName);
        counter++;
      }

      fs.writeFileSync(filePath, buffer);
      return { success: true, filePath };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  });

  // Install a review theme (for admin panel)
  ipcMain.handle('install-review-theme', async (_event, { themeName, askFileUrl }: { themeName: string; askFileUrl: string }) => {
    try {
      const themesDir = detectAbletonThemesDirectory();
      if (!themesDir.found || !themesDir.path) {
        return { success: false, error: 'Ableton themes directory not found' };
      }

      // Sanitize theme name for filename
      const sanitizedName = themeName.replace(/[/\\:*?"<>|]/g, '_').trim() || 'Theme';
      const fileName = `REVIEW_${sanitizedName}.ask`;
      const filePath = path.join(themesDir.path, fileName);

      // Download the .ask file content
      const response = await fetch(askFileUrl);
      if (!response.ok) {
        return { success: false, error: `Download failed: ${response.statusText}` };
      }

      const buffer = Buffer.from(await response.arrayBuffer());

      // Write to Ableton Themes directory (overwrite if exists)
      fs.writeFileSync(filePath, buffer);
      return { success: true, filePath };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  });

  // Clean up a review theme file (for admin panel)
  ipcMain.handle('cleanup-review-theme', async (_event, { filePath }: { filePath: string }) => {
    try {
      const themesDir = detectAbletonThemesDirectory();
      if (!themesDir.found || !themesDir.path) {
        return { success: false, error: 'Themes directory not found' };
      }

      // Safety check: only delete REVIEW_*.ask files within the themes directory
      const normalizedPath = path.normalize(filePath);
      const normalizedThemesDir = path.normalize(themesDir.path);
      const fileName = path.basename(filePath);

      if (!normalizedPath.startsWith(normalizedThemesDir) ||
          !normalizedPath.endsWith('.ask') ||
          !fileName.startsWith('REVIEW_')) {
        return { success: false, error: 'Invalid file path for cleanup' };
      }

      if (!fs.existsSync(filePath)) {
        // File already doesn't exist, that's fine
        return { success: true };
      }

      fs.unlinkSync(filePath);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  });

  // Delete theme file from library context (skip signature check for our own themes)
  ipcMain.handle('delete-library-theme-file', async (_event, filePath: string) => {
    try {
      // Safety check: only delete .ask files within the themes directory
      const themesDir = detectAbletonThemesDirectory();
      if (!themesDir.found || !themesDir.path) {
        return { success: false, error: 'Themes directory not found' };
      }
      const normalizedPath = path.normalize(filePath);
      const normalizedThemesDir = path.normalize(themesDir.path);
      if (!normalizedPath.startsWith(normalizedThemesDir) || !normalizedPath.endsWith('.ask')) {
        return { success: false, error: 'Invalid file path' };
      }

      if (!fs.existsSync(filePath)) {
        // File already doesn't exist, that's fine
        return { success: true };
      }

      fs.unlinkSync(filePath);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
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
