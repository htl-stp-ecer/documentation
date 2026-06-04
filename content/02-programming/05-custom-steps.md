---
title: "Custom Steps"
author: "Tobias Madlberger"
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
from raccoon import *
from src.hardware.defs import Defs


def down_cone_container() -> Sequential:
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

A reusable step that grabs an object and lifts it:

```python
def grab_and_lift(delay: float = 0.2) -> Sequential:  # you can use args just like in a function
    return seq([
        Defs.claw.open(),
        Defs.arm.down(),
        wait_for_seconds(delay),       # Wait for arm to settle
        Defs.claw.closed(),
        wait_for_seconds(delay),       # Wait for claw to grip
        Defs.arm.up(),
    ])

def drop_object() -> Sequential:
    return seq([
        Defs.arm.down(),
        Defs.claw.open(),
        wait_for_seconds(0.3),
        Defs.arm.up(),
    ])
```

> **Remember:** Passing a number to a `ServoPreset` method like `Defs.claw.closed(120)` sets the servo *speed* in degrees per second — it does **not** add a delay. Use `wait_for_seconds()` when you need to pause between actions.

### Example: Wall-Align-and-Mark Pattern

A common competition pattern — align against a wall and mark the heading as reference:

```python
def align_and_mark() -> Sequential:
    return seq([
        wall_align_backward(accel_threshold=0.3),
        mark_heading_reference(),
    ])
```

## Class-Based Custom Steps

For steps that need custom logic, extend the `Step` base class directly.

> **Never use threads or `time.sleep()` in steps.** The SDK is single-threaded by design and not thread-safe. Always use `await asyncio.sleep()` to wait. See [Advanced Topics]({{< ref "11-advanced" >}}) for why this matters.

### The Step Interface

Add `@dsl_step` to your class so the code generator creates a factory function and builder for it (see [Steps DSL]({{< ref "04-steps" >}}) for how this works):

```python
from raccoon import Step, GenericRobot
from raccoon.step.annotation import dsl_step


@dsl_step(tags=["custom"])
class MyCustomStep(Step):
    async def _execute_step(self, robot: GenericRobot) -> None:
        """Called once when the step runs. Must be async."""
        # Your logic here
        pass

    def required_resources(self) -> frozenset[str]:
        """Return hardware resources this step uses (for parallel safety)."""
        return frozenset()  # e.g., frozenset({"drive", "servo:0"})
```

The `@dsl_step` decorator generates:
- `MyCustomStepBuilder` — a builder class with fluent setters for every `__init__` parameter
- `my_custom_step()` — a `snake_case` factory function you call in missions

If you don't need a generated builder (e.g., the step has no parameters), you can use `@dsl` instead to just register it for discovery without code generation:

```python
from raccoon.step.annotation import dsl

@dsl(tags=["custom"])
class SimpleStep(Step):
    async def _execute_step(self, robot: GenericRobot) -> None:
        # ...
        pass
```

### Example: Wait Until Sensor Threshold

```python
import asyncio
from raccoon import Step, GenericRobot, AnalogSensor
from raccoon.step.annotation import dsl_step


@dsl_step(tags=["sensor", "wait"])
class WaitForAnalogRange(Step):
    """Wait until an analog sensor reads within a specified range."""

    def __init__(self, sensor: AnalogSensor, min_value: float, max_value: float, poll_hz: int = 50) -> None:
        super().__init__()
        self.sensor = sensor
        self.min_value = min_value
        self.max_value = max_value
        self.poll_interval: float = 1.0 / poll_hz

    async def _execute_step(self, robot: GenericRobot) -> None:
        while True:
            value = self.sensor.read()
            if self.min_value <= value <= self.max_value:
                return
            await asyncio.sleep(self.poll_interval)
```

Because of `@dsl_step`, the code generator produces a `wait_for_analog_range()` factory function. You use it like any built-in step:

```python
# Generated factory function — same parameters as __init__
seq([
    wait_for_analog_range(Defs.light_sensor, min_value=1000, max_value=2000),
    drive_forward(25),
])

# Or use the builder pattern for chaining
wait_for_analog_range(Defs.light_sensor, min_value=1000, max_value=2000).skip_timing()
```

### Example: Custom Motion Step (100 Hz Loop)

For steps that need a tight control loop, use `MotionStep` as your base. It provides a fixed-rate 100 Hz update loop:

```python
from raccoon import GenericRobot
from raccoon.step.annotation import dsl_step
from raccoon.step.motion.motion_step import MotionStep


@dsl_step(tags=["motion", "custom"])
class DriveUntilBump(MotionStep):
    """Drive forward until the IMU detects a collision."""

    def __init__(self, speed: float = 0.3, accel_threshold: float = 0.5) -> None:
        super().__init__()
        self.speed = speed
        self.accel_threshold = accel_threshold

    def on_start(self, robot: GenericRobot) -> None:
        """Called once before the loop starts."""
        self.drive = robot.drive

    def on_update(self, robot: GenericRobot, dt: float) -> bool:
        """Called every 10ms. Return True when done."""
        self.drive.set_desired_velocity(self.speed, 0, 0)

        accel = abs(robot.defs.imu.get_accel()[0])
        if accel > self.accel_threshold:
            return True   # Done — hit something
        return False       # Keep going

    def on_stop(self, robot: GenericRobot) -> None:
        """Called after the loop ends. Default: hard stop."""
        robot.drive.hard_stop()

    def required_resources(self) -> frozenset[str]:
        return frozenset({"drive"})
```

This generates `drive_until_bump(speed=0.3, accel_threshold=0.5)` with `.speed()` and `.accel_threshold()` builder methods.

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
from raccoon import ServoPreset

def grab_with(claw_preset: ServoPreset, arm_preset: ServoPreset) -> Sequential:
    return seq([
        claw_preset.open(),
        arm_preset.down(),
        wait_for_seconds(0.2),
        claw_preset.closed(),
        arm_preset.up(),
    ])

# Usage:
grab_with(Defs.claw, Defs.arm)
```
