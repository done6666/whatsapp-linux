<div align="center">

<img src="assets/icon.png" width="110" alt="WhatsApp Linux logo">

# WhatsApp Linux

**Unofficial WhatsApp Web desktop wrapper for Linux — tray, notifications, autostart.**

[![Release](https://img.shields.io/github/v/release/done6666/whatsapp-linux)](https://github.com/done6666/whatsapp-linux/releases)
[![License: MIT](https://img.shields.io/github/license/done6666/whatsapp-linux)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Linux-blue)](https://github.com/done6666/whatsapp-linux/releases)
[![Release CI](https://github.com/done6666/whatsapp-linux/actions/workflows/release.yml/badge.svg)](https://github.com/done6666/whatsapp-linux/actions/workflows/release.yml)
[![Downloads](https://img.shields.io/github/downloads/done6666/whatsapp-linux/total)](https://github.com/done6666/whatsapp-linux/releases)

</div>

---

WhatsApp Linux puts [WhatsApp Web](https://web.whatsapp.com) in a native desktop window with
the integrations a real messaging app is expected to have: close-to-tray, unread badges,
desktop notifications and autostart. Built with Electron, packaged for x64 and arm64.

<!-- TODO: add a screenshot here
<div align="center">
  <img src="docs/screenshots/main-window.png" width="720" alt="Main window">
</div>
-->

## Features

- Real WhatsApp Web in a native window (Electron, Chromium engine)
- **Close to tray** — keep receiving messages with the window closed
- **Unread badge** on the tray icon and on supported taskbars/docks
- **Desktop notifications** — click one to bring the window forward
- **Launch at login** — starts hidden in the tray
- Window size, position and **zoom level persistence**
- External links open in your default browser
- Same-origin popups (image/attachment viewers) stay in-app
- x64 and arm64 builds, deb / rpm / AppImage / Flatpak

## Install

Grab a package from the [Releases](https://github.com/done6666/whatsapp-linux/releases) page.

| Format | Architectures | Install |
| --- | --- | --- |
| `.deb` | x64, arm64 | `sudo apt install ./whatsapp-linux_<version>_amd64.deb` |
| `.rpm` | x64, arm64 | `sudo dnf install ./whatsapp-linux-<version>.x86_64.rpm` |
| `.AppImage` | x64, arm64 | `chmod +x whatsapp-linux-<version>-<arch>.AppImage && ./whatsapp-linux-<version>-<arch>.AppImage` |
| `.flatpak` | x64, arm64 | `flatpak install ./whatsapp-linux-<version>-<arch>.flatpak` |

Exact file names are listed on the release page.

### First launch

Pair the app once by scanning the QR code with WhatsApp on your phone
(**Settings → Linked devices → Link a device**). The session persists across restarts.

## Build from source

Requirements: Node.js 24+ and npm.

```bash
git clone https://github.com/done6666/whatsapp-linux.git
cd whatsapp-linux
npm ci
npm start          # run in development
npm run dist       # build deb, rpm, AppImage and flatpak packages
```

## Tray support on Linux

- **Ubuntu GNOME**: works out of the box (Ubuntu AppIndicators extension is enabled by default).
- **Vanilla GNOME / other distros**: install and enable the AppIndicator extension, then restart
  your session:

  ```bash
  sudo apt install gnome-shell-extension-appindicator
  gnome-extensions enable appindicatorsupport@rgcjonas.gmail.com
  ```

- If no tray is available, the app detects it at startup: closing the window then quits the app
  instead of hiding it, so you are never left with a hidden process.

## Troubleshooting

<details>
<summary><b>Tray icon does not appear</b></summary>

On GNOME, tray icons require the AppIndicator extension (see above). KDE Plasma, XFCE, Cinnamon
and MATE support tray icons out of the box.
</details>

<details>
<summary><b>Notifications arrive but clicking them does nothing</b></summary>

Make sure a notification daemon is running (all major desktop environments ship one). Clicking a
notification shows and focuses the window even when it was hidden to the tray.
</details>

<details>
<summary><b>Sandbox error when running from source</b></summary>

The Electron binary downloaded during development needs correct ownership on its sandbox helper:

```bash
sudo chown root:root node_modules/electron/dist/chrome-sandbox
sudo chmod 4755 node_modules/electron/dist/chrome-sandbox
```

This is not needed for the packaged deb/rpm/AppImage/Flatpak builds.
</details>

## FAQ

**Is this an official WhatsApp client?**
No. This is an independent wrapper that displays web.whatsapp.com. It is not affiliated with or
endorsed by Meta.

**Do voice and video calls work?**
Yes — calls, voice messages and media sharing work through the embedded Chromium engine.

**Where is my session stored?**
Locally, in the Electron user data directory (`~/.config/WhatsApp Linux/`). Nothing is sent
anywhere by this app beyond what WhatsApp Web itself does.

**Can I use multiple accounts?**
Not yet — multi-account support is on the roadmap.

## Contributing

Issues and pull requests are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md).

## Disclaimer

This project is an unofficial client and is not affiliated with, associated with, authorized by,
or endorsed by WhatsApp LLC or Meta Platforms, Inc. **WhatsApp** is a trademark of Meta
Platforms, Inc. Use of the WhatsApp service remains subject to the WhatsApp Terms of Service.

## License

[MIT](LICENSE) © 2026 done6666
