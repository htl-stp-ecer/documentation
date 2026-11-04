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
python3 build.py --test           # also build the C++ tests and run them (qemu-user in cross mode)
python3 build.py --python-tests   # also run the fast Python tests (tests/python)
python3 build.py --sim-tests      # also run the simulator Python tests (minutes; native mode)
python3 build.py --mode native    # force a mode (default: native on aarch64, cross otherwise)
```

Result in `builds/`:

| File | What |
|---|---|
| `raccoon_sim-<version>-cp313-cp313-linux_aarch64.whl` | compiled runtime and simulator, with both platform bundles (mock and wombat), for the Pi |
| `raccoon_library-<version>-py3-none-any.whl` | the type stubs (`.pyi`, 158 files), no code |
| `manifest.json` | both files with their hashes |

Both wheels always get the **same version**: `raccoon-library[sim]` pins `raccoon-sim==<version>`. Parameters: `--version`, `--test`, `--python-tests`, `--sim-tests`, `--mode`, `--image` (prebuilt image), `--cache-dir` (ccache, downloaded dependencies and build directories; default `~/.cache/raccoon-build/raccoon-lib`). On the host only Docker and Python 3 are needed.

**Nothing is emulated while compiling.** There are two modes (see the conventions). The root `Dockerfile` (it was `Dockerfile.cross`) has the stages `cross` and `native`; `build.py` picks the stage with `--target`. In `native` mode (an arm64 machine, the CI's ARM runner) the library is compiled with the normal compiler, the tests and the stub generation run natively, and no toolchain file or qemu is used. The rest of this section describes `cross`: a Debian 13 `amd64` image with the aarch64 cross compiler and the toolchain file `cmake/toolchains/aarch64-linux-gnu.cmake`. The Python 3.13 headers for aarch64 are taken from the Debian package without installing it (its `postinst` would run an ARM binary).

- **No Rust.** An older transport (iceoryx2) needed `cargo`; the current one does not, and the image has no Rust toolchain.
- **Wheel:** `python -m build` with scikit-build-core, `_PYTHON_HOST_PLATFORM=linux-aarch64` and `SETUPTOOLS_EXT_SUFFIX` so the wheel is tagged `linux_aarch64`. `tools/generate_step_builders.py` runs first.
- **Stubs:** `pybind11-stubgen` and mypy's `stubgen` import the finished module, which cannot run on the PC. They run with the **aarch64 Python under qemu-user** (`qemu-aarch64 -L /opt/arm64-root`), on the wheel that was just built. The Python, `libstdc++`, glib and sqlite of aarch64 are unpacked into `/opt/arm64-root` in the image; numpy, pyyaml and the stub tools are downloaded as aarch64 wheels. No `binfmt`, no `--privileged`. `build_stub_wheel()` does what the release mode of `scripts/build-stubs.sh` did; the script's local-dev mode stays for the optional mypy gate.
- **Tests:** the test flavour of the wheel is built once (`LIBSTP_BUILD_TESTS=ON`, one static mock platform, because `raccoon.sim.mock` only exists then). Its build directory also holds the C++ test programs for `ctest`; the wheel is installed into a folder for pytest. In cross mode `CMAKE_CROSSCOMPILING_EMULATOR=qemu-aarch64;-L;/opt/arm64-root` runs the finished test programs and the aarch64 Python runs pytest, both under qemu-user.
- **`DRIVER_BUNDLE=mock`:** `build.py` passes it like the cibuildwheel build does. On Linux both bundles are built anyway and chosen at runtime; the option is the static fallback.

### One fix in `CMakeLists.txt`

The cross build already had code that renames `_core.so` to the aarch64 name, but it only replaced an architecture in an existing SOABI. With the host interpreter in a cross build there is none, and the file was called `raccoon/_core..so`, which Python cannot import. It now derives `cpython-313-aarch64-linux-gnu` from the Python version.

### Measured

| | Time |
|---|---|
| CMake configure, cross | 35 s |
| whole library, cross, no cache (272 steps) | 1 min 16 s |
| `build.py`: both wheels, cold cache, image present | about 2 min 20 s |
| same, warm | 32 s |
| with `--test --python-tests`, cross, test wheel built from scratch (C++ and Python tests under qemu-user) | not timed again after the test wheel change |

### The tests

| Switch | What | Result |
|---|---|---|
| `--test` | the C++ tests (`ctest`) | 524 of 524 pass (cross with qemu-user and native) |
| `--python-tests` | the fast Python tests, `tests/python` without `sim/` | 1777 pass, 34 s under qemu-user |
| `--sim-tests` | the simulator tests, `tests/python/sim` | **TODO, not green** ([issue #109](https://github.com/htl-stp-ecer/raccoon-lib/issues/109)): about 7 minutes natively, far too slow under qemu-user. Two causes are fixed (the fake robot had no `get_service`, the auto-tune runner passed a removed `csv_dir`), the rest was not re-run |

What was out of date and is now updated: `DiagonalMotionCovTest` (the motion closes its heading loop on `getHeading()`, the test helper set only `getAbsoluteHeading()`), the simulated line sensor (1023 on black, 0 on white, like the real sensor), the effective optimizer pipeline (starts with `resolve_heading`), the default `distance_tolerance_m` (0.002), the removed `to_simulation_step()` of the line follow steps, `_ProfileEntryScreen` (no cancel path), and the custom velocity builder, which now checks its arguments when the step is built (`resolve()`), not when it is called.

`SharedTransportTest.RepeatedSubscribeUnsubscribe…` failed now and then because of a bug in raccoon-transport (deliveries of the wait path were missing in the stats). It is fixed in raccoon-transport (`0000e0e`); the lib has it as soon as its submodule is moved to a release that contains it.

The simulator tests were switched off in the old CI as well. Their failures are of the same kind (old expectations, for example about goto, spline and drift correction) and need to be looked at one by one.

> **`_DISABLE_LOCALIZATION_FOR_TESTING = True`** in `raccoon/robot/api.py` (since `ae265d4`): the real localization (particle filter) is switched off in every build, `GenericRobot` uses the dead-reckoning stand-in. This is in the shipped code and not an effect of `build.py`. Whether it is meant to stay is for the lib's developers to decide.

## Deploy

```bash
python3 deploy.py --host 192.168.4.1
```

Copies both wheels to the Pi, removes a user-level install that would shadow the system one, and installs them with `sudo pip3 install --force-reinstall --no-deps`. Then it sets `raccoon-lib` to `dev` in `/etc/raccoon-bundle.json` and prints the installed versions. `--no-deps` is deliberate: the wheel asks for `raccoon-transport>=70`, which a local transport build (`0.0`) does not satisfy, and the dependencies are on the Pi already. The Pi reports the library version from `pip show raccoon-library`, which is why that wheel is installed too.

> Not run against a real Pi yet. The build, the wheel contents and the argument handling were tested locally.

## CI

`.github/workflows/ci.yml` still builds the **release wheels for PyPI** with cibuildwheel (Linux x86_64 and aarch64 in manylinux containers, macOS, Windows). Those cannot run in a Docker image on a PC, and PyPI needs manylinux tags, not `linux_aarch64`. What changed:

- New job `pi-build` runs `python3 build.py --version <n>` twice in parallel: on a native ARM runner (`ubuntu-24.04-arm`) and on x86 (cross, so the path developers use on their PCs cannot break unnoticed). The stub wheel of the ARM build is uploaded as the artifact `wheel-library`; `publish-pypi` and `publish-library` take it from there (before: `publish-pypi` wrote it from the x86_64 wheel). The compiled `linux_aarch64` wheel is not published; the Pi gets the manylinux aarch64 wheel from PyPI through `raccoon update`. For a test run it is the artifact `pi-wheels`, which `deploy.py` can install. The tests run in the separate job `test` (below).
- New job `test` (it was switched off with `if: false` and ran on a self-hosted x86 runner in an own Docker image): `python3 build.py --test --python-tests` natively on `ubuntu-24.04-arm`. The simulator tests are not run there yet.
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
| removed later | `.github/docker/Dockerfile` (the old CI test image; the CI test job now runs `build.py`), `dev_test.sh` (a test loop for an old worktree with its own Python 3.12 `.venv`) |
| kept | `scripts/build-stubs.sh` (the optional `LIBSTP_RUN_MYPY` gate in `CMakeLists.txt` calls it, off by default), `.devcontainer/` (CLion dev container; not part of the build) |
