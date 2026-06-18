---
title: "Run Configurations"
author: "Raccoon Docs Team"
date: 2026-06-18
draft: false
weight: 14
description: "Named bundles of raccoon run flags declared in raccoon.project.yml, including the three builtin presets and how to add your own."
---

# Run Configurations

A *run configuration* is a named bundle of `raccoon run` flags and environment variables stored in your project. It works like a PyCharm run configuration: pick a name and get a fixed set of options automatically.

```bash
raccoon run dev          # activates the "dev" configuration
raccoon run simulated    # activates the "simulated" configuration
raccoon run competition  # activates a user-defined configuration
```

## Why run configurations exist

During a typical project you switch repeatedly between a few execution modes:

- Full run with calibration and light-sensor start (competition mode)
- Fast iteration with button start and no calibration (dev mode)
- Simulator run without touching the robot at all

Without run configurations you have to remember and type multiple flags every time (`--dev --no-calibrate --no-checkpoints`). With configurations, you name the mode once and refer to it by name.

## Builtin presets

Three configurations are always available, even for projects with no explicit `run_configurations:` section:

| Name | Equivalent flags | Purpose |
|------|-----------------|---------|
| `default` | (none) | Standard run: codegen + calibrate + wait-for-light start |
| `dev` | `--dev --no-calibrate --no-checkpoints` | Fast iteration: button start, skip calibration, skip checkpoint waiting |
| `simulated` | `target: simulated` | Run under the libstp simulator on the laptop |

```bash
raccoon run           # same as raccoon run default
raccoon run dev
raccoon run simulated
```

## Defining custom configurations

Add a `run_configurations:` block to `raccoon.project.yml`:

```yaml
run_configurations:
  competition:
    description: "Competition: full run with all systems active"
    target: remote
    dev: false
    no_calibrate: false

  dev-fast:
    description: "Dev: button start, skip calibration and checkpoints"
    dev: true
    no_calibrate: true
    no_checkpoints: true

  record:
    description: "Dev with localization recording enabled"
    dev: true
    no_calibrate: true
    no_checkpoints: true
    record_localization: true
    record_hz: 10.0

  camera-test:
    description: "Skip setup mission, run only the camera mission"
    dev: true
    no_calibrate: true
    args:
      - "--verbose"
    env:
      CAMERA_DEBUG: "1"
```

## Configuration fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `description` | string | `""` | Human-readable description shown when the configuration activates |
| `target` | string | `"auto"` | Execution target: `"auto"` (Pi if connected, else local), `"local"`, `"remote"`, or `"simulated"` |
| `dev` | bool | `false` | Dev mode: uses button press instead of wait-for-light to start a mission |
| `no_calibrate` | bool | `false` | Skip calibration steps; use stored calibration values |
| `no_checkpoints` | bool | `false` | Skip time-checkpoint waiting (wait_for_checkpoint steps return immediately) |
| `debug` | bool | `false` | Enable debug mode: breakpoint() steps pause and wait for a button press |
| `no_codegen` | bool | `false` | Skip code generation (rarely used directly) |
| `no_sync` | bool | `false` | Skip the pre-run push sync |
| `record_localization` | bool | `false` | Record particle filter state to `.raccoon/runs/<ts>/localization.jsonl` |
| `record_hz` | float | `null` | Localization recorder downsample rate (default 20 Hz if `record_localization` is true) |
| `args` | list of strings | `[]` | Extra command-line arguments forwarded to `src/main.py` |
| `env` | mapping of strings | `{}` | Extra environment variables forwarded to the program process |

## How CLI flags interact with configurations

CLI flags always win over configuration defaults. This lets you use a configuration as a starting point and override individual settings:

```bash
# "dev" config sets --dev and --no-calibrate, but add --no-m0 on top
raccoon run dev --no-m0

# "competition" config uses remote target, but force local for testing
raccoon run competition --local
```

The name matching is case-insensitive:

```bash
raccoon run Dev     # works the same as raccoon run dev
raccoon run DEV     # also works
```

## Hiding builtin presets

If a builtin preset does not apply to your project (e.g. you never use the simulator), you can remove it from the CLI and Web-IDE dropdowns using the `hidden_run_configurations:` key:

```yaml
hidden_run_configurations:
  - simulated
```

The hidden preset disappears from both `raccoon run <name>` tab-completion and the Web-IDE run configuration dialog. To restore it, either remove its name from `hidden_run_configurations:` or add a user-defined entry with the same name (which un-hides it automatically).

## Run configurations in the Web-IDE

The Web-IDE run configuration dialog reads from the same `raccoon.project.yml` source. When you open a project in the Web-IDE and click the run button, a dropdown shows all active configurations (builtin presets plus user-defined ones). Selecting one sets the run flags in the IDE the same way the CLI would interpret them.

Changes made to configurations in the Web-IDE are written back to `raccoon.project.yml` and are immediately visible to the CLI.

## Example: full project YAML with run configurations

```yaml
name: ConeBot
uuid: abc12345-...

robot:
  drivetrain: diff

run_configurations:
  competition:
    description: "Competition run"
    target: remote

  dev:
    description: "Fast dev iteration"
    dev: true
    no_calibrate: true
    no_checkpoints: true

  record:
    description: "Dev with localization recording"
    dev: true
    no_calibrate: true
    no_checkpoints: true
    record_localization: true
    record_hz: 10.0

hidden_run_configurations:
  - simulated
```

In this project:

```bash
raccoon run            # uses the builtin "default" config (unchanged)
raccoon run dev        # uses the overridden "dev" config above
raccoon run competition
raccoon run record
raccoon run simulated  # error: hidden
```
