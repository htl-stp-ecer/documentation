---
title: "Custom Steps"
date: 2026-03-21
draft: false
weight: 6
---

# Custom Steps

When the built-in steps don't cover what you need, you can create your own reusable steps. There are two approaches: **function-based** (simple, recommended) and **class-based** (for complex behavior).

## Function-Based Custom Steps (Recommended)

The simplest way to create a reusable step: write a function that returns a composition of existing steps.

### Example: Lower a Container Motor

From the Ecer2026 ConeBot — a motor-driven container that moves down until a limit switch is hit:

```python
# src/steps/cone_container_steps.py
from libstp import *
from src.hardware.defs import Defs


def down_cone_container():
    return seq([
        set_motor_velocity(Defs.cone_container_motor, -100),
        wait_for_digital(Defs.cone_arm_down_button),
        motor_passive_brake(Defs.cone_container_motor),
    ])
```

Use it in a mission like any other step:

```python
from src.steps.cone_container_steps import down_cone_container

class M02CollectMission(Mission):
    def sequence(self) -> Sequential:
        return seq([
            drive_forward(20),
            down_cone_container(),    # Your custom step
            drive_backward(10),
        ])
```

### Example: Grab and Lift

A parametric step that grabs an object and lifts it:

```python
def grab_and_lift(grab_delay_ms=0):
    return seq([
        Defs.claw.open(),
        Defs.arm.down(),
        Defs.claw.closed(grab_delay_ms),   # Wait for claw to close
        Defs.arm.up(),
    ])

def drop_object():
    return seq([
        Defs.arm.down(),
        Defs.claw.open(),
        wait_for_seconds(0.3),
        Defs.arm.up(),
    ])
```

### Example: Wall-Align-and-Mark Pattern

A common competition pattern — align against a wall and mark the heading as reference:

```python
def align_and_mark():
    return seq([
        wall_align_backward(accel_threshold=0.3),
        mark_heading_reference(),
    ])
```

## Class-Based Custom Steps

For steps that need custom update logic (running at 100 Hz), extend the `Step` base class directly.

### The Step Interface

```python
from libstp import Step


class MyCustomStep(Step):
    async def _execute_step(self, robot):
        """Called once when the step runs. Must be async."""
        # Your logic here
        pass

    def required_resources(self):
        """Return hardware resources this step uses (for parallel safety)."""
        return frozenset()  # e.g., frozenset({"drive", "servo:0"})
```

### Example: Wait Until Sensor Threshold

```python
import asyncio
from libstp import Step


class WaitForAnalogRange(Step):
    def __init__(self, sensor, min_value, max_value, poll_hz=50):
        super().__init__()
        self.sensor = sensor
        self.min_value = min_value
        self.max_value = max_value
        self.poll_interval = 1.0 / poll_hz

    async def _execute_step(self, robot):
        while True:
            value = self.sensor.read()
            if self.min_value <= value <= self.max_value:
                return
            await asyncio.sleep(self.poll_interval)


# Usage:
seq([
    WaitForAnalogRange(Defs.light_sensor, min_value=1000, max_value=2000),
    drive_forward(25),
])
```

### Example: Custom Motion Step (100 Hz Loop)

For steps that need a tight control loop, use `MotionStep` as your base. It provides a fixed-rate 100 Hz update loop:

```python
from libstp.step.motion.motion_step import MotionStep


class DriveUntilBump(MotionStep):
    def __init__(self, speed=0.3, accel_threshold=0.5):
        super().__init__()
        self.speed = speed
        self.accel_threshold = accel_threshold

    def on_start(self, robot):
        """Called once before the loop starts."""
        self.drive = robot.drive

    def on_update(self, robot, dt):
        """Called every 10ms. Return True when done."""
        self.drive.set_desired_velocity(self.speed, 0, 0)

        accel = abs(robot.defs.imu.get_accel()[0])
        if accel > self.accel_threshold:
            return True   # Done — hit something
        return False       # Keep going

    def on_stop(self, robot):
        """Called after the loop ends. Default: hard stop."""
        robot.drive.hard_stop()

    def required_resources(self):
        return frozenset({"drive"})
```

## Resource Declarations

When you create class-based steps, declare what hardware resources they use. This enables the framework to validate parallel blocks — if two steps use the same resource, they can't run in parallel.

Resource format: `"<type>"` or `"<type>:<qualifier>"`

```python
def required_resources(self):
    return frozenset({
        "drive",          # Uses the drive system
        "motor:2",        # Uses motor port 2
        "servo:0",        # Uses servo port 0
        "servo:*",        # Uses ALL servos (wildcard)
    })
```

## Organizing Custom Steps

Keep custom steps in `src/steps/`:

```
src/
├── steps/
│   ├── arm_steps.py           # Arm-related custom steps
│   ├── grabber_steps.py       # Grabber operations
│   └── alignment_steps.py     # Custom alignment routines
└── missions/
    └── m01_mission.py          # Imports from steps/
```

Function-based steps can reference `Defs` directly (they're coupled to your robot's hardware). If you want portable steps that work across robots, accept hardware as parameters:

```python
# Portable: works with any servo
def grab_with(claw_preset, arm_preset):
    return seq([
        claw_preset.open(),
        arm_preset.down(),
        claw_preset.closed(),
        arm_preset.up(),
    ])

# Usage:
grab_with(Defs.claw, Defs.arm)
```
