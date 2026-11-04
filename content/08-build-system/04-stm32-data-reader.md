---
title: "stm32-data-reader"
author: "marios271"
date: 2026-11-04
draft: false
weight: 5
description: "The reader and the STM32 firmware, cross compiled in Docker at native speed; the release is a .deb."
---

# stm32-data-reader

Branch: `refactor/build-system` (based on `dev`, which is 19 commits ahead of `main`; not merged). The branches `feat/bus-servo` and `feat/onboard-fusion` are untouched; after a rebase they can be tested on their own with `build.py`.

## Build

```bash
python3 build.py                  # reader + firmware, version 0.0
python3 build.py --version 60     # release build (what CI does)
python3 build.py --test           # also build the unit tests and run them with qemu-user
python3 build.py --skip-firmware  # reuse the firmware of the last build
```

Result in `builds/`: `stm32-data-reader_<version>_arm64.deb` and `manifest.json`. On the host only Docker and Python 3 are needed. Parameters: `--version`, `--test`, `--skip-firmware`, `--image` and `--firmware-image` (prebuilt images), `--cache-dir` (ccache, build directories and the last firmware; default `~/.cache/raccoon-build/stm32-data-reader`).

**Nothing is emulated.** Both parts are cross compiled on the PC:
- **Reader:** `Dockerfile` is a Debian 13 `amd64` image with the aarch64 cross compiler (`gcc/g++-aarch64-linux-gnu`), CMake, Ninja, ccache. The reader needs no system libraries besides glibc and libstdc++: `spdlog` and `googletest` are built from source by CMake (`FetchContent`), `nlohmann/json` is vendored and `raccoon_ring` is part of raccoon-transport. The cross toolchain's own sysroot is therefore enough.
- **Firmware:** `Dockerfile.firmware` has `arm-none-eabi-gcc`, a cross compiler by nature. `firmware/` and `shared/` are copied into the container (the firmware includes `../shared`) and `wombat.bin` is built.
- **Package:** the `.deb` is assembled in `build.py` (this replaces `scripts/build_deb.sh`) from the reader, `wombat.bin`, the flash scripts, the systemd units, `packaging/debian/*` and the license notice of the vendored nlohmann/json (the old tarball shipped it too).

The earlier build ran the whole compiler in an arm64 container under QEMU, which is not set up on a normal PC (`binfmt`, `--privileged`). It was only fast in CI because CI used a native arm64 runner.

### Tests with qemu-user

`--test` configures a second build with the mock SPI (as the developers do), cross compiles the tests and runs them with `qemu-aarch64 -L /usr/aarch64-linux-gnu` (CMake's `CMAKE_CROSSCOMPILING_EMULATOR`). Only the finished test programs are emulated; nothing is compiled under emulation, and neither `binfmt` nor `--privileged` is needed. The test `reader_contract_smoke` is left out: it starts the real binary from a shell script, which would need `binfmt`.

### Measured

| | Time |
|---|---|
| first run, including the Docker images (the ARM toolchain alone is 600 MB) | 13 min 20 s |
| reader from scratch, images present, no cache | 49 s |
| same with `--test` (116 of 116 tests pass) | 53 s |
| warm, reader only | 1.5 s |
| warm, with firmware | 4.6 s |

Compared with `v59`: the binary is an aarch64 PIE ELF with the same dependencies (`libstdc++`, `libm`, `libgcc_s`, `libc`), the highest needed symbol versions are the same (`GLIBC_2.38`, `GLIBCXX_3.4.32`), and the contract hash built into it is `93ac36836810c9fe`, the bundle's. Size and firmware differ because `dev` has newer code.

## Deploy

```bash
python3 deploy.py --host 192.168.4.1
```

Copies the `.deb` to the Pi, sets `stm32-data-reader` to `dev` in `/etc/raccoon-bundle.json` (before the install: the package restarts the reader, which checks itself against that file) and runs `apt-get install --allow-downgrades` (Debian sorts `0.0` below every release).

**The install flashes the STM32.** The `postinst` flashes the firmware when the hardware is there, so every deploy flashes it again and restarts the reader.

> Not run against a real Pi yet. The build, the package contents and the bundle-marking script were tested locally.

## Changes to the package

Two things in `packaging/debian/postinst` were missing for the `.deb` to replace the tarball install:
- **Stale units.** The image script and the old `install.py` put the units in `/etc/systemd/system`, pointing at `/home/pi/stm32_data_reader`. They would shadow the packaged units and keep the old binary running. The `postinst` now removes plain-file units there (botui's package does the same).
- **`~/flashFiles`.** The reader runs `bash ~/flashFiles/flash_wombat.sh` and `reset_coprocessor.sh` itself (`Spi.cpp`: re-flash on a firmware mismatch, coprocessor reset), and the documentation tells people to use `~/flashFiles`. The package installs the scripts to `/usr/lib/stm32-data-reader/firmware`, so the `postinst` links `~/flashFiles` there and keeps a real directory from the old install as `flashFiles.old`.

## Where things moved

| | Before (tarball) | Now (.deb) |
|---|---|---|
| binary | `/home/pi/stm32_data_reader/stm32_data_reader` | `/usr/bin/stm32_data_reader` |
| working directory, `cmd_trace.jsonl` | `/home/pi/stm32_data_reader` | `/var/lib/stm32-data-reader` |
| firmware and flash scripts | `/home/pi/flashFiles` | `/usr/lib/stm32-data-reader/firmware`, linked from `~/flashFiles` |
| units | `/etc/systemd/system` | `/lib/systemd/system` |

Followed in the other repositories: raccoon-cli (`version_checker.py` asset and version command, the `/version` route and the live contract re-check look in both places, the `cmd_trace` fallback path) and raccoon-image (download pattern, artifact scan, image root script, tests).

## What changed

| | |
|---|---|
| new | `build.py`, `deploy.py`, `Dockerfile` (now the cross compiler), `Dockerfile.firmware`, `.dockerignore`, `builds/` in `.gitignore` |
| removed | `build.sh`, `deploy.sh`, `install.py`, `scripts/build_deb.sh`, `firmware/build.sh`, `firmware/deploy.sh`, `firmware/Dockerfile`, both `docker-compose.yml` |
| kept | `packaging/debian/*`, `firmware/flashFiles/*.sh` (they run on the Pi), `scripts/pid_tune.py`, `.devcontainer/` |
| CI | one job `build-and-release` runs `python3 build.py --version <n> --test` on a normal runner (before: a firmware job, a reader job on an arm64 runner and a release job); the release carries the `.deb` instead of the tarball |

## Found on the way (not changed)

botui's dev menu runs `bash /home/pi/flash_files/reset_coprocessor.sh`, but the directory is `flashFiles`, not `flash_files`. That was already so with the tarball.
