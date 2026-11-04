---
title: "raccoon-transport"
author: "HTL St. Pölten ECER"
date: 2026-11-04
draft: false
weight: 4
description: "raccoon-transport converted to the new build system, and where the contract is matched."
---

# raccoon-transport

Branch: `refactor/build-system` (based on `main`, there is no `dev`; not merged).

## Build

```bash
python3 build.py                 # local build, version 0.0
python3 build.py --version 71    # release build (what CI does)
```

Result in `builds/`:
- `raccoon_transport-<version>-py3-none-any.whl`
- `contract-hash.txt` (raccoon-image reads the expected hash of a transport version from the release)
- `contract.json`
- `manifest.json` (also holds the contract hash)

What happens in the container (`Dockerfile`, Python 3.13 with `build`, `setuptools`, `wheel`): the sources are copied; `scripts/contract.py --check` runs first and stops the build if the generated constants are stale or the Python and Dart messages drifted from the C++ wire layout; the version in `python/pyproject.toml` is set in the copy; `python -m build --wheel` makes the wheel; the contract assets are written.

Only the Python wheel and the contract assets are built. C++ and Dart are used as source through the submodule, and their tests still run in the CI job `build-and-test`, which is unchanged. `cpp/bridge/build.sh` stays: botui and stm32-data-reader build their ring bridge with it.

**Checked against the real release:** a local build of the sources of `main` gives the same contract hash as release `v70` (`93ac36836810c9fe`), an identical `contract.json`, the same file list in the wheel, and byte-identical Python sources.

## Deploy

```bash
python3 deploy.py --host 192.168.4.1
```

Copies the wheel to the Pi, installs it (`--force-reinstall --no-deps`; the wheel is pure Python without dependencies), sets `raccoon-transport` to `dev` in `/etc/raccoon-bundle.json`, restarts `raccoon.service` (it imports the transport at start) and prints the installed version and contract hash. If the wheel's contract hash differs from the `contract_hash` in the bundle file, it prints a warning.

> Not run against a real Pi yet. Build, contract check and the bundle-marking script were tested locally.

## What changed

| | |
|---|---|
| new | `build.py`, `deploy.py`, `Dockerfile`, `.dockerignore`, `builds/` in `.gitignore` |
| changed | placeholder version in `python/pyproject.toml` is `0.0` (was `0.1.51`); the CI job `build-and-release` runs `python3 build.py --version <n>` and releases `builds/…` (same file names, same artifact name `raccoon-transport-wheel`); PyPI publish and `notify-components` are unchanged |
| removed | nothing: there were no build or install scripts besides CMake |

## Where the contract is matched, and what `dev` does

Result of a read-only audit of all repositories. The Python implementation was read directly; C++, Dart and the other components were read by the audit. Unit tests and the documentation were not part of it.

`components["raccoon-transport"]` in the bundle file is **informational only**. It is read into `expected_transport_version` and appears in messages, status files and `GET /api/v1/contract`. It is never compared and never causes a refusal, in the Python, C++ and Dart implementations alike. Nothing parses it as a number or passes it to `pip`. The `pip install raccoon-transport==<version>` pins come from the remote bundle manifest (`raccoon update`) or the image manifest (`update-image-root.sh`), not from the file on the Pi.

What the components compare is the **contract hash** (`contract_hash` against their compiled-in hash):

| Bundle file on the Pi | Effect |
|---|---|
| `contract_hash` is a hash | compared. A different hash is a `mismatch` and refuses the run (the server answers HTTP 409; the services exit with code 78). |
| `components["raccoon-transport"] = "dev"` | **no effect on the check.** The hash is compared as usual. `dev` only shows in the text (`transport dev`). The transport check has no special case for this entry. |
| `contract_hash = "dev"` | the hash comparison is skipped for **every** component on the device. The result is `dev-warnung` (does not refuse), `dev_mode` is true, and the cli and botui show a warning. A refusing component version check still refuses; file errors still refuse. |

Consequences:
- Setting the transport to `dev` is a marker for people. It does not let a changed contract through. A transport build whose contract differs from the bundle's makes raccoon-lib, the STM reader and botui refuse runs until they are rebuilt with the same contract, unless `contract_hash` is set to `dev`.
- A `dev` transport entry is harmless for the checks. It would only break something if it got into a manifest: `update-image-root.sh` would pin `raccoon-transport==dev`, but `download-image-inputs.py` refuses `dev` bundles and requires a `v<number>` transport tag.
- `raccoon update --dev` writes `dev` into the Pi file for the components it updated and leaves `contract_hash` as it is.

Not verified by the audit: the part of `download-image-inputs.py` that builds the image manifest (about lines 100 to 155), `image.yml` and `create-bundle.yml` beyond their grep hits, and `doctor.py` and `run.py` in the cli.
