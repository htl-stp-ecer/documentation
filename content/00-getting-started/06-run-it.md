---
title: "Run It and Test Basic Motion"
author: "Tobias Madlberger, Mario Scholze"
date: 2026-11-15
draft: false
weight: 60
description: "Run the project with raccoon run and drive a first smoke-test mission."
---

# Run It and Test Basic Motion

## Run it

```bash
raccoon run
```

This does everything in one command:
1. Saves a local checkpoint (safety snapshot)
2. Runs code generation **locally on your laptop** — generates `defs.py` and `robot.py` from your YAML config
3. Syncs your files (including the generated ones) to the robot
4. Executes `src/main.py` on the robot, streaming output to your terminal
5. Pulls any files updated on the robot back to your laptop

You should see the robot boot and run the setup mission. Press **Ctrl+C** to stop.

The example project already ships with a few demo missions (`M010NavigateToObject`, `M020CollectObject`, `M030DeliverObject`), so the robot will move on after setup. If you'd rather start from a clean slate, remove them from `config/missions.yml`; the robot will then warn `Robot does not have any missions attached` and just wait — that's expected.

## Test basic motion

To check that your motors and wiring are right, create a small smoke test mission:

```bash
raccoon missions create M010SmokeMission
```

Mission names use a **three-digit** zero-padded prefix. `M000` is reserved for the setup mission, `M999` for shutdown, and regular missions start at `M010` and increment by 10 (`M010`, `M020`, `M030`, …).

Open the generated file in `src/missions/m010_smoke_mission.py` and add a simple sequence:

```python
from raccoon import *


class M010SmokeMission(Mission):
    def sequence(self) -> Sequential:
        return seq([
            drive_forward(30),   # drive 30 cm forward
            turn_right(90),      # turn 90° right
        ])
```

Then register it in `config/missions.yml` (keep the setup and shutdown entries; comment out or remove the demo missions while testing):

```yaml
- M000SetupMission: setup
- M010SmokeMission
- M999ShutdownMission: shutdown
```

Run it:

```bash
raccoon run
```

The robot should drive forward and turn. Distance and straightness may be off — that's fine for now. What matters is that it moves in the right direction.

**If it doesn't move at all:** check `config/motors.yml` — are the port numbers correct, and is `inverted` set correctly for each motor?

→ See [Missions]({{< ref "/01-programming-guide/01-basics/06-missions.md" >}}) and [Steps]({{< ref "/01-programming-guide/01-basics/07-steps-dsl.md" >}}) for the full API.

## A real first mission from a competition robot

The examplebot (a real competition entry) uses this exact pattern for a simple three-mission run. Its setup mission homes the arm, calibrates sensors, and waits for the light — all in one method:

```python
from raccoon import *
from src.hardware.defs import Defs


class M000SetupMission(SetupMission):
    def sequence(self) -> Sequential:
        return seq([
            # Home hardware to known starting positions
            Defs.arm_servo.up(),
            Defs.claw_servo.open(),

            # Calibrate distance accuracy and IR sensors.
            # distance_cm=50 gives more accurate results than the default 30 cm.
            calibrate(distance_cm=50),

            # wait_for_light() is injected automatically by SetupMission
            # after sequence() returns — do not call it here.
        ])
```

The robot then drives, grabs an object, and returns — building up from `drive_forward` to `parallel()` and `.until()` stop conditions. When you are ready to build a real mission sequence, the [Programming Guide]({{< ref "/01-programming-guide/_index.md" >}}) has everything.

---

**Next:** [How Raccoon works](/00-getting-started/07-how-raccoon-works/)
