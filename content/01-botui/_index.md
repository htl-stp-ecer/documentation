---
title: "Bot UI"
author: "Jakob Schlögl"
date: 2026-06-18
draft: false
weight: 1
---

# Bot UI

The Robot UI (BotUI) is the touchscreen interface displayed on the robot's screen. It gives you access to all robot features — sensor graphs, program execution, network settings, and system management — without needing a laptop or any other device. Everything runs directly on the Raspberry Pi.

## Installation

### Requirements

The Flutter toolchain is version-pinned via **FVM (Flutter Version Management)**. The exact version is declared in `botui/.fvmrc`:

```json
{
  "flutter": "3.32.7"
}
```

Install FVM and activate the pinned version before doing anything else:

```bash
dart pub global activate fvm
fvm install    # reads .fvmrc and installs 3.32.7
fvm use        # activates it for this project
```

The `build.sh` script automatically detects FVM and prefixes all Flutter commands with `fvm`. If `fvm` is not on `PATH` it falls back to the system-installed `flutter`, which is appropriate for CI environments that provision Flutter 3.32.7 directly.

Additional tools required:

| Tool | Purpose |
|------|---------|
| Python 3 | `install.py` deployment script |
| SSH & SCP | Uploading the build to the Raspberry Pi |
| `flutterpi_tool` | ARM64 cross-compile for flutter-pi (installed by `build.sh` automatically) |
| Git (SSH key configured) | Fetching Git-hosted dependencies (e.g. `sleek_circular_slider`) |
| C cross-compiler (`aarch64-linux-gnu-gcc`) | Building `libraccoon_ring_bridge.so` (see below) |

Dart SDK constraint is `^3.5.4` (`>=3.5.4 <4.0.0`), as declared in `pubspec.yaml`.

### Clone the Repository

The project uses Git submodules for `raccoon-transport`. Always clone with `--recurse-submodules`:

```bash
git clone https://github.com/htl-stp-ecer/botui.git --recurse-submodules
```

Via SSH:

```bash
git clone git@github.com:htl-stp-ecer/botui.git --recurse-submodules
```

Via GitHub CLI:

```bash
gh repo clone htl-stp-ecer/botui -- --recurse-submodules
```

If you already cloned without `--recurse-submodules`, initialise submodules manually:

```bash
git submodule update --init --recursive
```

### Project Setup

Fetch Flutter and Dart dependencies. Use `flutter pub get` (not `dart pub get`) so that Flutter plugin registration is performed correctly:

```bash
fvm flutter pub get
```

### Code Generation

BotUI uses `riverpod_generator`, `freezed`, and `json_serializable` for code generation. Run the build runner once after cloning (and again whenever you change annotated files):

```bash
fvm flutter pub run build_runner build -d
```

The `-d` flag deletes conflicting outputs from previous runs.

### Build & Deployment

Use `build.sh` to compile and `install.py` to deploy. The two are combined in `deploy.sh`:

```bash
chmod +x deploy.sh
./deploy.sh
```

Internally `build.sh`:
1. Runs `flutter pub get` and `build_runner`.
2. Cross-compiles the app for ARM64 using `flutterpi_tool build --arch=arm64 --cpu=pi3 --release`.
3. Cross-compiles `libraccoon_ring_bridge.so` — the shared library that embeds `raccoon_ring` (the shared-memory transport from the `raccoon-transport` submodule) — and copies it into the build output directory. This `.so` is required at runtime; the build will fail with an error if it cannot be produced.

`install.py` then:
1. Stops the `flutter-ui` systemd service on the Pi via SSH.
2. Copies the entire build output to `/home/pi/stp-velox` on the Pi using SCP.
3. Writes a `version` file so `raccoon-server` can report the UI version.
4. Installs or updates the systemd unit file.
5. Enables and starts `flutter-ui.service`.

#### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `RPI_HOST` | `192.168.68.110` | IP address of the target Raspberry Pi |
| `RPI_USER` | `pi` | SSH user on the Pi |

Override them on the command line if your Pi is on a different address:

```bash
RPI_HOST=192.168.1.42 ./deploy.sh
```

## Features

- [Dashboard]({{< ref "/01-botui/00-dashboard" >}}): The first screen displayed after boot; entry point to all other features.
- [Sensors & Actors]({{< ref "/01-botui/01-sensors-actors" >}}): Real-time graphs and direct control for all sensors and actuators.
- [Programs]({{< ref "/01-botui/02-programs" >}}): Browse, launch, and monitor executable programs on the robot.
- [Settings]({{< ref "/01-botui/03-settings" >}}): Network, display, system, camera, and robot personality configuration.
- [Calibration Board]({{< ref "/01-botui/04-calibration-board" >}}): USB-C daughterboard for precision odometry and IMU calibration.