---
title: "update"
author: "Tobias Madlberger"
date: 2026-06-18
draft: false
weight: 5
---

# raccoon update

```bash
raccoon update
```

Updates raccoon on both your laptop and the robot to the latest release.

## What it does

1. Fetches the **bundle manifest** from the `raccoon-image` GitHub repository. The bundle is a JSON file that defines which component versions belong together as a known-good set (e.g. `bundles/latest.json`).
2. Checks the currently installed versions on your laptop and on the connected Pi against the bundle targets.
3. Downloads and installs updated packages on both sides — packages that are already at or ahead of the bundle version are left untouched unless `--force` is used.

raccoon talks to the GitHub REST API directly via `httpx`. No external tool (`gh`, `git`, etc.) is required.

## How the update mechanism works

raccoon does not ask "what is the newest release of every package?" It fetches a curated manifest from `raccoon-image` that pins all components to a tested combination. This means:

- Upgrading one package without upgrading others cannot break the version contract.
- If a package on your machine is *newer* than the bundle target, raccoon leaves it alone (it is "ahead of bundle").
- Only `--force` will downgrade a package that is ahead.

Laptop packages are installed via `pip`. Pi packages are installed over SSH using `pip3` on the Pi, with automatic fallback to `--break-system-packages` for system-managed Python environments.

## Options reference

| Flag | Default | Description |
|------|---------|-------------|
| `--check` | off | Dry-run only: show what would be updated without installing anything |
| `--laptop-only` | off | Only update packages on the laptop |
| `--pi-only` | off | Only update packages on the Pi |
| `--force` | off | Reinstall even if versions already match; also allows downgrading packages that are ahead of the bundle |
| `--bundle <name>` | `latest` | Pin to a specific bundle version (e.g. `2026.4.25.1`) |
| `--dev` | off | Use the `bundles/dev.json` manifest (latest component tips, auto-updated by CI) |
| `--allow-missing-pypi-version-fallback` | off | If the bundle requests a version not yet on PyPI, fall back to the latest available PyPI release |

## When to run

- After first connecting to a new robot, to ensure laptop and Pi versions match.
- When you see a version mismatch warning from `raccoon run`.
- Before a competition to ensure you are on the latest stable bundle.

## Common workflows

### Routine update

```bash
raccoon update
```

Fetches the stable bundle and updates anything that is behind.

### Check only — no changes

```bash
raccoon update --check
```

Shows a version table and exits without installing anything. Safe to run any time.

### Update just the laptop

```bash
raccoon update --laptop-only
```

Useful if the Pi is unreachable (competition floor, different network).

### Update just the robot

```bash
raccoon update --pi-only
```

Requires an active connection to the Pi.

### Follow the development bundle

```bash
raccoon update --dev
```

Uses `bundles/dev.json` instead of `bundles/latest.json`. Only recommended during active development — dev bundles may be unstable.

### Pin to a specific bundle

```bash
raccoon update --bundle 2026.4.25.1
```

Pins all packages to the exact versions defined in that bundle file.

### Force a Pi back to exact bundle versions

```bash
raccoon update --force --pi-only
```

Reinstalls even packages that are "ahead of bundle", reverting the Pi to the exact tested set.

## "Ahead of bundle" — what it means

If your Pi has a newer package than the bundle specifies, raccoon considers it *ahead of bundle* and skips it by default. This is intentional: a package that is newer than the stable set has not been tested together with the rest of the bundle.

Use `--force` to downgrade to the exact bundle versions, or `--dev` to use a bundle that already targets the newer version.

## Pi connectivity fallback

If the normal raccoon-server connection fails but the Pi is reachable over plain SSH, `raccoon update` falls back to SSH-only mode:

```
Connected via SSH only — raccoon-server is down.
```

In this state Pi package updates still work — the CLI runs `pip3 install` over SSH without needing the HTTP API.
