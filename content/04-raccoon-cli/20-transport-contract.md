---
title: "Transport contract"
author: "Tobias Madlberger"
date: 2026-11-02
draft: false
weight: 21
description: "How raccoon makes sure every component on the robot speaks the same transport, and what to do when it does not."
---

# Transport contract

Everything on the robot — the Python library that runs your missions, the STM32 reader, the Bot UI and the Pi server — exchanges data through **raccoon-transport**. If one of them was built against a different transport than the others, messages are dropped without any error. The **transport contract check** turns that silent failure into a clear message at start.

## The idea in four words

| Term | Meaning |
|------|---------|
| **Contract** | Everything components rely on when they exchange data: the layout of every message type, every channel name, the shared-memory ring layout |
| **Contract hash** | A 16-character fingerprint of the contract (for example `93ac36836810c9fe`). Same contract, same hash, in C++, Python and Dart |
| **Bundle file** | `/etc/raccoon-bundle.json` on the robot, written by the image or by `raccoon update`. It names the hash every component must have, and the version of every component |
| **Status file** | The result of one component's start check, in `/run/raccoon/<component>.json`. Errors never travel over the transport, because it may be the thing that is broken |

The **bundle is the source of truth**: components never ask each other. Each one compares its own compiled-in hash and its own version with the bundle file, once, when it starts. Nothing is added to the publish/subscribe path.

## What is checked

```json
{
  "bundle": "2026.11.02",
  "contract_hash": "93ac36836810c9fe",
  "components": {
    "raccoon-transport": "v69",
    "raccoon-lib": "v155",
    "raccoon-cli": "v173",
    "stm32-data-reader": "v58",
    "botui": "v73"
  }
}
```

1. **Contract:** the component's compiled-in hash must equal `contract_hash`.
2. **Version:** the component's own version must equal its entry in `components` (`v173` and `173` are the same). The Pi server is `raccoon-cli` in this file.

| Result | When | What happens |
|--------|------|--------------|
| `ok` | hash and version match | normal start |
| `mismatch` | the hash differs | the component **refuses to start** |
| `version-mismatch` | the version differs | the component **refuses to start** |
| `bundle-fehler` | file missing, unreadable, or `contract_hash` / the component's entry missing or empty | the component **refuses to start**; the message names the reason |
| `dev-warnung` | the bundle field is `dev` (see below) | starts, warns |
| `skipped` | not running on a Raccoon device | nothing is checked |

A missing file is **never** silently skipped on the robot: if a script that writes the bundle breaks, the protection must not switch off unnoticed.

### Laptop, simulation and `--local`

The check only applies on a Raccoon device, recognised by the directory `/etc/raccoon-image` that the image creates. On your laptop, in the simulator and with `raccoon run --local` nothing is checked and nothing blocks. The laptop is not part of the contract: it talks to the Pi over REST and WebSocket.

## What each component does

| Component | Checks | On `mismatch` / `version-mismatch` / `bundle-fehler` |
|-----------|--------|------------------------------------------------------|
| `stm32-data-reader` | at start | logs the reason to the journal, writes its status file, **exits with code 78**; systemd does not restart it (`RestartPreventExitStatus=78`) |
| `raccoon-lib` | at `import raccoon` | raises a `RuntimeError` with the message; it shows up in your run log |
| Pi server (`raccoon-server`) | at start and before every run | stays up and reports; **refuses runs** with HTTP 409 naming the components |
| Bot UI | at start | popup "System mismatch" (acknowledge to continue); the status file is written |
| CLI | `doctor`, `connect`, `run` | shows what the server reports; no check on the laptop |

Messages always name **both sides**: the component's own hash and version and the bundle's. The check says that they differ, not who is right.

## What you see

### `raccoon doctor`

```
Transport contract
Bundle 2026.11.02 expects 93ac36836810c9fe (transport v69)
┏━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━┳━━━━━━━━━┳━━━━━━━━━━━━━━━━━━┓
┃ Component         ┃ Result   ┃ State   ┃ Contract         ┃
┡━━━━━━━━━━━━━━━━━━━╇━━━━━━━━━━╇━━━━━━━━━╇━━━━━━━━━━━━━━━━━━┩
│ botui             │ ok       │ running │ 93ac36836810c9fe │
│ raccoon-server    │ ok       │ running │ 93ac36836810c9fe │
│ stm32-data-reader │ mismatch │ not active │ 1111111111111111 │
└───────────────────┴──────────┴─────────┴──────────────────┘
```

*State* is `running` while the process that wrote the file is alive and `not active` otherwise. A reader that refused and exited stays visible — that is the point. Doctor exits with code 1 when the contract is broken.

### `raccoon run`

If a component does not match, the Pi server answers the run request with a refusal and the CLI prints its text, for example:

```
Failed to start run on Pi: Transport contract check failed; refusing to start.
stm32-data-reader: transport contract mismatch: stm32-data-reader 58 uses contract
1111111111111111 (transport v68), bundle 2026.11.02 expects 93ac36836810c9fe
(transport v69); update or reflash so all components match
```

Calibration commands are refused the same way. A stale status file of a *run-scoped* process (`raccoon-lib` from an earlier run) never blocks, otherwise a run could not start again after you fixed the cause; a *service* that refused (reader, Bot UI, server) keeps blocking until it starts again.

### `raccoon connect`

One red line when the Pi's contract is broken (`Runs will be refused; see raccoon doctor`) and a yellow line in dev mode.

## Fixing a mismatch

1. `raccoon doctor` — which component, which hash.
2. `raccoon update` — brings all components and the bundle file to one bundle and restarts the services.
3. If the robot is badly out of sync or `raccoon-server` is down: **flash the latest raccoon image**. There is no separate repair route.

Do not "fix" it by editing `/etc/raccoon-bundle.json`; it describes the bundle, it does not select one.

## Dev mode

To test your own transport build on the robot, set `contract_hash` in `/etc/raccoon-bundle.json` **by hand** to the literal `dev`.

- The components still start, run their check and write status files, but a difference is only a **warning**.
- There is no hash to compare against, so `raccoon doctor` instead warns when the *running* components report different hashes.
- It is visible everywhere: a line in `raccoon doctor`, a yellow warning line at every `raccoon run`, a **DEV TRANSPORT** badge in the Bot UI.
- You are responsible that every component was rebuilt against your transport (C++ links it statically).
- No workflow ever writes `dev`, and **no image is ever built from a bundle with `dev`**. The next normal `raccoon update` replaces it with the release bundle's hash.

You can also write `dev` into a **single component's entry** in `components` (for example `"stm32-data-reader": "dev"`). That omits only the version comparison for that component; the contract is still checked. `raccoon doctor`, `raccoon connect` and every `raccoon run` warn which components skip their version check (*Version check omitted for stm32-data-reader*), the component logs the same, and the Bot UI shows the DEV TRANSPORT badge. A `dev` contract does not excuse a wrong version either — the two are independent. The dev bundle `bundles/dev.json` (`raccoon update --dev`) is unrelated: it has no transport field and is not checked.

## Status file reference

`/run/raccoon/<component>.json` (a tmpfs directory, emptied on reboot; each component writes only its own file, atomically):

| Field | Meaning |
|-------|---------|
| `component`, `component_version` | who, and which version |
| `own_hash`, `own_transport_version` | what the component was built with |
| `expected_hash`, `expected_transport_version`, `expected_component_version`, `bundle` | what the bundle file says (`null` if it could not be read) |
| `result`, `reason`, `message` | the result from the table, a machine-readable reason (`file-missing`, `file-unreadable`, `field-missing`, `field-empty`, `version-field-missing`, `version-field-empty`, `version-omitted`) and the full text |
| `timestamp`, `pid`, `pid_starttime` | when, and which process (a reused PID does not count as the same process) |
| `persistent` | `true` for services that keep running |

The Pi server serves the aggregate at `GET /api/v1/contract` (see [raccoon-server]({{< ref "16-raccoon-server" >}})).

## Exit code 78

A component that refuses to start exits with **78**. systemd units of long-running components set `RestartPreventExitStatus=78`; otherwise a refusing service would be restarted every few seconds and flood the journal.

## For maintainers

How the hash is computed, where it is checked in the image build and how a release is made: [Releases]({{< ref "/07-releases" >}}).
