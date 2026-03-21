---
title: "Servos"
author: "Tobias Madlberger"
date: 2026-03-21
draft: false
weight: 10
---

# Servos

Servos are position-controlled actuators used for arms, claws, shields, and other mechanisms.

## Declaration

### Plain Servo

```python
from libstp import Servo

my_servo = Servo(port=0)
```

Use plain servos when you only need one or two positions, or when you compute angles dynamically.

### Servo with Presets (Recommended)

```python
from libstp import Servo, ServoPreset

claw = ServoPreset(
    Servo(port=2),
    positions={"closed": 135, "open": 30}
)

arm = ServoPreset(
    Servo(port=1),
    positions={
        "down": 10,
        "above_pom": 55,
        "up": 105,
        "start": 160,
        "high_up": 165,
    }
)
```

`ServoPreset` creates callable methods for each position name. The angle values (0–180) correspond to the servo's physical range.

### Servo Offsets

`ServoPreset` supports an `offset` parameter that shifts all positions by a fixed number of degrees:

```python
claw = ServoPreset(
    Servo(port=2),
    positions={"closed": 135, "open": 30},
    offset=5   # Adds 5 degrees to every position
)
```

This is useful when replacing a broken servo. A new servo mounted on the same shaft may land a few teeth off from the original, causing all positions to be shifted by the same amount. Since all positions are just angle values, adding a constant offset shifts every position by the same amount — no need to re-tune each angle individually.

> **Tip:** When choosing your servo angles, try to avoid values very close to 0 or 180. Keeping some margin (e.g. 10–170) leaves room to apply a positive or negative offset when a servo needs to be swapped at competition — without hitting the physical limits.

## Usage in Missions

### Preset Servos

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

Move to a position at a controlled speed (degrees per second) — useful for gentle placement. By default, `slow_servo` uses ease-in-ease-out interpolation, which smoothly accelerates and decelerates the servo for fluid motion:

```python
slow_servo(Defs.my_servo, angle=90, speed=30.0)   # 30 degrees/sec (slower than default 60)
```

### Disable All Servos

Turn off all servo outputs (servos go limp):

```python
fully_disable_servos()
```

## Real-World Patterns

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
class M00SetupMission(Mission):
    def sequence(self) -> Sequential:
        return seq([
            Defs.claw.closed(),
            Defs.arm.up(),
            Defs.shield.down(),
            Defs.grabber.closed(),
            # ... rest of setup
        ])
```

## Finding Servo Angles

To find the right angle values for each position:

1. Open **BotUI → Sensors & Actors** on the robot's touchscreen
2. Use the servo slider to move the servo manually
3. Note the angle when it's in the position you want
4. Enter that angle in your `ServoPreset` positions

Repeat for each named position. The angles depend on how the servo is mounted — there's no universal "up" or "down" angle.

## Timing Considerations

Servo steps **block** until the servo reaches its target position. When called without a speed argument, the servo moves at full speed and the step estimates travel time based on the angle difference. When called with a speed (degrees per second), it uses a slow servo step that controls the movement rate:

```python
Defs.arm.down()        # Full speed, auto-estimated travel time
Defs.arm.down(60)      # 60 deg/s — slower, more controlled
```

Use a slower speed for heavy or delicate mechanisms where full-speed movement could cause problems (slamming, overshooting, dropping objects).
