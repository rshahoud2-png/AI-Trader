const { app, BrowserWindow, shell } = require('electron');
const fs = require('fs');
const path = require('path');

const isDev = !app.isPackaged;

function log(message) {
  const line = `[${new Date().toISOString()}] ${message}\n`;
  try {
    const logDir = app.getPath('logs');
    fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(path.join(logDir, 'desktop.log'), line);
  } catch {
    // Logging should never prevent the app from opening.
  }
  console.log(line.trim());
}

function errorHtml(title, detail) {
  const escapedTitle = String(title || 'Desktop startup error').replace(/[&<>]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[char]));
  const escapedDetail = String(detail || 'Unknown error').replace(/[&<>]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[char]));
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapedTitle}</title>
    <style>
      :root { color-scheme: dark; font-family: Inter, Segoe UI, Arial, sans-serif; }
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #06080d; color: #e5edf7; }
      main { width: min(820px, calc(100vw - 48px)); border: 1px solid #243044; background: #0d1320; border-radius: 16px; padding: 28px; box-shadow: 0 24px 80px rgba(0,0,0,.35); }
      h1 { margin: 0 0 12px; color: #67e8f9; font-size: 24px; }
      p { color: #a9b6c8; line-height: 1.55; }
      pre { white-space: pre-wrap; overflow-wrap: anywhere; border: 1px solid #243044; border-radius: 12px; padding: 14px; background: #06080d; color: #fca5a5; max-height: 420px; overflow: auto; }
    </style>
  </head>
  <body>
    <main>
      <h1>${escapedTitle}</h1>
      <p>The desktop shell opened, but the React/Vite UI could not load. This diagnostic screen is shown instead of a blank black window.</p>
      <pre>${escapedDetail}</pre>
      <p>Logs are written to the app logs folder as <strong>desktop.log</strong>.</p>
    </main>
  </body>
</html>`;
}

function showError(win, title, detail) {
  log(`${title}: ${detail}`);
  win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(errorHtml(title, detail))}`).catch((error) => {
    log(`Unable to render fallback error screen: ${error.message}`);
  });
}

function verifyRendererMounted(win) {
  setTimeout(() => {
    if (win.isDestroyed()) return;
    win.webContents.executeJavaScript(`(() => {
      const root = document.getElementById('root');
      return {
        href: location.href,
        title: document.title,
        mounted: document.body.dataset.reactMounted === 'true',
        bootError: document.body.dataset.reactBootError || '',
        hasDesktopError: Boolean(document.querySelector('[data-desktop-error]')),
        rootHtml: root ? root.innerHTML.slice(0, 1000) : 'missing #root',
        scripts: Array.from(document.scripts).map((script) => script.src || script.textContent.slice(0, 120))
      };
    })()`).then((state) => {
      log(`Renderer health check: ${JSON.stringify(state)}`);
      if (!state.mounted && !state.hasDesktopError) {
        showError(win, 'React renderer did not mount', JSON.stringify(state, null, 2));
      }
    }).catch((error) => {
      showError(win, 'Renderer health check failed', error.message);
    });
  }, 5000);
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 940,
    minWidth: 1180,
    minHeight: 760,
    backgroundColor: '#06080d',
    title: 'AI Penny Stock Terminal',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.once('ready-to-show', () => win.show());

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  win.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    log(`Renderer console level ${level}: ${message} (${sourceId}:${line})`);
  });

  win.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    showError(win, 'Desktop UI failed to load', `${errorDescription} (${errorCode}) while loading ${validatedURL}`);
  });

  win.webContents.on('did-finish-load', () => {
    verifyRendererMounted(win);
  });

  win.webContents.on('render-process-gone', (_event, details) => {
    showError(win, 'Desktop renderer stopped unexpectedly', JSON.stringify(details, null, 2));
  });

  if (isDev) {
    log('Loading development server at http://localhost:5173');
    win.loadURL('http://localhost:5173').catch((error) => {
      showError(win, 'Development server is unavailable', error.message);
    });
  } else {
    const indexPath = path.join(__dirname, '../dist/index.html');
    log(`Loading packaged renderer from ${indexPath}`);
    if (!fs.existsSync(indexPath)) {
      showError(win, 'Packaged renderer is missing', `Expected file not found: ${indexPath}`);
      return;
    }
    win.loadFile(indexPath).catch((error) => {
      showError(win, 'Packaged renderer failed to open', error.message);
    });
  }
}

app.whenReady().then(() => {
  app.setAppUserModelId('com.lifestyle.ai.pennystockterminal');
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

process.on('uncaughtException', (error) => {
  log(`Uncaught exception: ${error.stack || error.message}`);
});

process.on('unhandledRejection', (reason) => {
  log(`Unhandled rejection: ${reason instanceof Error ? reason.stack || reason.message : String(reason)}`);
});
