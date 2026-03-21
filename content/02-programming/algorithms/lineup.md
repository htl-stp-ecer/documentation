---
title: "Lineup"
date: 2026-03-21
draft: false
weight: 2
---

# Lineup (Line Alignment)

Lineup aligns the robot square on a black line. Unlike iterative correction approaches that repeatedly measure and adjust, the lineup algorithm computes the exact correction angle in a **single drive pass** using basic trigonometry. This makes it fast — alignment completes with almost no time lost.

## Quick Start

```python
# Dual sensor (recommended): both sensors find the line
forward_lineup_on_black(Defs.front.left, Defs.front.right)
backward_lineup_on_black(Defs.front.left, Defs.front.right)

# Via SensorGroup shortcut
Defs.front.lineup_on_black()

# Single sensor: when only one sensor is available
forward_single_lineup(
    Defs.front.right,
    correction_side=CorrectionSide.RIGHT,
)
```

## Dual-Sensor Lineup

The dual-sensor algorithm is the recommended approach. It uses two IR sensors (left and right) and exploits the **stagger** between their line crossings to compute the robot's angular error.

### How It Works

As the robot drives forward across a line, the two sensors don't hit the line at the same time (unless already perfectly aligned). The sensor closer to the line crosses first. The robot keeps driving until the second sensor crosses. The distance driven between the two crossings — the **stagger** — directly encodes the alignment error.

```
         ┊ line
    L    ┊    R
    ●────┤────●    Robot approaching at angle
         ┊
         ┊
    ─────┼──────
         ┊
    L hits line first
         ┊    then robot drives distance d
         ┊    R hits line
         ┊
    angle = atan(d / sensor_gap)
```

The correction angle is computed from pure geometry:

```
angle = atan(stagger_distance / sensor_gap)
```

Where `sensor_gap` is the known physical distance between the two sensors on the robot.

### Algorithm Phases

The full `forward_lineup_on_black` sequence has three phases:

1. **Measure** — Drive forward at constant speed. Record odometry when the first sensor crosses the black threshold, then when the second one does. The difference is the stagger distance.
2. **Turn** — Execute a point turn by the computed angle. The sign is determined by which sensor hit first (left first → turn right, right first → turn left).
3. **Clear** — Drive forward at reduced speed until both sensors see white again, leaving the robot just past the line, squared up and ready.

All three phases execute back-to-back with no pauses. The measurement phase happens at full approach speed — there is no need to slow down.

### Why This Works So Well

- **No iteration.** One pass through the line gives the exact correction angle. No PID convergence, no repeated approaches.
- **No tuning.** The algorithm is pure geometry — there are no gains to adjust.
- **Fast.** At 1.0 m/s approach speed, a typical lineup completes in well under a second.
- **Robust.** Works at any initial angle. If the robot is already aligned, the stagger is ~0 and no turn is needed.

## Single-Sensor Lineup

When only one sensor is available, the algorithm uses a different geometric approach: it measures the **apparent line width** as the sensor crosses the line.

### How It Works

A line of known width `W` appears wider when crossed at an angle:

```
apparent_width = W / cos(angle)
```

So the correction angle can be recovered:

```
angle = acos(actual_width / apparent_width)
```

The algorithm drives forward, recording odometry at the **leading edge** (sensor confidence rises above `entry_threshold`) and **trailing edge** (confidence drops below `exit_threshold`). The distance between them is the apparent width.

### Limitation

A single sensor cannot determine which *direction* the robot is skewed — only the magnitude of the skew. You must specify `correction_side` (LEFT or RIGHT) to tell the algorithm which way to turn. If the correction side is wrong, the robot will turn further out of alignment.

Angles below 1 degree are ignored (no correction applied) to avoid unnecessary micro-turns.

## Strafe Lineup

For robots with omnidirectional drive (mecanum or omni wheels), `strafe_lineup_on_black` works the same way as the dual-sensor algorithm but uses lateral movement instead of forward motion. The front and back sensors detect the line while the robot strafes sideways.

```python
strafe_left_lineup_on_black(Defs.left.front, Defs.left.back)
strafe_right_lineup_on_black(Defs.right.front, Defs.right.back)
```

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `left_sensor` / `right_sensor` | IRSensor | Required | Dual-sensor: the two sensors that will cross the line |
| `detection_threshold` | float | 0.7 | Sensor confidence (0.0–1.0) needed to register a line hit |
| `forward_speed` | float | 1.0 | Approach speed in m/s (negative for backward) |

**Single-sensor additional parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `sensor` | IRSensor | Required | The single sensor crossing the line |
| `line_width_cm` | float | 5.0 | Known physical width of the line |
| `entry_threshold` | float | 0.7 | Confidence to detect leading edge |
| `exit_threshold` | float | 0.3 | Confidence to detect trailing edge (should be lower than entry) |
| `correction_side` | `CorrectionSide` | Required | Direction to turn for correction (LEFT or RIGHT) |

## Tips

1. **Prefer dual-sensor lineup.** It's faster, more accurate, and doesn't require you to know the correction direction.
2. **Mount sensors as far apart as possible.** A wider sensor gap gives better angle resolution — small stagger differences map to larger, more measurable distances.
3. **Use the SensorGroup shortcut** (`Defs.front.lineup_on_black()`) for the most common case.
4. **Lineup works at full speed.** There's no need to slow down before hitting the line. The measurement is taken during continuous motion.
