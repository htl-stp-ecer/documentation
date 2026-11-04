---
title: "raccoon-lib"
author: "marios271"
date: 2026-11-04
draft: false
weight: 6
description: "The compiled library and the type stubs, cross compiled in Docker for the Pi; what the CI still does with cibuildwheel."
---

# raccoon-lib

Branch: `refactor/build-system` (based on `dev`; `main` is old). Not merged.

## Build

```bash
python3 build.py                  # version 0.0
python3 build.py --version 157    # release build
python3 build.py --test           # also build the C++ tests and run them
python3 build.py --mode native    # force a mode (default: native on aarch64, cross otherwise)
```

Result in `builds/`:

| File | What |
|---|---|
| `raccoon_sim-<version>-cp313-cp313-linux_aarch64.whl` | compiled runtime and simulator, with both platform bundles (mock and wombat), for the Pi |
| `raccoon_library-<version>-py3-none-any.whl` | the type stubs (`.pyi`, 158 files), no code |
| `manifest.json` | both files with their hashes |

Both wheels always get the **same version**: `raccoon-library[sim]` pins `raccoon-sim==<version>`. Parameters: `--version`, `--test`, `--image` (prebuilt image), `--cache-dir` (ccache, downloaded dependencies and build directories; default `~/.cache/raccoon-build/raccoon-lib`). On the host only Docker and Python 3 are needed.

**Nothing is emulated while compiling.** There are two modes (see the conventions). The root `Dockerfile` (it was `Dockerfile.cross`) has the stages `cross` and `native`; `build.py` picks the stage with `--target`. In `native` mode (an arm64 machine, the CI's ARM runner) the library is compiled with the normal compiler, the tests and the stub generation run natively, and no toolchain file or qemu is used. The rest of this section describes `cross`: a Debian 13 `amd64` image with the aarch64 cross compiler and the toolchain file `cmake/toolchains/aarch64-linux-gnu.cmake`. The Python 3.13 headers for aarch64 are taken from the Debian package without installing it (its `postinst` would run an ARM binary).

- **No Rust.** An older transport (iceoryx2) needed `cargo`; the current one does not, and the image has no Rust toolchain.
- **Wheel:** `python -m build` with scikit-build-core, `_PYTHON_HOST_PLATFORM=linux-aarch64` and `SETUPTOOLS_EXT_SUFFIX` so the wheel is tagged `linux_aarch64`. `tools/generate_step_builders.py` runs first.
- **Stubs:** `pybind11-stubgen` and mypy's `stubgen` import the finished module, which cannot run on the PC. They run with the **aarch64 Python under qemu-user** (`qemu-aarch64 -L /opt/arm64-root`), on the wheel that was just built. The Python, `libstdc++`, glib and sqlite of aarch64 are unpacked into `/opt/arm64-root` in the image; numpy, pyyaml and the stub tools are downloaded as aarch64 wheels. No `binfmt`, no `--privileged`. `build_stub_wheel()` does what the release mode of `scripts/build-stubs.sh` did; the script's local-dev mode stays for the optional mypy gate.
- **Tests:** `--test` configures a test build with the same toolchain and `CMAKE_CROSSCOMPILING_EMULATOR=qemu-aarch64;-L;/opt/arm64-root` and runs `ctest`. Only the finished test programs are emulated.

### One fix in `CMakeLists.txt`

The cross build already had code that renames `_core.so` to the aarch64 name, but it only replaced an architecture in an existing SOABI. With the host interpreter in a cross build there is none, and the file was called `raccoon/_core..so`, which Python cannot import. It now derives `cpython-313-aarch64-linux-gnu` from the Python version.

### Measured

| | Time |
|---|---|
| CMake configure, cross | 35 s |
| whole library, cross, no cache (272 steps) | 1 min 16 s |
| `build.py`: both wheels, cold cache, image present | about 2 min 20 s |
| same, warm | 32 s |
| with `--test`, cold test build, including 515 tests under qemu-user | 2 min 26 s (the tests take 41 s) |

### The tests

`--test` runs 515 C++ tests; 507 pass. Eight fail (`DiagonalMotionCovTest` ×7, `SimSensorTest.LineSensorReturnsZeroOnBlackAnd1023OnWhite`), and `SharedTransportTest.RepeatedSubscribeUnsubscribeDoesNotMultiplyUnderlyingDeliveries` fails now and then. The same tests fail when the tests are built **natively on x86**, so this is not an effect of the cross build or of qemu: the tests are out of date (the cases set a pose and read back the old one). Bringing the tests up to date is a separate step.

## Deploy

```bash
python3 deploy.py --host 192.168.4.1
```

Copies both wheels to the Pi, removes a user-level install that would shadow the system one, and installs them with `sudo pip3 install --force-reinstall --no-deps`. Then it sets `raccoon-lib` to `dev` in `/etc/raccoon-bundle.json` and prints the installed versions. `--no-deps` is deliberate: the wheel asks for `raccoon-transport>=70`, which a local transport build (`0.0`) does not satisfy, and the dependencies are on the Pi already. The Pi reports the library version from `pip show raccoon-library`, which is why that wheel is installed too.

> Not run against a real Pi yet. The build, the wheel contents and the argument handling were tested locally.

## CI

`.github/workflows/ci.yml` still builds the **release wheels for PyPI** with cibuildwheel (Linux x86_64 and aarch64 in manylinux containers, macOS, Windows). Those cannot run in a Docker image on a PC, and PyPI needs manylinux tags, not `linux_aarch64`. What changed:

- New job `pi-build` runs `python3 build.py --version <n>` twice in parallel: on a native ARM runner (`ubuntu-24.04-arm`) and on x86 (cross, so the path developers use on their PCs cannot break unnoticed). The stub wheel of the ARM build is uploaded as the artifact `wheel-library`; `publish-pypi` and `publish-library` take it from there (before: `publish-pypi` wrote it from the x86_64 wheel). The compiled `linux_aarch64` wheel is not published; the Pi gets the manylinux aarch64 wheel from PyPI through `raccoon update`. For a test run it is the artifact `pi-wheels`, which `deploy.py` can install. `--test` is not used there yet (eight tests are out of date).
- The manual input `release` can be unticked to build everything without PyPI, GitHub release and documentation trigger.
- The job `build` (ARM64 wheel under QEMU, tarball with `install.py`, documentation, release) was switched off with `if: false`. Everything it did is done by `publish-pypi`. It is removed.
- No `install.py` is part of a release any more.

The workflow only runs on `main` and is untested until the first merge.

## What changed

| | |
|---|---|
| new | `build.py`, `deploy.py`, `builds/` in `.gitignore` |
| `Dockerfile.cross` → `Dockerfile` | now also has qemu-user and the aarch64 Python; `.dockerignore` excludes everything (the images need no files) |
| removed | `build.sh`, `deploy.sh`, `install.py`, `dev.sh`, `scripts/setup-cross-toolchain.sh` (installed packages on the host with `sudo`) |
| kept for now | `scripts/build-stubs.sh` (the optional `LIBSTP_RUN_MYPY` gate in `CMakeLists.txt` calls it), `.github/docker/Dockerfile` and `.devcontainer/Dockerfile` (CI test image and dev container; they move with the tests), `dev_test.sh` |
