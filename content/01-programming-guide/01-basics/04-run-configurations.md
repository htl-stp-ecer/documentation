---
title: "Run Configurations"
author: "Raccoon Docs Team, Mario Scholze"
date: 2026-11-19
draft: false
weight: 40
description: "Named bundles of raccoon run flags declared in raccoon.project.yml: the builtin presets, all fields, and how to add your own."
---

# Run Configurations

A *run configuration* is a named bundle of `raccoon run` flags and environment variables stored in your project. It works like a PyCharm run configuration: pick a name and get a fixed set of options.

During development you constantly switch between very different modes:

- **Competition:** full calibration, wait-for-light start, all checkpoints active. Correct for the competition, but painful when iterating, because every run needs a calibration drive and a light trigger.
- **Dev:** button start, stored calibration, checkpoint waiting skipped. Fast feedback, but you must not forget to switch back before the competition.

Without run configurations you type `--dev --no-calibrate --no-checkpoints` every time and risk forgetting a flag. With them you name the mode once in YAML and call it by name:

```bash
raccoon run              # same as raccoon run default
raccoon run dev
raccoon run competition  # a configuration you defined
```

The names are case-insensitive (`raccoon run Dev` works). The configurations are shared with the WebIDE: one you create there is available in the terminal, and the other way around. See [Run Configurations in the WebIDE]({{< ref "/04-web-ide/11-run-configurations.md" >}}) for the dialog.

## Builtin presets

Three presets exist in every project, even without a `run_configurations:` section:

| Name | Equivalent flags | Purpose |
|------|-----------------|---------|
| `default` | (none) | Standard run: codegen, calibrate, checkpoints. Uses the robot if one is connected |
| `dev` | `--dev --no-calibrate --no-checkpoints` | Fast iteration: button start, skip calibration, skip checkpoint waiting |
| `simulated` | `target: simulated` | Run the project under the libstp simulator. **Only the WebIDE uses this.** `raccoon run simulated` does not start the simulator; it runs like `auto` |

## Defining your own

Add a `run_configurations:` block to `raccoon.project.yml`:

```yaml
run_configurations:
  competition:
    description: "Competition: full run with all systems active"
    target: remote
    record_localization: true
    record_hz: 30

  dev-fast:
    description: "Dev: button start, skip calibration and checkpoints"
    dev: true
    no_calibrate: true
    no_checkpoints: true

  tune:
    description: "Long tuning session on the robot"
    target: remote
    no_checkpoints: true
    env:
      RACCOON_SHUTDOWN_IN: "900"
```

An entry with the name of a builtin replaces that builtin. Real bots keep the block in its own file and include it from the root config:

```yaml
# raccoon.project.yml
run_configurations: !include config/run-configurations.yml
```

### Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `description` | string | `""` | Shown when the configuration activates, and as the tooltip in the WebIDE |
| `target` | string | `auto` | Where to run, see below |
| `dev` | bool | `false` | Dev mode: a button press instead of wait-for-light starts a mission |
| `no_calibrate` | bool | `false` | Skip calibration steps; use stored values |
| `no_checkpoints` | bool | `false` | Skip time-checkpoint waiting (`wait_for_checkpoint` steps return immediately) |
| `debug` | bool | `false` | Debug mode: `breakpoint()` steps pause and wait for a button press |
| `no_codegen` | bool | `false` | Skip code generation |
| `no_sync` | bool | `false` | Skip the sync to the robot before a remote run |
| `record_localization` | bool | `false` | Record the particle filter state for [replay]({{< ref "/04-web-ide/12-localization-replay.md" >}}) |
| `record_hz` | float | `null` | Sample rate of that recording (20 Hz if empty) |
| `profile` | bool | `true` | Step profiling. Set `false` to switch it off for this configuration |
| `args` | list of strings | `[]` | Extra arguments, put in front of the ones you type on the command line |
| `env` | mapping | `{}` | Environment variables for the program |

Unknown keys are ignored, and a wrong `target` or a non-list `args` is an error.

### Target values

| Value | Meaning |
|-------|---------|
| `auto` | Use the robot if one is connected, otherwise run locally |
| `local` | Always run locally |
| `remote` | Always run on the connected robot |
| `simulated` | WebIDE only: run under the simulator |

## Command line flags and configurations

A configuration is the starting point, and the flags you type are added on top:

```bash
raccoon run dev --no-m030    # the dev flags, plus skip mission M030
```

- **Flags add, they do not subtract.** `dev`, `no_calibrate` and the other switches are combined with your flags. You cannot turn a switch off from the command line. Use another configuration for that.
- **`target: local` and `target: remote` win over `--local`.** `raccoon run competition --local` still runs remotely if `competition` has `target: remote`.
- **`record_hz`:** a `--record-hz` on the command line beats the value of the configuration.
- **`--no-mXXX` only works on the command line.** Writing it into `args` does not skip a mission, because `raccoon run` reads these flags before it merges the configuration. See [raccoon run]({{< ref "/03-raccoon-cli/05-run.md" >}}).

## Environment variables as feature flags

`env:` is a good place for feature flags. A competition bot switches between real and fake camera without touching the mission code:

```yaml
run_configurations:
  dev:
    description: "Fast iteration"
    dev: true
    no_checkpoints: true

  dev-fake:
    description: "Fast iteration with the fake camera service"
    dev: true
    no_checkpoints: true
    env:
      DRUMBOT_FAKE_CAMERA: "1"
```

```python
import os

if os.getenv("DRUMBOT_FAKE_CAMERA") == "1":
    install_fake_color_service(robot)
```

`raccoon run dev-fake` swaps the whole camera subsystem, with no code change.

## Hiding builtin presets

If a builtin does not apply to your project (you never use the simulator, for example), hide it:

```yaml
hidden_run_configurations:
  - simulated
```

It disappears from the CLI and from the WebIDE dropdown. To restore it, remove the name from the list, or add an entry with the same name under `run_configurations:`. Removing a builtin in the WebIDE writes this list for you.

## Tips

- Set `record_localization: true` on your `competition` configuration so every real run records a replay file.
- Add `no_codegen: true` to a configuration when you know the code has not changed.
- Each developer on a team can add their own configurations without conflicts, because they are just keys under `run_configurations:`.

## Related pages

- [raccoon run]({{< ref "/03-raccoon-cli/05-run.md" >}}): all run flags and `--no-mXXX`
- [Run Configurations in the WebIDE]({{< ref "/04-web-ide/11-run-configurations.md" >}}): the dialog
- [Create your project]({{< ref "/00-getting-started/03-create-a-project.md" >}})
