# Contributing to WhatsApp Linux

Thanks for your interest in improving the project!

## Development setup

Requirements: Node.js 24+ and npm.

```bash
git clone https://github.com/done6666/whatsapp-linux.git
cd whatsapp-linux
npm ci
npm start
```

If Electron crashes at startup with a sandbox error, fix the sandbox helper permissions once:

```bash
sudo chown root:root node_modules/electron/dist/chrome-sandbox
sudo chmod 4755 node_modules/electron/dist/chrome-sandbox
```

## Project structure

```
src/main.js          main process: window, permissions, tray wiring, autostart
src/preload.js       sandboxed bridge exposed to the page
src/tray.js          tray icon, menu, unread badge
src/window-state.js  window bounds and zoom level persistence
assets/              tray and app icons
build/               packaging icon
```

## Guidelines

- Keep the main process free of UI logic that belongs to the page, and never enable
  `nodeIntegration` or disable `contextIsolation`.
- Any change to the permission whitelist in `src/main.js` must be justified in the pull request.
- Test on both X11 and Wayland when touching window or tray behavior.
- Keep UI strings in English.

## Pull requests

1. Fork the repo and create a feature branch.
2. Make your change and verify with `node --check src/*.js` and `npm start`.
3. Open a pull request describing what changed and why.

## Reporting bugs

Please use the bug report issue template and include your distribution, desktop environment,
display protocol (X11/Wayland) and installation method.
