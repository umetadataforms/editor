import { app, BrowserWindow, dialog, ipcMain, Menu } from 'electron';
import { fileURLToPath } from 'url';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { spawn } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let win: BrowserWindow | null = null;

function getResourceBases() {
  const appPath = app.getAppPath();
  const bases = [appPath];

  if (app.isPackaged) {
    const unpackedFromAppPath = appPath.replace(/app\.asar$/, 'app.asar.unpacked');
    if (unpackedFromAppPath !== appPath) {
      bases.unshift(unpackedFromAppPath);
    } else {
      bases.unshift(path.join(process.resourcesPath, 'app.asar.unpacked'));
    }
  }

  return bases;
}

function resolveResourcePath(relativePath: string) {
  for (const base of getResourceBases()) {
    const candidate = path.join(base, relativePath);
    if (fs.existsSync(candidate)) return candidate;
  }

  return null;
}

function createWindow() {
  const preloadPath = path.join(app.getAppPath(), 'electron', 'preload.cjs');

  win = new BrowserWindow({
    width: 1280,
    height: 800,
    show: true,
    backgroundColor: '#121212',
    webPreferences: {
      contextIsolation: true,
      preload: preloadPath,
      spellcheck: true,
    },
  });

  win.webContents.session.setSpellCheckerLanguages(['en-US']);

  win.webContents.on('context-menu', (_event, params) => {
    const template: Electron.MenuItemConstructorOptions[] = [];

    if (params.dictionarySuggestions?.length) {
      template.push(
        ...params.dictionarySuggestions.map((suggestion) => ({
          label: suggestion,
          click: () => win?.webContents.replaceMisspelling(suggestion),
        }))
      );
    }

    if (params.misspelledWord) {
      if (template.length) template.push({ type: 'separator' });
      template.push({
        label: 'Add to dictionary',
        click: () => win?.webContents.session.addWordToSpellCheckerDictionary(params.misspelledWord),
      });
    }

    const hasSelection = Boolean(params.selectionText);
    const hasEditable = params.isEditable;

    if (template.length) template.push({ type: 'separator' });

    if (hasEditable) {
      template.push(
        { role: 'undo', enabled: params.editFlags.canUndo },
        { role: 'redo', enabled: params.editFlags.canRedo },
        { type: 'separator' },
        { role: 'cut', enabled: params.editFlags.canCut },
        { role: 'copy', enabled: params.editFlags.canCopy },
        { role: 'paste', enabled: params.editFlags.canPaste },
        { role: 'selectAll' }
      );
    } else if (hasSelection) {
      template.push(
        { role: 'copy', enabled: params.editFlags.canCopy }
      );
    }

    if (template.length === 0) return;
    Menu.buildFromTemplate(template).popup({ window: win ?? undefined });
  });

  if (process.env.ELECTRON_START_URL) {
    win.loadURL(process.env.ELECTRON_START_URL);
  } else {
    const indexHtml = path.join(__dirname, '..', 'dist', 'index.html');
    win.loadFile(indexHtml);
  }
}

type TabularFormat = 'v0.0.2' | 'vc';

const TABULAR_SCHEMA_URI =
  'https://github.com/umetadataforms/schemas/raw/main/modular/tabular-data-metadata/v0.0.2.json';
const TABULAR_SCHEMA_VC_KEY = 'tabular-data-metadata-schema.json';
const TABULAR_GENERATORS: Record<TabularFormat, string> = {
  'v0.0.2': 'python/scripts/metadata_from_tabular_v0.0.2.py',
  vc: 'python/scripts/metadata_from_tabular_vc.py',
};

const TABULAR_FILE_EXTENSIONS = new Set(['.csv', '.tsv']);

function resolvePythonBin() {
  const envCandidate = process.env.UMFE_PYTHON_BIN;
  if (envCandidate && fs.existsSync(envCandidate)) return envCandidate;

  const candidates = [
    'python/.venv/bin/python',
    'python/venv/bin/python',
    'python/runtime/bin/python3',
    'python/runtime/bin/python',
  ];

  for (const candidate of candidates) {
    const resolved = resolveResourcePath(candidate);
    if (resolved) return resolved;
  }

  throw new Error('python-runtime-not-found');
}

function runPythonGenerator(filePath: string, format: TabularFormat) {
  const pythonBin = resolvePythonBin();
  const scriptPath = resolveResourcePath(TABULAR_GENERATORS[format]);

  if (!scriptPath) {
    throw new Error('python-generator-not-found');
  }

  return new Promise<Record<string, unknown>>((resolve, reject) => {
    const child = spawn(
      pythonBin,
      [scriptPath, '--input', filePath],
      {
        env: {
          ...process.env,
          PYTHONUNBUFFERED: '1',
        },
      }
    );

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      reject(error);
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || `python-exit-${code ?? 'unknown'}`));
        return;
      }

      try {
        const data = JSON.parse(stdout) as Record<string, unknown>;
        resolve(data);
      } catch (error) {
        reject(error);
      }
    });
  });
}

async function generateTabularMetadata(filePath: string, format: TabularFormat) {
  const ext = path.extname(filePath).toLowerCase();
  if (!TABULAR_FILE_EXTENSIONS.has(ext)) {
    throw new Error('unsupported-tabular-format');
  }

  const data = await runPythonGenerator(filePath, format);
  const basename = path.basename(filePath, ext);
  const fileName = `${basename}.metadata.json`;

  if (format === 'v0.0.2') {
    if (!('schema' in data)) {
      data.schema = TABULAR_SCHEMA_URI;
    }
  }

  if (format === 'vc') {
    if (!('$schema' in data)) {
      data.$schema = TABULAR_SCHEMA_VC_KEY;
    }
  }

  return {
    data,
    fileName,
    sourcePath: filePath,
  };
}

app
  .whenReady()
  .then(() => {
    createWindow();

    ipcMain.handle('umfe:select-tabular-file', async () => {
      const browserWindow = BrowserWindow.getFocusedWindow() ?? win;
      if (!browserWindow) return { canceled: true };

      const result = await dialog.showOpenDialog(browserWindow, {
        properties: ['openFile'],
        filters: [
          { name: 'Tabular data', extensions: ['csv', 'tsv'] },
        ],
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { canceled: true };
      }

      return { canceled: false, filePath: result.filePaths[0] };
    });

    ipcMain.handle('umfe:generate-tabular', async (_event, payload) => {
      const filePath = payload?.filePath;
      const format = payload?.format as TabularFormat | undefined;
      if (typeof filePath !== 'string' || filePath.trim() === '') {
        throw new Error('missing-file-path');
      }

      if (format && format !== 'v0.0.2' && format !== 'vc') {
        throw new Error('unsupported-tabular-schema');
      }

      return generateTabularMetadata(filePath, format ?? 'v0.0.2');
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  })
  .catch(console.log);

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
