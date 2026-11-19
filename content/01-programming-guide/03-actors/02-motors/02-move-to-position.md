---
title: "Move to Position"
author: "Tobias Madlberger, Mario Scholze"
date: 2026-11-19
draft: false
weight: 20
description: "move_motor_to and move_motor_relative: closed-loop position steps for aux motors."
---

# Move to Position

Position steps move a motor to a target and wait until it arrives. They use the BEMF position controller, so they work in closed loop. Use them for arms and lifts. They are for [aux motors]({{< ref "/01-programming-guide/03-actors/02-motors/_index.md" >}}) only.

```python
from raccoon.step.motor import move_motor_to, move_motor_relative
```

Both are also available from the top-level `raccoon` package.


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

After a position step the motor is not held by default. To hold an arm against gravity, follow it with `motor_brake`, see [Other Motor Steps]({{< ref "/01-programming-guide/03-actors/02-motors/03-other-motor-steps.md" >}}).
