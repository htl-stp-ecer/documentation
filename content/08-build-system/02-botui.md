---
title: "botui"
author: "marios271"
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

## Try the UI on the PC: test-locally.py

```bash
python3 test-locally.py
```

Opens the UI in a window (`flutter run -d linux` in Docker, 800x480 like the Pi display) for trying out styling, margins and layout. It uses its own image, `Dockerfile.desktop` (Flutter's Linux toolchain, GTK, Mesa), so the Pi build image stays small. X access is passed in with `DISPLAY`, the X11 socket and your `XAUTHORITY` file, the GPU with `/dev/dri`. The window needs an X11 display; a Wayland session works through XWayland.

**The repository is mounted into the container.** What you edit in your editor is what runs: `r` in the terminal is a hot reload, `R` a hot restart, `q` quits. `build/` and `.dart_tool/` stay in the repository (ignored by git), so only the first start builds everything. The ring bridge is built natively for the PC from a copy in the cache, so the submodule stays untouched. `build_runner` does not run by default, because the generated `*.g.dart` files are in git; use `--codegen` after changing annotated code (`@riverpod`, `@freezed`, ...).

Measured with the image already built: about 12 seconds for the first start, about 5 seconds afterwards (37 seconds in the first version, which copied the sources and ran `build_runner` every time: 26 of those seconds). Building the image takes about 1.5 minutes once. A hot reload after an edit on the host took about 0.3 seconds.

The container runs as root, because the Flutter SDK in the image is root-owned. It writes with `umask 0` so you can change and delete everything, hands the files back to you when it exits, and restores `pubspec.lock`, which Flutter 3.38 rewrites with its own resolution.

There is no robot behind it: the raccoon server, sensors and hardware are missing, so those screens stay empty or show errors. That is intended.

**Nothing may change your PC.** The app is started with `--dart-define=LOCAL_TEST=true` (`lib/core/utils/local_test.dart`). In that mode `SudoProcess` runs no command: it prints `[local-test] not running: sudo -n <command>` and returns a successful, empty result, so screens (for example the shutdown and reboot dialogs) behave as on the robot. This covers shutdown, reboot, service start and stop, Wi-Fi changes, hostname and screen rotation. The few direct `sudo` calls outside `SudoProcess` (dev menu: reset STM32, restart UI, reboot; service log following; disk usage) check the same flag. On top of that the container has no `sudo` and no systemd.

Tested: the app starts in the window, the transport and the native bridge load, a change made on the host is picked up by a hot reload, and a unit test (`test/core/utils/sudo_process_local_test_test.dart`, needs `--dart-define=LOCAL_TEST=true`) shows that `shutdown -h now` and `reboot` are only printed. Not clicked through by hand: the individual screens.

## What changed

| | |
|---|---|
| new | `build.py`, `deploy.py`, `test-locally.py`, `Dockerfile`, `Dockerfile.desktop`, `.dockerignore`, `/builds/` in `.gitignore` |
| removed | `build.sh`, `deploy.sh`, `install.py`, `packaging/build-deb.sh` (its logic is part of `build.py`) |
| kept | `debug.sh` (runs a profile build on a connected device with `flutterpi_tool run`; needs Flutter on the host) |
| changed | `.fvmrc` is `3.38.7` now, the version CI releases with (it was `3.32.7`); the CI job `build` runs `python3 build.py --version <n>` and uploads `builds/botui_<n>_arm64.deb` |

`install.py` also copied a systemd unit to `/etc/systemd/system`. That is gone: the package is the only way to install, and its `postinst` removes such a leftover unit.
