---
title: "update"
author: "Tobias Madlberger"
date: 2026-11-02
draft: false
weight: 5
description: "How raccoon update brings the laptop project and the robot to the versions of one bundle."
---

# raccoon update

```bash
raccoon update
```

Brings your **project** (laptop side) and the **robot** (Pi side) to the exact component versions of one bundle. It has to be run **inside a raccoon project**, because the laptop side lives in the project's `pyproject.toml`.

## The bundle model

raccoon does not update packages independently. It fetches a **bundle manifest** — a JSON file in the `raccoon-image` repository that lists which exact component versions belong together as a tested set, and the [transport contract hash]({{< ref "20-transport-contract" >}}) all of them were built against. Updating means "bring everything to the versions of this bundle."

1. You can never update one component without the ones it depends on.
2. A package that is *newer* than the bundle is "ahead of bundle" and left alone — it has not been tested with the rest.
3. A bundle that does not name a transport version (and its contract hash) is refused. All components of a bundle must share one transport.

For the version layers (packages, bundle, `format_version`) see [Versioning And Upgrades]({{< ref "07-versioning-and-upgrades" >}}).

## What you see

Two tables, laptop first, each preceded by an empty line. Columns: *Package*, *Bundle* (target) and *Installed*. A component that is empty in the bundle shows `-` and is **never touched** (no install, no upgrade, no uninstall).

| Table | Packages |
|-------|----------|
| **Laptop Versions** | `raccoon-cli`, `raccoon-lib` |
| **Pi Versions** | `cli`, `lib`, `transport`, `botui`, `stm32-data-reader`, `cam` |

`--laptop-only` shows only the laptop table, `--pi-only` only the Pi table.

## What it does

### Laptop (your project)

- Rewrites the `raccoon-cli` and `raccoon-library` pins in the project's `pyproject.toml` (extras like `[sim]` are kept) and sets the project's `version` to the bundle name, when that is a valid version.
- Runs `uv sync` in the project (`uv sync --reinstall` with `--force`). If `uv` is not installed the laptop part stops with an error badge and tells you how to install it.
- **Windows** locks the running `raccoon.exe` inside the project environment, so there the pins are written and raccoon tells you to run `uv sync` yourself.

### Pi (the robot)

Each component is installed the way it is shipped:

| Component | How |
|-----------|-----|
| `raccoon-lib` (+ simulator) | `pip3 install --break-system-packages --upgrade "raccoon-library[sim]==<n>"` from PyPI over SSH, **together with** `raccoon-transport==<n>` in the same run |
| `raccoon-transport` | pinned exactly as above (also installed alone when only the transport differs) |
| `raccoon-cli` (server) | release tarball `raccoon-server-v<n>.tar.gz`, its `install.py` runs against `RPI_HOST` |
| `botui` | `stp-velox_<n>_arm64.deb` copied to the Pi, `sudo apt install -y` |
| `stm32-data-reader` | `stm32_data_reader-v<n>.tar.gz`, its `install.py` (this **flashes the firmware**) |

After the packages, in this order:

1. the post-install migrations run on the Pi,
2. the bundle manifest is written to `/etc/raccoon-bundle.json` (root-owned),
3. `stm32_data_reader` and `flutter-ui` are restarted, then `raccoon.service` last.

The order is deliberate: nothing may start against a bundle file that names a different transport than the one just installed. Every component then re-runs its startup check (see [Transport contract]({{< ref "20-transport-contract" >}})).

## Options

| Flag | Default | Description |
|------|---------|-------------|
| `--check` | off | Show the tables and what would happen; change nothing |
| `--laptop-only` | off | Only the laptop project |
| `--pi-only` | off | Only the Pi |
| `--force` | off | Reinstall even if versions match; allows downgrading packages that are ahead of the bundle |
| `--bundle <name>` | `latest` | A specific bundle, e.g. `2026.11.02` or `2026.11.02-2` |
| `--dev` | off | `bundles/dev.json`: the newest component releases, **not tested together** |
| `--allow-missing-pypi-version-fallback` | off | If the bundle names a version that is not on PyPI yet, use the newest PyPI release |

## Errors that stop everything before a change

- **Not in a project** — a red badge, immediately.
- **The bundle has no transport version or no usable `contract_hash`** — older bundles (for example `2026.5.25.1`) can no longer be installed with `--bundle`. Use a newer one, or `--dev`.
- **Could not reach the Pi** — the Pi checks are skipped. There is no SSH-only fallback: if `raccoon-server` is broken, flash the latest raccoon image.

## `--dev`

The dev bundle has no transport field, so it runs **without a transport check or pin** (the transport comes in as a dependency) and **does not touch** `/etc/raccoon-bundle.json`. If you set the field to `dev` by hand (see [Dev mode]({{< ref "20-transport-contract#dev-mode" >}})), it stays until the next normal `raccoon update`, which replaces it with the bundle's hash. Use `--dev` deliberately and at your own risk.

## Common workflows

```bash
raccoon update                      # stable bundle, laptop + Pi
raccoon update --check              # look only
raccoon update --laptop-only        # Pi unreachable (competition floor)
raccoon update --pi-only            # needs a connection
raccoon update --bundle 2026.11.02  # a specific bundle
raccoon update --force --pi-only    # back to the exact bundle versions
```

## "Ahead of bundle"

If a package is newer than the bundle, raccoon skips it by default — it has not been tested with the rest of the set. `--force` downgrades to the bundle versions, `--dev` uses a bundle that already targets the newer version.

The Pi's bundle file is only rewritten when at least one Pi package is installed. If the Pi is already current but its `/etc/raccoon-bundle.json` is stale (for example after a manual install), flash the image or use `--force`.

## Related pages

- [Transport contract]({{< ref "20-transport-contract" >}})
- [Versioning And Upgrades]({{< ref "07-versioning-and-upgrades" >}})
- [Troubleshooting And Recovery]({{< ref "08-troubleshooting-and-recovery" >}})
- [Bundles and releases]({{< ref "/07-releases/00-bundles-and-create-bundle" >}}) (how a bundle is made)
