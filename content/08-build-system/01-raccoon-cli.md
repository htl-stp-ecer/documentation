---
title: "raccoon-cli"
author: "marios271"
date: 2026-11-04
draft: false
weight: 2
description: "The first repository converted to the new build system."
---

# raccoon-cli

Branch: `refactor/build-system` (based on `dev`, not merged).

## Build

```bash
python3 build.py                  # wheel with web IDE, version 0.0
python3 build.py --version 181    # release build (what CI does)
python3 build.py --no-webide      # without the web IDE: faster, no npm
```

Result: `builds/raccoon_cli-<version>-py3-none-any.whl` and `builds/manifest.json`.

What happens: the image from the root `Dockerfile` (Python 3.13, Node 20) is built; the sources are copied into the container; `_version.py` is written with the version; the web IDE is built with `npm install` and `ng build` and copied to `raccoon_cli/web-ide-dist`; `python -m build --wheel` makes the wheel.

Parameters: `--version`, `--no-webide`, `--image` (use a prebuilt image instead of building the Dockerfile), `--cache-dir` (npm and pip caches, default `~/.cache/raccoon-build/raccoon-cli`).

Measured: a full build with the web IDE takes about 48 seconds with a warm cache; the wheel is about 2 MB.

## Deploy

```bash
python3 deploy.py --host 192.168.4.1
python3 deploy.py --host 192.168.4.1 --artifact path/to/raccoon_cli-0.0-py3-none-any.whl
```

Steps on the Pi: stop `raccoon.service`; upload the wheel to `/tmp/raccoon-install`; remove a user-level install that would shadow the system one; `sudo pip3 install --force-reinstall --no-deps` the wheel; install it again with `--upgrade raccoon-transport` (the transport and missing dependencies come from PyPI, so the Pi needs internet); set `raccoon-cli` to `dev` in `/etc/raccoon-bundle.json`; `python3 -m raccoon_cli.server.cli post-install` (installs the systemd unit, runs migrations, restarts the service); print the service status.

The bundle file is written **before** the restart because the server checks its own version against it when it starts.

> Not run against a real Pi yet. The build and the bundle-marking script were tested locally.

## What changed

| | |
|---|---|
| new | `build.py`, `deploy.py`, `.dockerignore`, `builds/` in `.gitignore` |
| moved | `.github/docker/Dockerfile` to `Dockerfile` |
| removed | `setup.py` (version and web IDE moved to `build.py`), `deploy.sh`, `install.py`, `uv.lock` (unused and outdated) |
| CI | `build-release.yml` runs `python3 build.py --version <n>`; `ci-image.yml` follows the Dockerfile |

Consequences:
- `pip install -e .` no longer builds the web IDE and no longer reads `BUILD_NUMBER` or `RACCOON_SKIP_WEBIDE`. The version stays the tracked `0.0` in `raccoon_cli/_version.py`.
- A release contains **only the wheel**. The server tarball `raccoon-server-v<n>.tar.gz` (wheel and `install.py`) is gone. The wheel is still uploaded to PyPI by the same job, with the same artifact name `raccoon-cli-wheel`.
- `raccoon update` still installs the cli on the Pi from PyPI over SSH. It does not use `deploy.py`.

## Why the build scripts are not in the copy

`python -m build` runs inside the copied sources. A file named `build.py` there would be imported as the module `build` instead of the real package. `build.py` and `deploy.py` are therefore excluded from the copy.
