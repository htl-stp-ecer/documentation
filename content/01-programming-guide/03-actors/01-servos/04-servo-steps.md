---
title: "Servo Steps"
author: "Tobias Madlberger, Mario Scholze"
date: 2026-11-19
draft: false
weight: 40
description: "Moving servos in missions: preset positions, plain angles, slow and shake servos, builder options and power states."
---

# Servo Steps

The steps for moving servos: named positions on a preset, plain angles, shaking and slow movements, and switching servos off.

## Steps

### Preset servos

```python
# Move to a named position (auto-waits for travel time)
Defs.claw.open()
Defs.claw.closed()
Defs.arm.up()
Defs.arm.down()

# With speed control (degrees per second) — returns a slow servo step
Defs.arm.up(300)           # Move to "up" at 300 deg/s
Defs.claw.closed(120)      # Move to "closed" at 120 deg/s
```

When called without an argument, the servo moves at full speed. When called with a number, it moves at that speed in degrees per second — useful for gentle or controlled movements.

### Plain Servo

```python
# Move to a specific angle
servo(Defs.my_servo, 90)      # Move to 90 degrees
servo(Defs.my_servo, 0)       # Move to 0 degrees
```

### Shake Servo

Oscillate between two angles — useful for shaking objects loose:

```python
shake_servo(Defs.claw_servo, duration=2.0, angle_a=30, angle_b=135)
```

### Slow Servo

Move to a position at a controlled speed (degrees per second) — useful for gentle placement.
The default easing is `Easing.EASE_IN_OUT` (smoothstep: 3t² − 2t³), which gives gentle acceleration
and deceleration. You can select a different curve with the `easing` parameter:

```python
from raccoon.step.servo import slow_servo, Easing

# Default: ease-in-ease-out at 60 deg/s
slow_servo(Defs.my_servo, angle=90, speed=60.0)

# Constant speed — no acceleration/deceleration
slow_servo(Defs.my_servo, angle=90, speed=45.0, easing=Easing.LINEAR)

# Fast start, gentle stop
slow_servo(Defs.my_servo, angle=90, speed=80.0, easing=Easing.EASE_OUT)
```

**How interpolation is applied:**

For the four built-in `Easing` enum members (`LINEAR`, `EASE_IN`, `EASE_OUT`, `EASE_IN_OUT`),
`slow_servo` calls `servo_ref.set_smooth_position()` and the **firmware** handles the easing
curve entirely on the STM32. The Python side only sets the target and waits — no per-tick Python
loop runs.

If you pass a **custom Python callable** instead of an `Easing` member, the Python side steps
through intermediate positions at ~10 Hz (100 ms per tick), calling your function with normalised
time `t ∈ [0, 1]` and commanding the interpolated angle each tick.

#### Easing enum

| Variant | Curve | When to use |
|---------|-------|-------------|
| `Easing.LINEAR` | Constant speed | Mechanisms where you want a predictable, uniform rate |
| `Easing.EASE_IN` | Slow start, fast end (quadratic) | Build-up moves where momentum matters |
| `Easing.EASE_OUT` | Fast start, slow end (quadratic) | Soft landings — place objects gently |
| `Easing.EASE_IN_OUT` | Smoothstep (3t²−2t³) — **default** | General-purpose: natural, fluid motion |
| `Easing.EASE_IN_OUT_COSINE` | Cosine-based ease-in-out | Similar to smoothstep, slightly softer peaks |

You can also pass any Python callable with signature `(t: float) -> float` for fully custom curves.

Import: `from raccoon.step.servo import Easing` (also exported from top-level `raccoon`).

#### Parameters of `slow_servo`

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `servo` | `Servo` or `ServoPreset` | required | The servo to move |
| `angle` | `float` | required | Target angle in degrees |
| `speed` | `float` | `60.0` | Movement speed in degrees per second |
| `easing` | `Easing` or callable | `Easing.EASE_IN_OUT` | Interpolation curve |

### Disable All Servos

Turn off all servo outputs (servos go limp):

```python
fully_disable_servos()
```

## Builder Pattern and Step Chaining

Every servo step factory (`slow_servo`, `shake_servo`, `fully_disable_servos`) returns a
**builder object**, not a plain Step. The builder lets you chain optional modifiers before the step
is executed:

```python
from raccoon.step.servo import slow_servo, Easing

# All arguments in one call
slow_servo(Defs.arm, angle=90, speed=45.0)

# Equivalent: chain .angle() and .speed() after construction
slow_servo().servo(Defs.arm).angle(90).speed(45.0)

# Add an anomaly callback (called if the step takes unexpectedly long)
slow_servo(Defs.arm, angle=90, speed=45.0).on_anomaly(
    lambda step, duration: print(f"Servo move took {duration:.2f}s")
)

# Skip timing instrumentation for this step
slow_servo(Defs.arm, angle=90).skip_timing()
```

All builder methods return `self`, so you can chain freely. The step is built and run lazily when
it is added to a `seq()` or `parallel()` and executed by the mission runner.

The same pattern applies to `shake_servo()` and `fully_disable_servos()`.

### ServoPreset runtime properties

`ServoPreset` exposes three read-only runtime properties:

```python
from raccoon.hal import Servo
from raccoon.step.servo import ServoPreset

arm = ServoPreset(Servo(port=1), positions={"down": 10, "up": 105}, offset=5)

# Raw Servo device for direct hardware access
arm.device          # Servo(port=1)

# Current mounting offset in degrees
arm.offset          # 5.0

# Position name → angle mapping (before offset is applied)
arm.positions       # {"down": 10, "up": 105}

# The offset is added when the position is called, not when .positions is read
arm.up.value        # 110.0  (105 + offset 5)
```

Use `arm.device` when you need to call raw HAL methods (`enable()`, `disable()`) directly.
Use `arm.positions` to inspect the configured angles programmatically — e.g. to verify that the
YAML was parsed correctly during a setup check.

`ServoPreset` also exposes a `get_position()` method that returns the currently commanded angle:

```python
# Read the current angle — useful in defer() guards
current_angle = Defs.arm_servo.get_position()
```

This is particularly useful inside a `defer()` factory to check whether the servo has already moved
before issuing a redundant command:

```python
from raccoon import defer, seq

def safe_arm_lower():
    """Lower the arm only if it is not already at the down position."""
    def _build():
        if Defs.arm_servo.get_position() > 150:
            return Defs.arm_servo.down()
        return seq([])   # already down — do nothing
    return defer(_build)
```

## Servo Power States

Servo power/control on Wombat has more than one useful state.

### Normal enabled state

Any regular servo step such as `servo(...)`, `slow_servo(...)`, `ShakeServo`, or a `ServoPreset` position automatically enables the target servo before sending the command.

When a servo is re-enabled, the HAL preserves the last commanded angle and re-applies it.

### Per-servo disable

The raw HAL also exposes:

```python
Defs.claw.device.disable()
Defs.claw.device.enable()
```

or for plain servos:

```python
my_servo.disable()
my_servo.enable()
```

This is low-level hardware control, not a high-level mission step. Use it when you need direct access, for example during experiments or calibration tooling.

### Fully disabled / limp mode

`fully_disable_servos()` sends the platform into the fully-disabled servo mode for every servo port:

- no PWM signal is sent
- the servos stop actively holding position
- the mechanism can be moved freely by hand

This is the best way to make an arm or claw go limp intentionally.

That is useful for:

- manual mechanism setup
- releasing servo load at the end of a run
- avoiding holding current and heat while idle
- calibration workflows

The next normal servo command will re-enable the affected servo automatically.

### Safety note

A limp servo is no longer holding the mechanism. Arms, claws, or linkages may fall under gravity as soon as power is removed. Use this deliberately, especially on multi-link arms.
