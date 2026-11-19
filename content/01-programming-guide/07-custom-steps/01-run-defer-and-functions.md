---
title: "Custom Steps: run, defer and functions"
author: "Tobias Madlberger, Mario Scholze"
date: 2026-11-19
draft: false
weight: 10
description: "The simple way to write custom steps: run(), defer() and functions that return a seq."
---

# Custom Steps: run, defer and functions

You often need a step that the library does not have. The easiest ways to get one need no class:

- `run(...)` executes a piece of Python as a step.
- `defer(...)` builds a step when it is reached, so it can look at live sensor values.
- A plain Python **function that returns a `seq([...])`** gives a name to a pattern you use more than once.

If you need your own asynchronous logic or a 100 Hz control loop, see [Step Classes]({{< ref "/01-programming-guide/07-custom-steps/02-step-classes.md" >}}).

## `run(...)`: inline code

Execute arbitrary Python code as a step:

```python
seq([
    drive_forward(25),
    run(lambda robot: print("Reached the cone!")),
    Defs.claw.open(),
])
```

`run()` accepts sync or async callables:

```python
async def check_sensor(robot):
    value = robot.defs.front_right_ir.read()
    if value > 2000:
        print("On black line")

seq([
    run(check_sensor),
    drive_forward(10),
])
```

## `defer(...)`: build a step at runtime

Build a step at runtime based on robot state:

```python
def choose_direction(robot):
    if robot.defs.front_right_ir.read() > 2000:
        return turn_left(90)
    else:
        return turn_right(90)

seq([
    drive_forward(25),
    defer(choose_direction),   # Decides at runtime
    drive_forward(25),
])
```

**Why `defer()` instead of `if_then()`?** The key difference is when the step tree is *built* vs when it *runs*. The entire `seq([...])` list is constructed before the mission starts — any Python that reads sensor state at module level runs too early. `defer()` receives a factory function that is called at the moment the step executes, so it always sees live robot state.

**Real example from the PackingBot** — a sensor-gated strafe that only fires if the robot detects it landed in the wrong position:

```python
def drive_if_sensor_triggered(sensor):
    def _build(robot):
        if sensor.read() > 500:     # live sensor read at execution time
            return seq([drive_forward(35)])
        else:
            return seq([])           # no-op branch
    return defer(_build)
```

The comment in the source is explicit: "`defer` = evaluate `_build` function at runtime and not compile-time." When in doubt, use `if_then()` for simple boolean branches and `defer()` when you need to inspect any live state to pick among multiple step trees.

## Functions that return steps

The simplest way to create a reusable step: write a function that returns a composition of existing steps. No class is needed.

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

class M020CollectMission(Mission):
    def sequence(self) -> Sequential:
        return seq([
            drive_forward(20),
            down_cone_container(),    # Your custom step
            drive_backward(10),
        ])
```

### Example: Motor-Timed Mechanism (No Limit Switch)

When a mechanism is too simple to justify limit switches, use `set_motor_velocity()` + `wait_for_seconds()` + `motor_passive_brake()` wrapped in a named function. Adapted from the Ecer2026 ConeBot:

```python
def down_cone_container_timed():
    return seq([
        set_motor_velocity(Defs.cone_container_motor, velocity=-1700),
        wait_for_seconds(0.4),
        motor_passive_brake(Defs.cone_container_motor),
        drive_forward(cm=10),
        set_motor_velocity(Defs.cone_container_motor, velocity=1700),
        wait_for_seconds(0.2),
        motor_passive_brake(Defs.cone_container_motor),
    ])
```

The velocity of `-1700` is in raw BEMF ticks — check your motor's `ticks_to_rad` calibration to convert to real units. Time-based control is the right trade-off when the mechanical stroke is consistent and sensor wiring is impractical.

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

## Making a step visible in the step palette: `@dsl`

If you want your step function to appear in the BotUI step palette (and in API reference listings), decorate it with `@dsl`:

```python
from raccoon import *
from raccoon.step.annotation import dsl


@dsl(tags=["custom", "arm"])
def grab_and_lift(delay: float = 0.2) -> Sequential:
    return seq([...])
```

Steps without `@dsl` still work perfectly in mission code — they're just invisible to the discovery system. Use `@dsl` for steps you want other team members to find in the UI; leave it off for internal helpers.

> **`@dsl(hidden=True)`** registers the step for metadata purposes but hides it from the palette. Useful for UIStep subclasses that are invoked programmatically, not by drag-and-drop.
