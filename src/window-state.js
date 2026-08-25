const fs = require('node:fs');
const path = require('node:path');
const { app, screen } = require('electron');

const DEFAULTS = { width: 1280, height: 900, maximized: false };

function statePath() {
  return path.join(app.getPath('userData'), 'window-state.json');
}

function isVisibleOnAnyDisplay(state) {
  return screen.getAllDisplays().some((display) => {
    const area = display.workArea;
    return (
      state.x < area.x + area.width &&
      state.x + state.width > area.x &&
      state.y < area.y + area.height &&
      state.y + state.height > area.y
    );
  });
}

function load() {
  try {
    const state = JSON.parse(fs.readFileSync(statePath(), 'utf8'));
    const valid =
      Number.isFinite(state.x) &&
      Number.isFinite(state.y) &&
      Number.isFinite(state.width) &&
      Number.isFinite(state.height) &&
      isVisibleOnAnyDisplay(state);
    if (!valid) return { ...DEFAULTS };
    return { ...state, maximized: Boolean(state.maximized) };
  } catch {
    return { ...DEFAULTS };
  }
}

function save(win) {
  try {
    const state = { ...win.getNormalBounds(), maximized: win.isMaximized() };
    fs.mkdirSync(app.getPath('userData'), { recursive: true });
    fs.writeFileSync(statePath(), JSON.stringify(state, null, 2));
  } catch {}
}

function zoomPath() {
  return path.join(app.getPath('userData'), 'zoom-level.json');
}

function loadZoom() {
  try {
    const data = JSON.parse(fs.readFileSync(zoomPath(), 'utf8'));
    return Number.isFinite(data.level) ? data.level : 0;
  } catch {
    return 0;
  }
}

function saveZoom(level) {
  try {
    fs.mkdirSync(app.getPath('userData'), { recursive: true });
    fs.writeFileSync(zoomPath(), JSON.stringify({ level }));
  } catch {}
}

module.exports = { load, save, loadZoom, saveZoom, DEFAULTS };
