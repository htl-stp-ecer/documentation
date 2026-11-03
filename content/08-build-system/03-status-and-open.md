---
title: "Status and open points"
author: "HTL St. Pölten ECER"
date: 2026-11-04
draft: false
weight: 4
description: "What is done, what is planned per repository, and what must happen in which order."
---

# Status and open points

All work is on branches called `refactor/build-system`. Nothing is merged and nothing is released from it yet.

## Done

| Repository | Branch | What |
|---|---|---|
| raccoon-cli | `refactor/build-system` | `build.py`, `deploy.py`, root `Dockerfile`, CI runs `build.py`, no tarball (see the raccoon-cli page) |
| raccoon-image | `refactor/build-system` | takes `raccoon_cli-*.whl` instead of `raccoon-server-*.tar.gz` (download, artifact scan, image root script, tests) |
| documentation | `refactor/build-system` | this section |
| botui | `refactor/build-system` | `build.py` builds the `botui_<n>_arm64.deb` in Docker, `deploy.py` installs it; the deb is called `botui` and replaces and conflicts with `stp-velox` (see the botui page) |
| local version `0.0` | `dev` or `fix/local-version-0.0` | in raccoon-cli, raccoon-lib, stm32-data-reader and botui |

## Planned per repository

| Repository | Result in `builds/` | Install on the Pi | Notes |
|---|---|---|---|
| raccoon-lib | `raccoon_sim-0.0-*aarch64.whl` and `raccoon_library-0.0-py3-none-any.whl` (same version) | the sim wheel | wraps `build.sh` and `scripts/build-stubs.sh`; cross compilation to be discussed; the second Dockerfile in the root and the one in `.github/docker` move to the root |
| stm32-data-reader | `stm32-data-reader_0.0_arm64.deb` | `apt install`; the work is in the package's `postinst` | the `dev` branch already builds a deb (`scripts/build_deb.sh`); CI there still builds the tarball; two feature branches (`feat/bus-servo`, `feat/onboard-fusion`) need to be coordinated |
| raccoon-transport | Python wheel | `pip3 install` | the build and CI have not been read yet; C++ and Dart are used as source through the submodule |

## Order and what breaks

1. raccoon-image must be merged **before or together with** raccoon-cli: the cli's next release has no tarball, and the old image scripts look for it. Both branches are ready; neither is merged.
2. Releases up to `v79` of botui are named `stp-velox_<n>_arm64.deb`. The pinned bundle `2026.11.03-2` names `botui: v79`, so the new file-name pattern does not find it. It works again with the first release built under the new name.
3. Releases of the cli up to the current one have the wheel as an asset, so pinned bundles still resolve with the new image scripts.
4. The CI of the release workflows runs only on `main`. The changed workflows are untested until the first merge.

## Open points

- Cross compilation for raccoon-lib and the reader inside Docker (QEMU or a real cross compiler, caches such as ccache).
- Whether `deploy.py` should be able to pin the transport version instead of taking the newest from PyPI.
- Whether the CI should keep a prebuilt image on `ghcr.io` for `build.py --image`.
- The deployment into a project's uv environment is only a documented command so far.
