---
title: "Status and open points"
author: "marios271"
date: 2026-11-04
draft: false
weight: 7
description: "What is done, what is planned per repository, and what must happen in which order."
---

# Status and open points

All work is on branches called `refactor/build-system`. Nothing is merged and nothing is released from it yet.

## Done

| Repository | Branch | What |
|---|---|---|
| raccoon-cli | `refactor/build-system` | `build.py`, `deploy.py`, root `Dockerfile`, CI runs `build.py`, no tarball (see the raccoon-cli page) |
| raccoon-image | `refactor/build-system` | takes `raccoon_cli-*.whl` instead of `raccoon-server-*.tar.gz` (download, artifact scan, image root script, tests) |
| raccoon-transport | `refactor/build-system` | `build.py` builds the wheel and contract assets in Docker, `deploy.py` installs the wheel; output matches release v70 |
| stm32-data-reader | `refactor/build-system` | `build.py` cross compiles reader and firmware in Docker, tests run with qemu-user, the release is a `.deb`; raccoon-cli and raccoon-image follow |
| raccoon-lib | `refactor/build-system` | `build.py` cross compiles the library in Docker (natively on an ARM machine) and writes the stub wheel, `deploy.py` installs both wheels; PyPI wheels stay with cibuildwheel (see the raccoon-lib page) |
| documentation | `refactor/build-system` | this section |
| botui | `refactor/build-system` | `build.py` builds the `botui_<n>_arm64.deb` in Docker, `deploy.py` installs it; the deb is called `botui` and replaces and conflicts with `stp-velox` (see the botui page) |
| local version `0.0` | `dev` or `fix/local-version-0.0` | in raccoon-cli, raccoon-lib, stm32-data-reader and botui |

## Planned per repository

Nothing: all repositories except `raccoon-example` are converted. The tests of raccoon-lib are to be brought up to date as a separate step, and its CI test job and the two other Dockerfiles (`.github/docker`, `.devcontainer`) move with that.

## Order and what breaks

1. raccoon-image must be merged **before or together with** raccoon-cli: the cli's next release has no tarball, and the old image scripts look for it. Both branches are ready; neither is merged.
2. Releases up to `v79` of botui are named `stp-velox_<n>_arm64.deb`. The pinned bundle `2026.11.03-2` names `botui: v79`, so the new file-name pattern does not find it. It works again with the first release built under the new name.
3. Releases of the cli up to the current one have the wheel as an asset, so pinned bundles still resolve with the new image scripts.
4. Releases of the stm32-data-reader up to `v59` are tarballs (`stm32_data_reader-v<n>.tar.gz`); the pinned bundle `2026.11.03-2` names `stm32-data-reader: v59`. The new pattern `stm32-data-reader_*_arm64.deb` does not find it, so raccoon-image and `raccoon update` work for the reader again with the first release built by the new CI. The same three branches have to be merged together: the reader, raccoon-cli and raccoon-image.
5. The CI of the release workflows runs only on `main`. The changed workflows are untested until the first merge.

## Open points

- raccoon-lib: eight C++ tests fail, on x86 as well; the optional `LIBSTP_RUN_MYPY` gate still uses `scripts/build-stubs.sh`.
- Whether `deploy.py` should be able to pin the transport version instead of taking the newest from PyPI.
- Whether the CI should keep a prebuilt image on `ghcr.io` for `build.py --image`.
- The deployment into a project's uv environment is only a documented command so far.
