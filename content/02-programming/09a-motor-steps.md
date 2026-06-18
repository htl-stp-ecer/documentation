---
title: "Motor Steps"
author: "Raccoon Docs Team"
date: 2026-06-18
draft: false
weight: 14
---

# Motor Steps

Motor steps give you direct control over individual motors — independent of the drive system.
Use them for arm lifts, conveyors, drum collectors, indexers, or any mechanism driven by a
motor that is not part of the chassis.

The drive system (`drive_forward`, `turn_left`, etc.) controls all chassis motors together
through a kinematic model. Motor steps bypass that and let you command **one specific motor**
at a time, by port number.

## Imports

```python
from raccoon.step.motor import (
    move_motor_to,
    move_motor_relative,
    set_motor_dps,
    set_motor_velocity,
    set_motor_power,
    motor_off,
    motor_passive_brake,
    motor_brake,
    StopMode,
)
```

All of these are also re-exported from the top-level `raccoon` package.

## The StopMode Enum

Every motor has three stopping behaviours. Understanding the difference is important for
mechanism design:

```python
from raccoon.step.motor import StopMode
```

| Value | What happens | When to use |
|-------|-------------|-------------|
| `StopMode.OFF` | Power removed; motor coasts freely under friction | Let an arm fall, release a conveyor belt |
| `StopMode.PASSIVE_BRAKE` | H-bridge shorts motor leads; electrical braking decelerates faster than coasting but no active hold | Stop a spinning drum that does not need to hold position |
| `StopMode.ACTIVE_BRAKE` | Firmware stop latch: actively resists external forces and holds the current shaft position | Hold an arm up against gravity after a `move_motor_to` |

The convenience steps `motor_off()`, `motor_passive_brake()`, and `motor_brake()` wrap these
modes so you do not need to use `StopMode` directly in most code.

## Position Steps (Blocking)

### `move_motor_to()` — Move to Absolute Position

Commands the motor's firmware position controller to drive to an **absolute encoder tick count**,
then blocks until the firmware reports the move is complete (or until an optional timeout fires).

```python
from raccoon.step.motor import move_motor_to, motor_brake

seq([
    # Raise arm to encoder position 500 at speed 800 ticks/s
    move_motor_to(Defs.arm_motor, position=500, velocity=800, timeout=3.0),
    motor_brake(Defs.arm_motor),   # Lock in place after reaching target
])
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `motor` | `IMotor` | required | Motor from the hardware map (`robot.motor(N)` or `Defs.arm_motor`) |
| `position` | `int` | required | Target position in absolute encoder ticks |
| `velocity` | `int` | `1000` | Movement speed in firmware ticks/s. Must be > 0. |
| `timeout` | `float \| None` | `None` | Maximum seconds to wait. `None` = wait indefinitely. If the timeout fires, a warning is logged and the step returns — the motor is not stopped automatically. |

> **Tip:** Always follow `move_motor_to()` with `motor_brake()` if the mechanism must hold
> position (e.g. an arm against gravity). The position controller stops holding once the step
> completes.

### `move_motor_relative()` — Move by Encoder Delta

Same as `move_motor_to()` but accepts a **relative** tick count instead of an absolute position:

```python
from raccoon.step.motor import move_motor_relative, motor_brake

seq([
    # Extend arm 200 ticks forward
    move_motor_relative(Defs.arm_motor, delta=200, velocity=600),
    # Retract 200 ticks back
    move_motor_relative(Defs.arm_motor, delta=-200, velocity=400),
    motor_brake(Defs.arm_motor),
])
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `motor` | `IMotor` | required | Motor to control |
| `delta` | `int` | required | Encoder ticks to travel. Positive = forward, negative = reverse. |
| `velocity` | `int` | `1000` | Movement speed in firmware ticks/s. Must be > 0. |
| `timeout` | `float \| None` | `None` | Maximum seconds to wait before giving up. |

## Velocity Steps (Non-Blocking)

Velocity steps complete **immediately** — the motor continues spinning until another command
(or a stop step) is issued. Use these inside `parallel()` or combined with
`do_while_active()` / `loop_for()`.

### `set_motor_dps()` — Human-Friendly Degrees Per Second

The most readable way to set a continuous motor speed. Converts degrees per second to
firmware BEMF units using the motor's stored calibration (`ticks_to_rad`).

```python
from raccoon.step.motor import set_motor_dps, motor_brake

seq([
    set_motor_dps(Defs.drum_motor, dps=360.0),   # One full rotation per second
    wait(2.0),
    motor_brake(Defs.drum_motor),
])
```

**Prerequisite:** The motor must have valid calibration data (`ticks_to_rad` set by `calibrate()`
or `auto_tune_bemf_velocity()`). Without calibration, the conversion factor will be wrong and
the actual speed will differ from the requested value.

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `motor` | `IMotor` | required | Motor to control |
| `dps` | `float` | required | Angular velocity in degrees per second. Positive = forward, negative = reverse. |

### `set_motor_velocity()` — Raw BEMF Units

Sets the motor's firmware closed-loop velocity controller to a raw BEMF tick target. Useful
when you know the firmware units directly (e.g. after reading them from a characterization run),
but `set_motor_dps()` is usually more readable.

```python
from raccoon.step.motor import set_motor_velocity, motor_brake

seq([
    set_motor_velocity(Defs.drum_motor, velocity=800),
    wait(3.0),
    motor_brake(Defs.drum_motor),
])
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `motor` | `IMotor` | required | Motor to control |
| `velocity` | `int` | required | Firmware BEMF tick velocity. Positive = forward, negative = reverse. |

### `set_motor_power()` — Open-Loop Percent Power

Sets a raw duty-cycle power percentage with **no feedback control**. The motor runs at whatever
speed corresponds to that PWM duty cycle under current load — which varies with battery voltage
and mechanical load. Use this for simple actuators where precision does not matter.

```python
from raccoon.step.motor import set_motor_power, motor_off

seq([
    set_motor_power(Defs.conveyor_motor, percent=70),
    wait(1.5),
    motor_off(Defs.conveyor_motor),
])
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `motor` | `IMotor` | required | Motor to control |
| `percent` | `int` | required | Duty-cycle power from -100 (full reverse) to 100 (full forward). Values outside this range raise `ValueError`. |

## Stop Steps

All three stop steps complete immediately and do not block.

### `motor_off()` — Coast

Removes power. The motor spins down under friction alone.

```python
motor_off(Defs.conveyor_motor)
```

### `motor_passive_brake()` — Electrical Brake

Commands zero power, causing the H-bridge to short the motor leads. Decelerates faster than
coasting but does not hold position once the motor stops.

```python
motor_passive_brake(Defs.drum_motor)
```

### `motor_brake()` — Active Hold

Engages the firmware's stop latch: the firmware actively resists external forces and maintains
the current shaft position. Use this after `move_motor_to()` when the mechanism must not move
(e.g. holding an arm up against gravity).

```python
motor_brake(Defs.arm_motor)
```

## Builder Pattern

Like all step factories, motor steps return a **builder** that lets you chain modifiers:

```python
# Add anomaly detection — called if the step takes unusually long
move_motor_to(Defs.arm_motor, position=400).on_anomaly(
    lambda step, duration: print(f"Move slow: {duration:.2f}s")
)

# Skip timing instrumentation for this step
set_motor_dps(Defs.drum_motor, dps=180.0).skip_timing()
```

## Real-World Patterns

### Arm: Raise to Target, Hold, Then Release

```python
seq([
    move_motor_to(Defs.arm_motor, position=500, velocity=600, timeout=3.0),
    motor_brake(Defs.arm_motor),    # Hold up against gravity

    # ... perform task while arm is raised ...
    drive_forward(30),

    move_motor_to(Defs.arm_motor, position=0, velocity=400, timeout=3.0),
    motor_off(Defs.arm_motor),      # Release at bottom — no need to hold
])
```

### Drum: Spin in Background While Driving

```python
parallel(
    drive_forward(50),              # Drive forward 50 cm
    seq([
        set_motor_dps(Defs.drum_motor, dps=720.0),   # Start spinning at 2 rev/s
        wait(4.0),
        motor_passive_brake(Defs.drum_motor),
    ]),
)
```

### Indexer: Relative Move for Each Step

```python
def advance_one_pocket():
    """Advance drum indexer by one pocket (350 encoder ticks)."""
    return seq([
        move_motor_relative(Defs.indexer_motor, delta=350, velocity=500, timeout=2.0),
        motor_brake(Defs.indexer_motor),
    ])

seq([
    advance_one_pocket(),
    # ... release object ...
    advance_one_pocket(),
    # ... release object ...
])
```

## Getting a Motor by Port

Motor objects come from the hardware map defined in `defs.py`. You can also look one up by
port number directly from the robot:

```python
# In a custom step's _execute_step:
motor = robot.motor(2)     # Get the motor on port 2
```

In practice, always use named motors from `Defs` — port numbers are error-prone:

```python
# Preferred
Defs.arm_motor

# Works, but fragile — the number must match the YAML definition
robot.motor(2)
```
