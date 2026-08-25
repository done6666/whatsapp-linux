const { contextBridge, ipcRenderer, webFrame } = require('electron');

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

contextBridge.exposeInMainWorld('whatsappLinux', {
  platform: process.platform,
  hideToTray: () => ipcRenderer.send('window:hide'),
  requestShow: () => ipcRenderer.send('window:show')
});

try {
  webFrame.executeJavaScript(PAGE_PATCH).catch(() => {});
} catch {}
