---
title: "Servo Positions"
author: "Tobias Madlberger, Mario Scholze"
date: 2026-11-19
draft: false
weight: 30
description: "Named servo positions in servos.yml and how to call them in missions."
---

# Servo Positions

Named positions turn angles into words. Each key under `positions` becomes a method on the servo, so mission code says what it wants and not which number to send.

```yaml
# config/servos.yml
claw_servo:
  type: Servo
  port: 1
  positions:
    open: 30
    closed: 135
```

```python
seq([
    Defs.claw_servo.open(),
    Defs.claw_servo.closed(speed=120),   # eased motion at 120 deg/s
])
```

A position call returns a step. It waits until the servo has arrived, so the next step in a `seq([...])` starts when the claw is open. Without `speed` the servo moves at full speed and the step estimates the travel time from the angle difference. With a speed in degrees per second the step is a [slow servo]({{< ref "/01-programming-guide/03-actors/01-servos/04-servo-steps.md" >}}) that controls the movement rate. Use a slower speed for heavy or delicate mechanisms.

```python
Defs.arm.down()        # full speed
Defs.arm.down(60)      # 60 deg/s
```

## Naming positions

**Position names starting with `_` are allowed.** Names like `_0deg`, `_20deg`, `_45deg`, `_90deg` are valid Python identifiers and become callable methods: `Defs.arm_sholder._0deg()`. The underscore prefix signals an angle-based name rather than a functional one.

**Object-specific names make mission code self-documenting.** Rather than overloading a single `open` and `closed`, you can name by the object being gripped:

```yaml
# conebot servos.yml (real example)
claw_servo:
  type: Servo
  port: 1
  positions:
    closed: 154
    half_open: 70
    open: 55
    botguy_open: 90       # wider grip for the botguy figurine
    botguy_closed: 130    # tighter grip for the botguy figurine
```

Mission code then reads `Defs.claw_servo.botguy_closed()` instead of a raw number or an ambiguous `closed()`.

Position names must be valid Python identifiers, because each one becomes a method.

## Patterns

### Grab and Release

```python
# From ConeBot: grab a cone
seq([
    Defs.claw.open(),
    Defs.arm.down(),
    Defs.claw.closed(120),     # Close at 120 deg/s (controlled grip)
    Defs.arm.up(120),          # Lift at 120 deg/s
    Defs.claw.open(60),        # Release slowly at 60 deg/s
])
```

### Parallel Servo + Drive

Move servos while the robot is driving:

```python
# From PackingBot: prepare arm while turning
parallel(
    turn_right(90),
    seq([
        Defs.pom_arm.above_pom(),
        Defs.pom_grab.open(),
    ]),
)
```

### Servo Initialization in Setup

Always home your servos in the setup mission so they're in a known position:

```python
class M000SetupMission(SetupMission):
    def sequence(self) -> Sequential:
        return seq([
            Defs.claw.closed(),
            Defs.arm.up(),
            Defs.shield.down(),
            Defs.grabber.closed(),
            # ... rest of setup
        ])
```
