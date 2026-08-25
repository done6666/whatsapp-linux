const path = require('node:path');
const { Menu, nativeImage, Tray } = require('electron');

function loadIcon(name) {
  return nativeImage.createFromPath(path.join(__dirname, '..', 'assets', name)).resize({ width: 24, height: 24 });
}

function createTray({ getWindow, onShow, onHide, onQuit, getAutostart, setAutostart }) {
  const normalIcon = loadIcon('tray.png');
  const unreadIcon = loadIcon('tray-unread.png');
  if (normalIcon.isEmpty()) return null;

  let tray;
  try {
    tray = new Tray(normalIcon);
  } catch {
    return null;
  }

  const buildMenu = () =>
    Menu.buildFromTemplate([
      { label: 'Show', click: onShow },
      { type: 'separator' },
      { label: 'Hide', click: onHide },
      { type: 'separator' },
      {
        label: 'Launch at Login',
        type: 'checkbox',
        checked: getAutostart(),
        click: (item) => setAutostart(item.checked)
      },
      { type: 'separator' },
      { label: 'Quit', click: onQuit }
    ]);

  tray.setToolTip('WhatsApp Linux');
  tray.setContextMenu(buildMenu());
  tray.setUnread = (count) => tray.setImage(count > 0 ? unreadIcon : normalIcon);
  tray.refreshMenu = () => tray.setContextMenu(buildMenu());
  tray.on('click', () => {
    const win = getWindow();
    if (win && win.isVisible()) onHide();
    else onShow();
  });

  return tray;
}

module.exports = { createTray };
