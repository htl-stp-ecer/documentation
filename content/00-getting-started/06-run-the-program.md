---
title: "Run the program"
author: "Tobias Madlberger, Mario Scholze"
date: 2026-11-15
draft: false
weight: 60
description: "Run the project with raccoon run and drive a first smoke-test mission."
---

# Run the program

## Create a mission

To check that your motors and wiring are right, create a small test mission:

```bash
raccoon missions create M010TestMission
```

Mission names use a **three-digit** zero-padded prefix. `M000` is reserved for the setup mission, `M999` for shutdown, and regular missions start at `M010` and increment by 10 (`M010`, `M020`, `M030`, …) so that later you can insert missions (like if you wanna insert one before M010, just use the M005 prefix. This will order it before M010.

Open the generated file in `src/missions/m010_test_mission.py` and add a simple sequence:

```python
from raccoon import *
from src.hardware.defs import Defs

class M010TestMission(Mission):
    def sequence(self) -> Sequential:
        return seq([
            drive_forward(30),   # drive 30 cm forward
            turn_right(90),      # turn 90° right
        ])
```

Run it:

```bash
raccoon run
```

This does everything in one command:
1. Saves a local checkpoint (safety snapshot)
2. Runs code generation **locally on your laptop** (generates `defs.py` and `robot.py` from your YAML config)
3. Syncs your files (including the generated ones) to the robot
4. Executes `src/main.py` on the robot, streaming output to your terminal
5. Pulls any files updated on the robot back to your laptop

You should see the robot boot and run the setup mission. Press **Ctrl+C** to stop.

### When the program is running

You should see the robot asking for a calibration on the BotUI.

Place the robot so that it can drive forward for 50cm, measure how far it went and input that distance into the prompt that comes after it drives.

Then, The robot should drive forward and turn. Distance and straightness may be off — that's fine for now. What matters is that it moves in the right direction.

---

### Common Issues

**If it doesn't move at all:** check `config/motors.yml` — are the port numbers correct? <br>
**If it turns instead of driving straight:** check `config/motors.yml` — are the motor's `inverted` attributes correct?
