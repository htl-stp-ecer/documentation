---
title: "Config Structure"
author: "Tobias Madlberger, Mario Scholze"
date: 2026-11-24
draft: false
weight: 30
description: "What each config file contains, which ones you edit and which ones the tools manage."
---

# Config Structure

The robot is described in YAML. `raccoon codegen` turns that YAML into the Python classes your missions import (`Defs` and `Robot`), see [Code Generator]({{< ref "/01-programming-guide/01-basics/05-code-generator.md" >}}). The config is not read while the robot runs: the YAML is the source of truth and the generated Python is the output.

## Files

```
raccoon.project.yml              root file, includes everything below
  ├── config/robot.yml           drivetrain, motion tuning, physical size
  ├── config/missions.yml        ordered mission list
  ├── config/hardware.yml        sensors, sensor groups
  │   ├── config/motors.yml      motors        (!include-merge)
  │   └── config/servos.yml      servos        (!include-merge)
  └── config/connection.yml      how to reach the robot
```

`raccoon.project.yml` is the root. It uses `!include` to hand each top-level key to one of the files in `config/`. `hardware.yml` in turn merges `motors.yml` and `servos.yml` with `!include-merge`, so all hardware ends up in one flat namespace. How includes work is explained [below](#includes).

| File | Contains | You edit it? |
|------|----------|--------------|
| `raccoon.project.yml` | Project `name`, `uuid`, `format_version`, the includes and the optional `simulation:` block | Rarely |
| `config/hardware.yml` | Sensors and sensor groups. See [hardware.yml]({{< ref "/01-programming-guide/04-sensors/01-hardware-yml.md" >}}) | Yes |
| `config/motors.yml` | Motors. See [Motor config]({{< ref "/01-programming-guide/03-actors/02-motors/01-motor-config.md" >}}) | Yes |
| `config/servos.yml` | Servos and their positions. See [Servos in servos.yml]({{< ref "/01-programming-guide/03-actors/01-servos/01-servos-yml.md" >}}) | Yes |
| `config/robot.yml` | Drive kinematics, motion PID, physical dimensions, `shutdown_in`. See [robot.yml Reference]({{< ref "/06-advanced/06-motion-and-localization/06-robot-yml.md" >}}) | Set it up once, then leave it. The calibration commands and [auto-tuning]({{< ref "/06-advanced/06-motion-and-localization/01-drive-system.md" >}}) tune values in it |
| `config/missions.yml` | The mission list | No, `raccoon mission` manages it |
| `config/connection.yml` | Address and port of the robot | No, `raccoon connect` saves it |
| `racoon.calibration.yml` | Values measured by calibration | No, written by calibration |

Some keys are written by the CLI and the calibration steps (`ticks_to_rad`, `offset`, the autotune values). Do not edit them by hand unless you know the exact value.

## Includes

The root file hands its sections to other files with two YAML tags:

- `!include 'config/robot.yml'` replaces the value with the content of that file.
- `!include-merge 'motors.yml'` merges the top-level keys of that file into the surrounding mapping. This is how `hardware.yml` shows motors, servos and sensors as one flat list.

```yaml
# config/hardware.yml
button:
  type: DigitalSensor
  port: 10

_motors: !include-merge 'motors.yml'
_servos: !include-merge 'servos.yml'
```

The key of an `!include-merge` line is dropped. The leading `_` is only a convention that marks it as a merge anchor and not as a piece of hardware. Includes can be nested, up to 20 levels deep.

Tools that write values, such as the calibration commands, update the file that owns the value (for example `motors.yml`) and keep the include tags as they are.

## `raccoon.project.yml`

| Key | Type | Description |
|-----|------|-------------|
| `name` | `string` | Project name, shown in the CLI and the WebIDE. Set once when the project is created. |
| `uuid` | `string` | Unique project id (UUID v4). The raccoon daemon uses it to find the project on the robot. Never change it. |
| `format_version` | `integer` | Schema version of the project file. Written by `raccoon migrate`. `raccoon run` compares it with the version the installed raccoon-lib requires and refuses to run an older project until you run `raccoon migrate`. |
| `robot` | `!include` | `config/robot.yml` |
| `missions` | `!include` | `config/missions.yml` |
| `definitions` | `!include` | `config/hardware.yml` |
| `connection` | `!include` | `config/connection.yml` |
| `simulation` | `mapping` | Optional, see below |
| `validation` | `mapping` | Optional limits for the style checks of `raccoon validate`, see below |

### `simulation:` (optional)

Configures the Web-IDE simulator that runs when you use the `simulate=real` run configuration. When this block is absent, the simulator uses an empty table scene and falls back to `robot.physical.start_pose` for the starting position.

```yaml
simulation:
  scene: empty_table.ftmap          # path to a .ftmap file (project-relative or absolute)
  start_pose:                       # overrides robot.physical.start_pose for simulation only
    x_cm: 0.0
    y_cm: 0.0
    theta_deg: 0.0
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `simulation.scene` | `string` | *(empty table)* | Path to a `.ftmap` file used as the simulation arena. Can be project-relative or absolute. |
| `simulation.start_pose.x_cm` | `float` | from `physical.start_pose.x_cm` | Simulation-only starting X position (cm). Overrides `physical.start_pose` for simulation runs only. |
| `simulation.start_pose.y_cm` | `float` | from `physical.start_pose.y_cm` | Simulation-only starting Y position (cm). |
| `simulation.start_pose.theta_deg` | `float` | from `physical.start_pose.theta_deg` | Simulation-only starting heading (degrees). |

This block is intentionally separate from `physical.start_pose` so you can place the robot at a different starting position in simulation without affecting real-robot runs.

### `validation:` (optional)

Sets how strict the mission style checks of [`raccoon validate`]({{< ref "/03-raccoon-cli/12-validate.md" >}}#mission-style-checks) are. Without this block the defaults apply.

```yaml
validation:
  max_mission_steps: 25
  check_mission_comments: true
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `validation.max_mission_steps` | `integer` | `25` | Maximum number of steps in a mission's `seq([...])`. Longer missions produce a warning, and so does a limit above 75. |
| `validation.check_mission_comments` | `bool` | `true` | Warns about more than six steps in a row without a comment. |

## `raccoon.formatting.yml`

An optional file next to `raccoon.project.yml` that switches on and configures `raccoon format`. Projects without it are not formatted. See [format]({{< ref "/03-raccoon-cli/19-format.md" >}}) for all options.

## `config/missions.yml`

An ordered list of the missions to run. The order in this file is the order the missions run in. Create and reorder missions with `raccoon mission`, see [Missions]({{< ref "/01-programming-guide/01-basics/07-missions.md" >}}).

**Normal mission** (runs in sequence with others):

```yaml
- MyMission
```

**Typed mission** (dict with a single key):

```yaml
- SetupMission: setup
- AnotherMission: normal
- TeardownMission: shutdown
```

The value is one of three strings:

| Type | Description |
|------|-------------|
| `normal` | Added to `Robot.missions` list. Presented to the user for selection at runtime. |
| `setup` | Assigned to `Robot.setup_mission`. Runs automatically before any normal mission is selected. Only one setup mission is allowed; if multiple are listed, the last one wins. |
| `shutdown` | Assigned to `Robot.shutdown_mission`. Runs automatically after the program ends (timeout or explicit shutdown). |

If a bare string entry (without a type key) is used, it is treated as `normal`.

Each mission class name is converted to snake_case to derive the source filename. `DriveToBoxMission` → `src/missions/drive_to_box_mission.py`.

To disable a mission for one run, comment it out with `#`. The source file stays untouched.

## `config/connection.yml`

Controls how `raccoon` reaches the robot. `raccoon connect` saves the connection here.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `pi_address` | `string` | `192.168.4.1` | IP address or hostname of the Wombat controller. When connected to the Wombat's Wi-Fi hotspot, the default `192.168.4.1` is correct. |
| `pi_port` | `integer` | `8421` | TCP port on which the raccoon daemon (`raccoon server`) is listening on the Pi. |
| `pi_user` | `string` | `pi` | SSH username used for SFTP file transfers. |
| `remote_path` | `string` | *(empty)* | Absolute path on the Pi where the project is deployed. When empty, raccoon uses a default path derived from the project UUID. |
| `auto_connect` | `bool` | `true` | When `true`, Raccoon CLI commands that require a connection (`run`, `sync`, `calibrate`, etc.) will attempt to connect automatically without prompting. Set to `false` to always require an explicit `raccoon connect`. |

## Where the rest is documented

| What | Page |
|------|------|
| The generated `Defs` and `Robot` classes | [Code Generator]({{< ref "/01-programming-guide/01-basics/05-code-generator.md" >}}) and [Robot Definition]({{< ref "/01-programming-guide/01-basics/06-robot-definition.md" >}}) |
| Flags for `raccoon run` | [Run Configurations]({{< ref "/01-programming-guide/01-basics/04-run-configurations.md" >}}) |
