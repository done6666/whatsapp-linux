const { app, BrowserWindow, Menu, Notification, ipcMain, session, shell } = require('electron');
const { execFile } = require('node:child_process');
const path = require('node:path');
const { createTray } = require('./tray');
const windowState = require('./window-state');

const WHATSAPP_URL = 'https://web.whatsapp.com';
const PERMISSION_WHITELIST = new Set(['media', 'notifications', 'fullscreen', 'pointerLock']);

let mainWindow = null;
let tray = null;
let trayHintShown = false;

if (!app.requestSingleInstanceLock()) {
  app.quit();
}

const uaPlatform = process.arch === 'arm64' ? 'Linux aarch64' : 'Linux x86_64';
app.userAgentFallback = `Mozilla/5.0 (X11; ${uaPlatform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${process.versions.chrome} Safari/537.36`;

if (process.env.WAYLAND_DISPLAY) {
  app.commandLine.appendSwitch('ozone-platform-hint', 'auto');
}

function showMainWindow() {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}

function updateUnread(count) {
  if (tray) {
    tray.setToolTip(count > 0 ? `WhatsApp Linux (${count} unread)` : 'WhatsApp Linux');
    if (tray.setUnread) tray.setUnread(count);
  }
  app.setBadgeCount(count);
}

function getAutostart() {
  return app.getLoginItemSettings().openAtLogin;
}

function setAutostart(enabled) {
  app.setLoginItemSettings({
    openAtLogin: enabled,
    args: app.isPackaged ? ['--hidden'] : ['.', '--hidden']
  });
  buildMenu();
  if (tray && tray.refreshMenu) tray.refreshMenu();
}

function hasStatusNotifierWatcher() {
  return new Promise((resolve) => {
    execFile(
      'gdbus',
      [
        'call',
        '--session',
        '--dest',
        'org.freedesktop.DBus',
        '--object-path',
        '/org/freedesktop/DBus',
        '--method',
        'org.freedesktop.DBus.NameHasOwner',
        'org.kde.StatusNotifierWatcher'
      ],
      { timeout: 2000 },
      (error, stdout) => {
        if (error) return resolve(true);
        resolve(stdout.trim() === '(true,)');
      }
    );
  });
}

const PAGE_PATCH = `
(() => {
  if (window.__whatsappLinuxPatched) return;
  window.__whatsappLinuxPatched = true;
  const requestShow = () => {
    if (!document.hasFocus() && window.whatsappLinux) window.whatsappLinux.requestShow();
  };
  window.focus = () => { requestShow(); };
  const OriginalNotification = window.Notification;
  if (!OriginalNotification) return;
  const activeNotifications = new Set();
  const dismissNotifications = () => {
    activeNotifications.forEach((notification) => {
      try {
        notification.close();
      } catch {}
    });
  };
  window.addEventListener('focus', dismissNotifications);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) dismissNotifications();
  });
  function PatchedNotification(title, options) {
    const notification = new OriginalNotification(title, options);
    activeNotifications.add(notification);
    notification.addEventListener('close', () => activeNotifications.delete(notification));
    notification.addEventListener('error', () => activeNotifications.delete(notification));
    notification.addEventListener('click', requestShow);
    return notification;
  }
  PatchedNotification.prototype = OriginalNotification.prototype;
  Object.defineProperty(PatchedNotification, 'permission', {
    get: () => OriginalNotification.permission
  });
  PatchedNotification.requestPermission = (callback) => OriginalNotification.requestPermission(callback);
  window.Notification = PatchedNotification;
})();
`;

function createWindow() {
  const state = windowState.load();
  mainWindow = new BrowserWindow({
    x: state.x,
    y: state.y,
    width: state.width,
    height: state.height,
    minWidth: 480,
    minHeight: 600,
    title: 'WhatsApp Linux',
    icon: path.join(__dirname, '..', 'assets', 'icon.png'),
    autoHideMenuBar: true,
    show: false,
    backgroundColor: '#111b21',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      autoplayPolicy: 'no-user-gesture-required'
    }
  });

  if (state.maximized) {
    mainWindow.maximize();
  }

  const startHidden = process.argv.includes('--hidden');
  mainWindow.once('ready-to-show', () => {
    if (!startHidden) mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith(WHATSAPP_URL)) {
      return { action: 'allow', overrideBrowserWindowOptions: { autoHideMenuBar: true } };
    }
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(WHATSAPP_URL)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.on('page-title-updated', (event, title) => {
    const match = /^\((\d+)\)/.exec(title);
    updateUnread(match ? Number(match[1]) : 0);
  });

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.setZoomLevel(windowState.loadZoom());
    mainWindow.webContents.executeJavaScript(PAGE_PATCH).catch(() => {});
  });

  mainWindow.on('close', (event) => {
    windowState.save(mainWindow);
    windowState.saveZoom(mainWindow.webContents.getZoomLevel());
    if (!app.isQuitting && tray) {
      event.preventDefault();
      mainWindow.hide();
      if (!trayHintShown) {
        trayHintShown = true;
        if (Notification.isSupported()) {
          new Notification({
            title: 'WhatsApp Linux',
            body: 'The app keeps running in the background. To quit completely, use Quit from the tray icon menu.',
            icon: path.join(__dirname, '..', 'assets', 'icon.png'),
            silent: true
          }).show();
        }
      }
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.loadURL(WHATSAPP_URL);
}

function buildMenu() {
  const template = [
    {
      label: 'Dosya',
      submenu: [
        {
          label: 'Minimize to Tray',
          click: () => {
            if (mainWindow) mainWindow.hide();
          }
        },
        { type: 'separator' },
        {
          label: 'Launch at Login',
          type: 'checkbox',
          checked: getAutostart(),
          click: (item) => setAutostart(item.checked)
        },
        { type: 'separator' },
        { role: 'quit', label: 'Quit' }
      ]
    },
    { role: 'editMenu' },
    { role: 'viewMenu' },
    { role: 'windowMenu' }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.on('second-instance', showMainWindow);

app.whenReady().then(async () => {
  session.defaultSession.setPermissionRequestHandler((wc, permission, callback) => {
    callback(PERMISSION_WHITELIST.has(permission));
  });

  buildMenu();
  createWindow();
  if (await hasStatusNotifierWatcher()) {
    tray = createTray({
      getWindow: () => mainWindow,
      onShow: showMainWindow,
      onHide: () => {
        if (mainWindow) mainWindow.hide();
      },
      onQuit: () => app.quit(),
      getAutostart,
      setAutostart
    });
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
    else showMainWindow();
  });
});

app.on('before-quit', () => {
  app.isQuitting = true;
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.on('window:hide', () => {
  if (mainWindow) mainWindow.hide();
});

ipcMain.on('window:show', () => {
  showMainWindow();
});
