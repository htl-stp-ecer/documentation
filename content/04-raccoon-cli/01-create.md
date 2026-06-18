---
title: "create"
author: "Florian Schwanzer"
date: 2026-06-18
draft: false
weight: 2
---

# raccoon create

Create can be used to either create an entirely new project or a mission for an project.

---

## raccoon create project

```bash
raccoon create project <name>
raccoon create project <name> --path /path/to/parent/dir
raccoon create project <name> --no-wizard
```

- Scaffolds a complete project directory,
- initializes a local git history
- and unless `--no-wizard` is passed — immediately launches the setup wizard to configure hardware.

### Options

| Option | Default | Description                                                                                   |
|--------|---------|-----------------------------------------------------------------------------------------------|
| `--path PATH` | current directory | Parent directory in which to create the project folder                                        |
| `--no-wizard` | off | Skip the setup wizard. Run `raccoon wizard` later to configure the project. (Not recommended) |

### What it does

1. Creates a new directory `<name>` at the target path
2. Clones the example repository `htl-stp-ecer/raccoon-example` from GitHub at the matching version tag (requires internet access and `git` on your PATH)
3. Assigns a unique UUID to the project in `raccoon.project.yml` and patches the project name
4. Initializes a local git repository with an initial snapshot commit
5. Unless `--no-wizard`: prompts for a Pi connection and launches the [setup wizard]({{< ref "/04-raccoon-cli" >}})

> **Internet access required.** `raccoon create project` clones a remote repository. If the matching version tag is not yet published, it falls back to cloning the default branch of the example repo.

### Generated project structure

```
<name>/
├── config/
│   ├── connection.yml        # Pi address, port, SSH user
│   ├── hardware.yml          # Hardware definitions (motors, servos, sensors)
│   ├── missions.yml          # Ordered list of missions to run
│   ├── motors.yml            # Per-motor port and calibration settings
│   ├── robot.yml             # Drivetrain, odometry, motion PID, physical dims
│   └── servos.yml            # Servo port and named-position settings
├── src/
│   ├── __init__.py
│   ├── main.py               # Entry point — instantiates Robot and calls start()
│   ├── hardware/
│   │   └── __init__.py       # Populated by raccoon codegen
│   ├── missions/
│   │   ├── __init__.py
│   │   └── setup_mission.py  # Pre-built setup mission (calibrate + wait for button)
│   └── steps/
│       └── __init__.py       # Place for reusable step helpers
├── run.sh                    # Convenience script for local execution
├── upload.sh                 # Convenience script for uploading to the robot
├── raccoon.project.yml       # Main project config — name, UUID, includes
├── .gitignore
└── .raccoonignore            # Files excluded from raccoon sync
```

### Config files

**`raccoon.project.yml`** — the root config file that raccoon reads for every command. It contains the project name and UUID, and pulls in the four subsections via YAML includes:

```yaml
name: MyRobot
uuid: 3f2a1b9c-...

robot:       !include 'config/robot.yml'
missions:    !include 'config/missions.yml'
definitions: !include 'config/hardware.yml'
connection:  !include 'config/connection.yml'
```
---

**`config/connection.yml`** — stores the Pi's IP address, port, and SSH username. Written automatically by `raccoon connect`.

---

**`config/hardware.yml`** — lists every hardware component (motors, servos, IMU, sensors). The `_motors` and `_servos` keys merge in the separate `motors.yml` and `servos.yml` files.

---

**`config/motors.yml`** — one entry per drive motor with port, inversion flag, and calibration data (ticks-to-radians conversion, velocity low-pass filter alpha). Populated by `raccoon wizard` and `raccoon calibrate`.

---

**`config/robot.yml`** — drivetrain kinematics (type, wheel radius, wheelbase), per-axis velocity PID/feedforward controllers, odometry type, motion PID tuning, and the robot's physical dimensions and start pose.

---

**`config/missions.yml`** — the ordered list of missions the robot executes. Entries can include an optional mode key:

```yaml
- SetupMission: setup
- M010DriveToConeMission
- M020CollectConeMission
```

**`config/servos.yml`** — servo port assignments and named positions (e.g. `up: 30`, `down: 160`). Commented-out examples are included in the scaffold.

### Example

```bash
raccoon create project ConeBot
# Clones the example repo, patches name/UUID, initializes git, launches wizard

raccoon create project ConeBot --path ~/robots
# Creates ~/robots/ConeBot/

raccoon create project ConeBot --no-wizard
# Clones and patches only — run 'cd ConeBot && raccoon wizard' to configure later
```

> The exact file structure cloned from the example repository matches the version of raccoon you have installed. If the matching git tag is not yet published (e.g. on a pre-release build), raccoon falls back to the default branch of `htl-stp-ecer/raccoon-example`.

---

## raccoon create mission

```bash
raccoon create mission <name>
```

Must be run from inside a project directory (any subdirectory works — raccoon searches upward for `raccoon.project.yml`).

### What it does

1. Converts the name to `snake_case` and `PascalCase`
2. Creates `src/missions/<snake_case>_mission.py` from the mission template
3. Appends the mission class name to the `missions` list in `config/missions.yml`
4. Inserts the corresponding import into `src/main.py`

### Generated mission file

```python
from raccoon import *

from src.hardware.defs import Defs


class DriveToConeMission(Mission):
    def sequence(self) -> Sequential:
        return seq([])
```

Fill in the `seq([...])` body with raccoon steps. See the [Steps documentation]({{< ref "/02-programming/04-steps" >}}) for available steps.

### Naming conventions

raccoon accepts any casing — `PascalCase`, `kebab-case`, or `snake_case` — and normalises it automatically:

| Input | Class name | File |
|-------|-----------|------|
| `DriveToZone` | `DriveToZoneMission` | `drive_to_zone_mission.py` |
| `drive-to-zone` | `DriveToZoneMission` | `drive_to_zone_mission.py` |
| `drive_to_zone` | `DriveToZoneMission` | `drive_to_zone_mission.py` |

The `Mission` suffix is added automatically. If you accidentally include it in the name (e.g. `DriveToZoneMission`), raccoon strips the duplicate and prints a note.

**Recommended: use an `M##` prefix** to encode the execution order directly in the name. This keeps both the class names and filenames self-documenting:

```bash
raccoon create mission M010DriveToZone
raccoon create mission M020CollectSamples
raccoon create mission M030ReturnToBase
```

This produces:

```
src/missions/
├── m010_drive_to_zone_mission.py     → class M010DriveToZoneMission
├── m020_collect_samples_mission.py   → class M020CollectSamplesMission
└── m030_return_to_base_mission.py    → class M030ReturnToBaseMission
```

And in `config/missions.yml`:

```yaml
- SetupMission: setup
- M010DriveToZoneMission
- M020CollectSamplesMission
- M030ReturnToBaseMission
```

> The `M000` slot is reserved by convention for the setup mission that ships with every new project.

### Example

```bash
cd ConeBot

raccoon create mission M010DriveToGate
# Created: src/missions/m010_drive_to_gate_mission.py
# Added:   M010DriveToGateMission to config/missions.yml
# Imported in src/main.py

raccoon create mission M020CollectBall
# Created: src/missions/m020_collect_ball_mission.py
```
