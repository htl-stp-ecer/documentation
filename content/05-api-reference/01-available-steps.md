---
title: "Available Steps"
author: "Tobias Madlberger"
date: 2026-06-18
draft: false
weight: 1
---

# Available Steps

Steps are the atomic building blocks of every `raccoon` robot program. You compose them into sequences, parallel groups, and loops inside a `Mission.sequence()` method. The catalog below covers all **110** public steps currently in the library, grouped by category and searchable by name, tag, or description.

## How to import steps

All steps are re-exported from the top-level `raccoon` package. The simplest approach is a star import at the top of every mission file:

```python
from raccoon import *
```

This is the recommended pattern for mission code. It brings in every step factory, the `Mission` and `SetupMission` base classes, `seq()`, `parallel()`, and all other DSL helpers.

If you prefer explicit imports, every step can also be imported from its specific module path:

```python
from raccoon.step.motion import drive_forward, turn_right, drive_arc_left, drive_arc_right
from raccoon.step.motion import mark_heading_reference, turn_to_heading_left, turn_to_heading_right
from raccoon.step.motor import set_motor_power, set_motor_velocity, set_motor_dps
from raccoon.step.motor import motor_brake, motor_off, motor_passive_brake
from raccoon.step.motor import move_motor_relative, move_motor_to
from raccoon.step.calibration import calibrate
from raccoon.step.timing import wait_for_checkpoint
```

> **Important — removed steps:** The step `drive_arc(radius_cm, degrees, speed)` and the step `turn_to_heading(degrees)` no longer exist. They were replaced by explicit directional variants. Use `drive_arc_left` / `drive_arc_right` instead of `drive_arc`, and `turn_to_heading_left` / `turn_to_heading_right` instead of `turn_to_heading`.

## Quick usage example

```python
from raccoon import *


class M010DriveMission(Mission):
    def sequence(self) -> Sequential:
        return seq([
            # Drive and turn
            drive_forward(30),
            turn_right(90),

            # Arc moves — always explicit about direction
            drive_arc_left(radius_cm=20, degrees=90),

            # Absolute heading with mark_heading_reference
            mark_heading_reference(),
            # ... robot drives around ...
            turn_to_heading_right(180),  # face 180° from origin

            # Follow a line until black
            drive_forward(50).until(on_black(Defs.front.right)),
        ])
```

## Step categories

Steps are tagged with one or more category labels. The interactive catalog below lets you filter by tag or search by name. Common categories:

| Tag | What it covers |
|-----|----------------|
| `motion` | Drive, turn, strafe, arc, path planning, wall alignment, line following |
| `motor` | Individual motor control — power, velocity, DPS, position, brake |
| `servo` | Servo angle and preset steps |
| `calibration` | Distance calibration, IR calibration, auto-tune, BEMF characterization |
| `control` | Loops, timeouts, background steps, conditional logic (`if_then`) |
| `timing` | Checkpoint-based synchronisation between two robots |
| `watchdog` | Hardware watchdog for safety-critical motions |
| `sensor` | Sensor-triggered motion steps |
| `localization` | Resync steps — realign odometry using wall, line, or start pose |
| `logic` | Environment gates (`run_if_debug`, `run_unless_no_calibrate`, etc.) |

## Heading reference steps

The heading reference system lets you make absolute turns regardless of how the robot has moved between steps.

| Step | Description |
|------|-------------|
| `mark_heading_reference(origin_offset_deg=0.0, positive_direction="left")` | Captures the current IMU heading as a reference origin. `origin_offset_deg` shifts the reference; `positive_direction` controls which way positive angles face. |
| `turn_to_heading_left(degrees)` | Turn so the heading is `degrees` counter-clockwise from the reference. Takes a positive number. |
| `turn_to_heading_right(degrees)` | Turn so the heading is `degrees` clockwise from the reference. Takes a positive number. |

```python
from raccoon.step.motion import mark_heading_reference, turn_to_heading_right

# After light start, capture heading origin
mark_heading_reference()

# Robot does other things ...

# Always face the same absolute direction
turn_to_heading_right(90)
```

## Step catalog

{{< dsl-steps >}}
