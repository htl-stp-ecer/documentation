---
title: "raccoon-transport"
author: "Mario Scholze"
date: 2026-11-16
draft: false
weight: 30
description: "Build the wheel and the contract assets in Docker, and deploy them."
---

# raccoon-transport

Builds the Python wheel and the contract assets in Docker.

## Build

```bash
python3 build.py                 # version 0.0
python3 build.py --version 71    # release build (what CI does)
```

Result in `builds/`:
- `raccoon_transport-<version>-py3-none-any.whl`
- `contract-hash.txt` (raccoon-image reads the expected hash of a transport version from here)
- `contract.json` and `manifest.json` (which also holds the hash)

First, `scripts/contract.py --check` runs and stops the build if the generated constants are stale or the Python and Dart messages drifted from the C++ wire layout. C++ and Dart are not built here: they are used as source through the submodule, and their tests stay in the CI job `build-and-test`. `cpp/bridge/build.sh` stays, because botui and stm32-data-reader build their ring bridge with it.

## Deploy

```bash
python3 deploy.py --host 192.168.4.1
```

Installs the wheel on the Pi, sets `raccoon-transport` to `dev` in `/etc/raccoon-bundle.json`, restarts `raccoon.service` and prints the installed version and contract hash. It warns if the hash differs from the `contract_hash` in the bundle file.

## Where the contract is matched

Components compare the **contract hash**, not the transport version. The `components["raccoon-transport"]` entry in the bundle file is informational only: it shows up in messages and `GET /api/v1/contract` and never causes a refusal, so setting it to `dev` is only a marker for people. A transport build whose contract differs from the bundle's makes raccoon-lib, the STM reader and botui refuse runs until `contract_hash` is set to `dev` by hand. See [Transport contract]({{< ref "/06-advanced/transport/01-contract.md" >}}) for the full behavior.
