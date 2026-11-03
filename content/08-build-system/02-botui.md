---
title: "botui"
author: "HTL St. Pölten ECER"
date: 2026-11-04
draft: false
weight: 3
description: "botui converted to the new build system: the .deb is built in Docker."
---

# botui

Branch: `refactor/build-system` (based on `dev`, not merged).

## Build

```bash
python3 build.py                 # local build, version 0.0
python3 build.py --version 81    # release build (what CI does)
```

Result: `builds/botui_<version>_arm64.deb` and `builds/manifest.json`. On the host only Docker and Python 3 are needed.

Parameters: `--version`, `--image` (use a prebuilt image instead of building the `Dockerfile`), `--cache-dir` (pub cache, default `~/.cache/raccoon-build/botui`).

What happens: the `Dockerfile` (Flutter 3.38.7 image plus the aarch64 cross compiler, `python3`; git over https instead of ssh) is built. `build.py` starts itself inside the container as root (the Flutter SDK in the image is root-owned) and there copies the sources, runs `flutter pub get` and `build_runner`, activates `flutterpi_tool` and runs `flutterpi_tool build --arch=arm64 --cpu=pi3 --release --dart-define=APP_VERSION=<version>`. It builds `libraccoon_ring_bridge.so` from `packages/raccoon-transport/cpp/bridge`, copies it next to `app.so`, packs everything into the `.deb` with `dpkg-deb` and hands the file to the host user.

Measured: about 1 minute 47 seconds with a warm pub cache. The Flutter engine is downloaded in every build (it lives in the image, not in the cache).

`build/` (the output directory of `flutterpi_tool`) is no longer used by anything outside the container. Only `builds/` is the result directory.

## The package

Unchanged by the refactor: name `botui`, version = the build version, files in `/home/pi/stp-velox` (including a `version` file), the systemd unit in `/lib/systemd/system/flutter-ui.service`, `Depends: libc6, libstdc++6, libgcc-s1`, `Replaces` and `Conflicts: stp-velox`. The `postinst` removes a hand-placed unit in `/etc/systemd/system`, enables the service and restarts it.

## Deploy

```bash
python3 deploy.py --host 192.168.4.1
python3 deploy.py --host 192.168.4.1 --artifact path/to/botui_0.0_arm64.deb
```

Steps: check ssh; copy the `.deb` to `/tmp/botui-install`; set `botui` to `dev` in `/etc/raccoon-bundle.json`; `apt-get install --allow-downgrades`; print the service state and the installed version.

Two things differ from the raccoon-cli deploy:
- The bundle file is written **before** the install, because the package restarts the UI and the UI checks its own version against that file when it starts.
- `--allow-downgrades` is needed: Debian sorts `0.0` below every release number, and apt refuses to go from `80` to `0.0` otherwise.

> Not run against a real Pi yet. The build, the package contents and the bundle-marking script were tested locally.

## What changed

| | |
|---|---|
| new | `build.py`, `deploy.py`, `Dockerfile`, `.dockerignore`, `/builds/` in `.gitignore` |
| removed | `build.sh`, `deploy.sh`, `install.py`, `packaging/build-deb.sh` (its logic is part of `build.py`) |
| kept | `debug.sh` (runs a profile build on a connected device with `flutterpi_tool run`; needs Flutter on the host) |
| changed | `.fvmrc` is `3.38.7` now, the version CI releases with (it was `3.32.7`); the CI job `build` runs `python3 build.py --version <n>` and uploads `builds/botui_<n>_arm64.deb` |

`install.py` also copied a systemd unit to `/etc/systemd/system`. That is gone: the package is the only way to install, and its `postinst` removes such a leftover unit.
