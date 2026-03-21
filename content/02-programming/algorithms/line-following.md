---
title: "Line Following"
date: 2026-03-21
draft: false
weight: 1
---

# Line Following

Line following keeps the robot tracking along a black line (or its edge) using PID-controlled steering corrections. The system reads calibrated IR sensor probabilities each control cycle and adjusts the robot's heading or lateral position to stay on course.

## Quick Start

```python
# Two-sensor: follow a line for 50 cm
Defs.front.follow_right_edge(cm=50)

# Single-sensor: follow the right edge of a line for 30 cm
follow_line_single(
    sensor=Defs.front.right,
    side=LineSide.RIGHT,
    distance_cm=30,
)

# Follow until another sensor triggers
follow_line(
    left_sensor=Defs.front.left,
    right_sensor=Defs.front.right,
    distance_cm=100,
).until(on_black(Defs.rear.right))
```

## How It Works

### Sensor Error Signal

After [calibration]({{< ref "10-calibration" >}}), each IR sensor provides `probabilityOfBlack()` — a float from 0.0 (pure white) to 1.0 (pure black), linearly interpolated between the calibrated thresholds.

**Two-sensor mode** computes the error as the difference between left and right:

```
error = left.probabilityOfBlack() - right.probabilityOfBlack()
```

- Positive error → left sees more black → steer left
- Negative error → right sees more black → steer right
- Zero → centered on line

**Single-sensor mode** tracks the line *edge* by targeting a reading of 0.5 (half on, half off):

```
error = sensor.probabilityOfBlack() - 0.5
```

The sign is flipped when following the opposite edge (`LineSide.RIGHT`).

### PID Steering

A PID controller converts the sensor error into a steering correction each cycle:

```
correction = Kp * error + Ki * integral(error) + Kd * d(error)/dt
```

| Term | Default (two-sensor) | Default (single) | Effect |
|------|:--------------------:|:-----------------:|--------|
| `kp` | 0.4 | 1.0 | Sharpness of response to current error |
| `ki` | 0.0 | 0.0 | Eliminates steady-state drift over time |
| `kd` | 0.1 | 0.3 | Dampens oscillation around the line edge |

The correction is applied as an angular velocity override on top of the robot's forward motion. The result is smooth, proportional steering — not bang-bang switching.

### Velocity Profiling

The profiled variants (`follow_line`, `follow_line_single`) use a **trapezoidal velocity profile** for forward motion: the robot accelerates smoothly, cruises at the target speed, then decelerates as it approaches the target distance. This prevents overshoot at the end of a line-follow segment.

## Variants

The system provides two families of line-follow steps:

### Profiled (Forward/Backward)

Best for straight-line following where you know the distance:

```python
follow_line(
    left_sensor=Defs.front.left,
    right_sensor=Defs.front.right,
    distance_cm=50,
    speed=0.5,
)

follow_line_single(
    sensor=Defs.front.right,
    side=LineSide.RIGHT,
    distance_cm=30,
    speed=0.4,
)
```

These use `LinearMotion` with trapezoidal profiling and odometry-based distance tracking.

### Directional (Any Heading + Strafe)

For robots that can move laterally (omni/mecanum wheels), directional variants allow following a line while moving in any direction:

```python
# Follow line while driving forward — correct with rotation
directional_follow_line(
    left_sensor=Defs.front.left,
    right_sensor=Defs.front.right,
    heading_speed=0.5,
    distance_cm=40,
)

# Follow line while driving forward — correct with strafing (heading stays locked)
strafe_follow_line(
    left_sensor=Defs.front.left,
    right_sensor=Defs.front.right,
    speed=0.5,
    distance_cm=40,
)
```

**Angular correction** (default) applies the PID output as rotational velocity — the robot rotates to stay on the line.

**Lateral correction** (`strafe_follow_line`) keeps the heading locked using a secondary gyro-hold PID and instead strafes left/right to correct position. This is useful when the robot must maintain a specific orientation while following a line.

## Stopping

Line following stops when either condition is met (whichever comes first):

1. **Distance reached** — the robot has traveled `distance_cm` from the start
2. **Stop condition triggered** — a composable `.until()` condition fires

```python
# Stop after 50 cm
follow_line(..., distance_cm=50)

# Stop when another sensor sees black
follow_line(..., distance_cm=100).until(on_black(Defs.rear.right))

# Stop on timeout
follow_line(...).until(after_seconds(5))
```

If neither is provided, the step uses a very large default distance (effectively "follow forever until cancelled").

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `left_sensor` / `right_sensor` | IRSensor | Required | Two-sensor variants: the sensors straddling the line |
| `sensor` | IRSensor | Required | Single-sensor variants: the sensor tracking an edge |
| `side` | `LineSide` | `LEFT` | Single-sensor: which edge of the line to track |
| `distance_cm` | float | None | Distance to follow before stopping |
| `speed` | float | 0.5 | Forward speed as fraction of max velocity (0.0–1.0) |
| `kp`, `ki`, `kd` | float | See above | PID gains for steering correction |

## Tips

1. **Start with default PID gains.** Only tune if the robot oscillates (lower `kp`, raise `kd`) or drifts off the line (raise `kp`).
2. **Use two sensors when possible.** Two-sensor following is inherently more stable because the error signal is differential — ambient noise affects both sensors equally and cancels out.
3. **Single-sensor edge tracking works best at moderate speed.** At high speeds the sensor crosses the edge too quickly for accurate readings.
4. **Calibrate on the actual surface.** Line following accuracy depends directly on calibration quality — see [Calibration]({{< ref "10-calibration" >}}).
