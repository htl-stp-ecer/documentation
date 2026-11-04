---
title: "Conventions"
author: "marios271"
date: 2026-11-04
draft: false
weight: 1
description: "The rules every repository follows for building and deploying."
---

# Conventions

## The two scripts

Every repository has exactly two build and install scripts. There are no other ones (`build.sh`, `install.py`, `deploy.sh`, `setup.py`... are removed).

### `build.py`

- Builds **inside a Docker container**, so the host system stays clean.
- Writes everything it produces to **`./builds/`** and nowhere else. `builds/` is in `.gitignore`.
- Writes `builds/manifest.json` (name, version, file name, kind, sha256 of every result).
- Takes parameters, no environment variables.

| Parameter | Meaning |
|---|---|
| `--version` | Version stamped into the result. Default **`0.0`** = local build. CI passes the release number. |
| repository specific | for example `--no-webide` or `--skip-tests` |

Standard library only, so it runs without installing anything.

### `deploy.py`

- Takes a **local** build result, copies it from the laptop to the Pi and installs it there.
- For development only. Releases are installed by `raccoon update`, not by `deploy.py`.
- Standard library only.

| Parameter | Meaning |
|---|---|
| `--host` | Pi address. **Required.** |
| `--user` | SSH user. Default `pi`. |
| `--artifact` | Result to install. Default: the one in `builds/manifest.json`. |
| `--ssh-params` | Extra options for `ssh` and `scp` as one string. Default none. |

`deploy.py` always sets the component to `"dev"` in the Pi's `/etc/raccoon-bundle.json`. A deployed local build is a **custom build**, and the component version check is skipped for components the bundle marks `dev` (see the contract documentation in the releases section).

## Versions

- Only the CI stamps a release number. It passes it with `--version`.
- A local build is **`0.0`** in every component. The placeholders in the repositories are all `0.0` (before: `0.dev0`, `0.0.0`, `0`, `dev`, `0+source`).
- `raccoon-library` (stub wheel) and `raccoon-sim` (compiled wheel) always have the **same version**, because `raccoon-library[sim]` pins `raccoon-sim==<same version>`.

## Docker

- All Dockerfiles live in the **repository root**: `Dockerfile`, variants as `Dockerfile.<name>`.
- `.devcontainer/` stays as the VS Code convention asks.
- The build runs in a copy of the sources inside the container, so the repository never gets build output or root-owned files.
- CI runs the same `build.py`. Workflows only decide the version, create the release and publish.

## Artifact names must not change

Other tools find artifacts by file name. Do not rename them without changing the consumers:

| Component | File | Found by |
|---|---|---|
| raccoon-cli | `raccoon_cli-<n>-py3-none-any.whl` | PyPI, raccoon-image |
| raccoon-lib | `raccoon_library-<n>-py3-none-any.whl`, `raccoon_sim-<n>-*aarch64*.whl` | PyPI, raccoon-image |
| botui | `botui_<n>_arm64.deb` (was `stp-velox_<n>_arm64.deb`) | `raccoon update`, raccoon-image |
| stm32-data-reader | `stm32_data_reader-v<n>.tar.gz` today; a `.deb` on its `dev` branch | `raccoon update`, raccoon-image |

## Installing a local build into a project's uv environment

The laptop side of a project (raccoon-cli, raccoon-library) lives in the project's uv environment and normally comes from PyPI through the pins that `raccoon update` writes. To try a local build, install the wheel into that environment:

```bash
cd my-project
uv pip install --reinstall /path/to/raccoon-cli/builds/raccoon_cli-0.0-py3-none-any.whl
```

This changes neither `pyproject.toml` nor `uv.lock`. The next `uv sync` or `raccoon update` puts the PyPI version back. That is intended. (Not verified end to end yet.)
