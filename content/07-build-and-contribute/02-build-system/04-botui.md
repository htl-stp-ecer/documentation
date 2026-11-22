---
title: "botui"
author: "Mario Scholze"
date: 2026-11-22
draft: false
weight: 40
description: "Build the .deb in Docker, deploy it, and try the UI on the PC."
---

# botui

Builds the Flutter app for the Pi as a `.deb` in Docker.

## Build

```bash
python3 build.py                 # version 0.0
python3 build.py --version 81    # release build (what CI does)
```

Result: `builds/botui_<version>_arm64.deb` and `builds/manifest.json`. Only Docker and Python 3 are needed on the host. Other options: `--image` and `--cache-dir` (pub cache).

Inside the container the app is built with `flutterpi_tool` for arm64, the transport bridge (`libraccoon_transport_bridge.so`, from raccoon-transport) is built next to it, and `dpkg-deb` packs everything. The `postinst` of the package removes a hand-placed unit in `/etc/systemd/system`, enables the service and restarts it.

## Deploy

```bash
python3 deploy.py --host 192.168.4.1
python3 deploy.py --host 192.168.4.1 --artifact path/to/botui_0.0_arm64.deb
```

Copies the `.deb` to the Pi, sets `botui` to `dev` in `/etc/raccoon-bundle.json` and runs `apt-get install --allow-downgrades`.

- The bundle file is written **before** the install, because the package restarts the UI and the UI checks itself against that file.
- `--allow-downgrades` is needed because Debian sorts `0.0` below every release number.

## Try the UI on the PC

```bash
python3 test-locally.py
```

Opens the UI in a window (800x480 like the Pi display) with `flutter run -d linux` in Docker. It needs an X11 display (Wayland works through XWayland). Your repository is mounted, so what you edit is what runs: `r` is a hot reload, `R` a hot restart, `q` quits. Use `--codegen` after changing annotated code (`@riverpod`, `@freezed`). `--no-debug` hides the DEBUG banner in the corner of the window.

There is no robot behind it, so screens that need the server or sensors stay empty. The app runs with `LOCAL_TEST=true`: shutdown, reboot, service control and similar commands are only printed, never run on your PC.
