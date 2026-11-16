---
title: "raccoon-cli"
author: "Mario Scholze"
date: 2026-11-16
draft: false
weight: 20
description: "Build the wheel with the web IDE and deploy it to the Pi."
---

# raccoon-cli

Builds a Python wheel, including the web IDE, in Docker.

## Build

```bash
python3 build.py                  # version 0.0
python3 build.py --version 181    # release build (what CI does)
python3 build.py --no-webide      # without the web IDE: faster, no npm
```

Result: `builds/raccoon_cli-<version>-py3-none-any.whl` and `builds/manifest.json`. Other options: `--image` (prebuilt image) and `--cache-dir` (npm and pip caches).

## Deploy

```bash
python3 deploy.py --host 192.168.4.1
python3 deploy.py --host 192.168.4.1 --artifact path/to/raccoon_cli-0.0-py3-none-any.whl
```

Stops `raccoon.service`, installs the wheel with `pip3` (the transport and missing dependencies come from PyPI, so the Pi needs internet), sets `raccoon-cli` to `dev` in `/etc/raccoon-bundle.json`, runs `post-install` (systemd unit, migrations) and restarts the service. If `raccoon-transport` is already `dev` in the bundle file, it is not overwritten.

The bundle file is written **before** the restart, because the server checks its version against it at startup.

## Good to know

- `pip install -e .` no longer builds the web IDE. The version stays `0.0` in `raccoon_cli/_version.py`.
- A release contains only the wheel. The old server tarball and `install.py` are gone.
- `raccoon update` still installs the cli on the Pi from PyPI. It does not use `deploy.py`.
- `build.py` and `deploy.py` are left out of the copy in the container, because `python -m build` would import a `build.py` there instead of the real `build` package.
