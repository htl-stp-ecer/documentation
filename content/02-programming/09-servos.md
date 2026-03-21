---
title: "Servos"
date: 2026-03-21
draft: false
weight: 10
---

# Servos

Servos are position-controlled actuators used for arms, claws, shields, and other mechanisms. LibSTP supports up to 4 servos on the Wombat (ports 0–3).

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

## Usage in Missions

### Preset Servos

```python
# Move to a named position (auto-waits for travel time)
Defs.claw.open()
Defs.claw.closed()
Defs.arm.up()
Defs.arm.down()

# Custom wait time (milliseconds) — override the auto-estimated travel time
Defs.arm.up(300)           # Wait 300ms for the servo to reach position
Defs.claw.closed(120)      # Wait 120ms
```

The auto-wait estimates travel time based on the angle difference. Override with a manual duration if the servo is under load and moves slower than expected.

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

Move to a position at a controlled speed (degrees per second) — useful for gentle placement:

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
    Defs.claw.closed(120),     # Close and wait for grip
    Defs.arm.up(120),          # Lift
    Defs.claw.open(60),        # Release
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

Servo steps **block** until the estimated travel time elapses. The framework estimates travel time based on how far the servo needs to rotate. If a servo is under load (lifting something heavy), it may take longer than estimated — use a manual wait time:

```python
Defs.arm.down()        # Auto-estimated: might be too short under load
Defs.arm.down(500)     # Manual: wait 500ms regardless
```

If timing is critical, add a small buffer to your wait times. An arm that arrives 50ms early does nothing wrong; an arm that's still moving when the next step starts can cause problems.
