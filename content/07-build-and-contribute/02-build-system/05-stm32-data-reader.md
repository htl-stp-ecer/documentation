---
title: "stm32-data-reader"
author: "Mario Scholze"
date: 2026-11-16
draft: false
weight: 50
description: "Build the reader and the STM32 firmware in Docker as a .deb, and deploy it."
---

# stm32-data-reader

Builds the reader and the STM32 firmware in Docker and packs them as one `.deb`.

## Build

```bash
python3 build.py                  # reader + firmware, version 0.0
python3 build.py --version 60     # release build (what CI does)
python3 build.py --test           # also build and run the unit tests
python3 build.py --skip-firmware  # reuse the firmware of the last build
```

Result in `builds/`: `stm32-data-reader_<version>_arm64.deb` and `manifest.json`. Only Docker and Python 3 are needed. Other options: `--mode` (`native` or `cross`), `--image`, `--firmware-image`, `--cache-dir`.

Nothing is emulated while compiling. On an x86 PC the reader is **cross compiled** (`cross`); on an arm64 machine such as the CI's ARM runner it is compiled natively (`native`). The firmware is built with `arm-none-eabi-gcc` in a second image and is the same in both modes. In cross mode `--test` runs the finished test programs with `qemu-aarch64`.

## Deploy

```bash
python3 deploy.py --host 192.168.4.1
```

Copies the `.deb` to the Pi, sets `stm32-data-reader` to `dev` in `/etc/raccoon-bundle.json` (before the install, because the package restarts the reader) and runs `apt-get install --allow-downgrades`.

**The install flashes the STM32.** The `postinst` flashes the firmware when the hardware is there, so every deploy flashes it again and restarts the reader.

## Where things are installed

| | Path |
|---|---|
| binary | `/usr/bin/stm32_data_reader` |
| working directory, `cmd_trace.jsonl` | `/var/lib/stm32-data-reader` |
| firmware and flash scripts | `/usr/lib/stm32-data-reader/firmware`, linked from `~/flashFiles` |
| systemd units | `/lib/systemd/system` |

The `postinst` removes old units in `/etc/systemd/system` (they would shadow the packaged ones) and keeps a real `~/flashFiles` directory from an old install as `flashFiles.old`.

## Known issue

botui's dev menu runs `bash /home/pi/flash_files/reset_coprocessor.sh`, but the directory is `flashFiles`. This was already so before the refactor.
