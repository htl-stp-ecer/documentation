---
title: "Stop Conditions"
author: "Tobias Madlberger"
date: 2026-06-18
draft: false
weight: 9
---

# Stop Conditions

## Concept

Stop conditions control *when* a step finishes. Many steps (especially motion steps) can run indefinitely — `drive_forward(speed=0.8)` drives forever unless you tell it when to stop. That's what `.until()` does.

```python
drive_forward(speed=0.8).until(on_black(Defs.front.right))
```

Stop conditions are **first-class objects**, not just flags. They can be composed with `|`, `&`, and `+` operators, stored in variables, and reused across steps. This means you can build complex stop logic — "stop after crossing a line *and* traveling at least 10 cm, but no more than 60 cm in any case" — in a single readable expression without any custom code.

## Basic Conditions

| Condition | What It Checks |
|-----------|---------------|
| `on_black(sensor, threshold=0.7)` | IR sensor reads black |
| `on_white(sensor, threshold=0.7)` | IR sensor reads white |
| `over_line(sensor, black_threshold=0.7, white_threshold=0.7)` | Sensor crosses a line (black then white) — shorthand for `on_black(sensor, black_threshold) + on_white(sensor, white_threshold)` |
| `after_seconds(s)` | Fixed time elapsed |
| `after_cm(cm, absolute=False)` | Distance traveled (via odometry path length) |
| `after_forward_cm(cm, absolute=False)` | Signed forward displacement relative to robot's heading at condition start |
| `after_lateral_cm(cm, absolute=False)` | Signed lateral displacement — positive is left on mecanum/omni drivetrains |
| `after_degrees(deg)` | Heading changed by N degrees (via IMU) |
| `on_digital(sensor, pressed=True)` | Digital sensor state |
| `on_analog_above(sensor, threshold)` | Analog reading above value |
| `on_analog_below(sensor, threshold)` | Analog reading below value |
| `stall_detected(motor, threshold_tps=10, duration=0.25)` | Motor is stalling |
| `custom(fn)` | Your own lambda/function |

### `after_cm` — Path Length Distance

`after_cm(cm)` uses the odometry **path length** (cumulative total distance traveled) and works correctly regardless of direction (forward, backward, strafing, curved paths).

The optional `absolute=True` mode measures from the odometry origin (last `reset()`) rather than from when the condition started. Use relative mode (the default) when you care about "how far since this step began"; use absolute mode when you want to gate on total mission displacement:

```python
# Relative (default): stop after traveling 30 cm from now
drive_forward(speed=0.8).until(after_cm(30))

# Absolute: stop when total path length from last reset reaches 50 cm
drive_forward(speed=0.8).until(after_cm(50, absolute=True))
```

### `after_forward_cm` and `after_lateral_cm` — Axis Displacement

`after_forward_cm(cm)` and `after_lateral_cm(cm)` measure **signed displacement along a body axis** rather than cumulative path length. The axis is fixed to the robot's heading at the moment the condition starts — any turning that happens afterward does not rotate the axis.

- `after_forward_cm(cm)`: positive triggers after moving forward; negative triggers after moving backward.
- `after_lateral_cm(cm)`: positive triggers after moving left; negative triggers after moving right. Only meaningful on drivetrains that support lateral motion (mecanum / omni). On a differential drive the lateral component stays near zero unless the robot rotates and then drives.

```python
# Stop after 20 cm of net forward progress (ignores any side drift)
drive_forward(speed=0.8).until(after_forward_cm(20))

# Stop after 15 cm of lateral travel to the left (mecanum strafe)
strafe_left(speed=0.5).until(after_lateral_cm(15))

# Stop after moving 10 cm backward
drive_backward(speed=0.5).until(after_forward_cm(-10))
```

Both accept `absolute=True` to read displacement from the odometry origin instead of from condition start:

```python
# Stop when the robot is 30 cm forward of its starting point
drive_forward(speed=0.8).until(after_forward_cm(30, absolute=True))
```

**When to use which:**

| Condition | Measures | Use case |
|-----------|---------|---------|
| `after_cm(cm)` | Total path length | Any motion — works on curves, backwards, strafing |
| `after_forward_cm(cm)` | Net forward component | Mecanum: want to stop after N cm of actual forward progress, not total travel |
| `after_lateral_cm(cm)` | Net lateral component | Mecanum strafe: stop after N cm sideways |

## Combining Conditions

Conditions can be combined with three operators:

| Operator | Meaning | Triggers when... |
|----------|---------|-----------------|
| `A \| B` | OR | Either A or B is true |
| `A & B` | AND | Both A and B are true |
| `A + B` | THEN | A becomes true, then B becomes true after that |

### OR — Either Condition

```python
# Stop when sensor sees black OR after 50 cm (whichever comes first)
drive_forward(speed=1.0).until(
    on_black(Defs.front.right) | after_cm(50)
)
```

Use OR as a safety fallback: "stop at the line, but if we miss it, stop after 50 cm anyway."

### AND — Both Conditions

```python
# Stop when sensor sees black AND at least 10 cm traveled
drive_forward(speed=1.0).until(
    on_black(Defs.front.right) & after_cm(10)
)
```

Use AND to prevent false triggers: "don't count a black reading until we've driven at least 10 cm." This is critical when the robot starts on or near a line.

### THEN — Sequential Conditions

```python
# First wait 10 cm, THEN start checking for black
drive_forward(speed=1.0).until(
    after_cm(10) + on_black(Defs.front.right)
)
```

THEN is like AND but with a strict ordering: the first condition must become true before the second one is even checked. This is different from AND — with AND, both are checked simultaneously from the start; with THEN, the second condition is completely ignored until the first fires.

> **`>` is deprecated — use `+` instead.** The `>` operator works for two-element chains (`A > B`), but Python expands longer chains like `a > b > c` into `(a > b) and (b > c)`, which produces incorrect behavior. The `+` operator does the same thing without this problem and works for any number of chained conditions.

### `over_line()` as an Intermediate Condition

`over_line(sensor)` is shorthand for `on_black(sensor) + on_white(sensor)` — it fires once the robot has fully *crossed* a line (detected black, then white). It works equally well in the middle of a `+` chain, not just at the end:

```python
# ConeBot M040 — drive backward over a line, then continue 20 cm past it:
drive_backward().until(
    after_cm(10)
    + over_line(Defs.front.right)   # middle element — must cross a line
    + after_cm(20)                  # then continue 20 cm past it
)
```

This is a common mecanum idiom: the first `after_cm` skips noise at the start, `over_line` detects the actual crossing, and the final `after_cm` ensures the robot has truly cleared the line before stopping.

### Real Example: Driving Over a Line

Imagine the robot needs to drive forward, cross over a black line, and stop at the *next* black line. The THEN operator makes this natural:

```python
# Cross a line, then stop at the next one:
#   1. First, detect the line (on_black)
#   2. Then drive 5 cm to pass over it (after_cm)
#   3. Then stop at the next black reading (on_black again)
drive_forward(speed=0.8).until(
    on_black(Defs.front.right)       # Hit the first line
    + after_cm(5)                    # Drive past it
    + on_black(Defs.front.right)     # Stop at the next line
)
```

You can chain `+` multiple times — each condition must fire in sequence before the next one starts checking.

### When to Use THEN vs AND

Both can work for "skip the first N cm" scenarios, but they behave differently:

```python
# AND: both checked from the start
drive_forward(speed=1.0).until(
    on_black(Defs.front.right) & after_cm(10)
)
# If the sensor flickers black at cm 5, it won't stop (AND not satisfied).
# If the robot is on a black line at cm 10, it stops immediately.

# THEN: second condition is OFF until the first fires
drive_forward(speed=1.0).until(
    after_cm(10) + on_black(Defs.front.right)
)
# Black detection is completely disabled for the first 10 cm.
# After 10 cm, it starts checking for black.
```

In most cases the result is the same, but THEN is clearer in intent and avoids edge cases where both conditions happen to be true simultaneously.

## Complex Combinations with Parentheses

You can nest and group conditions with parentheses to build arbitrarily complex logic:

```python
# Drive until:
#   (black on left OR black on right) AND at least 15 cm traveled
drive_forward(speed=0.8).until(
    (on_black(Defs.front.left) | on_black(Defs.front.right)) & after_cm(15)
)
```

```python
# Drive until:
#   After 5 cm, THEN (black on sensor OR 3 seconds elapsed)
drive_forward(speed=1.0).until(
    after_cm(5) + (on_black(Defs.front.right) | after_seconds(3))
)
```

```python
# Drive until:
#   (after 10 cm AND on black) OR after 60 cm (absolute safety limit)
drive_forward(speed=1.0).until(
    (after_cm(10) & on_black(Defs.front.right)) | after_cm(60)
)
```

```python
# Really complex:
#   After 5 cm, THEN:
#     (black on left AND black on right)  — both sensors see the line
#     OR after 100 cm                     — safety limit
drive_forward(speed=0.8).until(
    after_cm(5) + (
        (on_black(Defs.front.left) & on_black(Defs.front.right))
        | after_cm(100)
    )
)
```

Use parentheses whenever the intent isn't obvious. They make the logic readable and prevent operator precedence surprises.

## Custom Conditions

Write your own condition with `custom()`:

```python
# Stop when analog reading is in a specific range
drive_forward(speed=0.5).until(
    custom(lambda robot: 1000 < robot.defs.distance_sensor.read() < 2000)
)
```

The lambda receives the robot instance and must return `True` when the condition is met. It's polled at the step's update rate (typically 100 Hz for motion steps).

## Conditions on Different Step Types

Stop conditions work on motion steps — they have a continuous 100 Hz update loop that checks the condition every cycle:

```python
drive_forward(speed=0.8).until(on_black(Defs.front.right))
strafe_right(speed=0.5).until(on_black(Defs.rear.right))
```

> **Note:** Motor steps like `set_motor_velocity()` complete instantly — they send the command and return. Adding `.until()` on them won't work as expected because the step is already finished before the condition is ever checked. To run a motor until a condition, use a separate wait step:
>
> ```python
> seq([
>     set_motor_velocity(Defs.arm_motor, -100),
>     wait_for_digital(Defs.arm_limit),
>     motor_passive_brake(Defs.arm_motor),
> ])
> ```

## Common Patterns

### Line with Safety Limit

Always add a distance or time safety limit when driving to a line. If the sensor misses the line (dust, ambient light, damage), the robot drives forever:

```python
# BAD — drives forever if line is missed
drive_forward(speed=1.0).until(on_black(Defs.front.right))

# GOOD — stops after 80 cm even if no line detected
drive_forward(speed=1.0).until(on_black(Defs.front.right) | after_cm(80))
```

### Skip Starting Line

When the robot starts on or near a line, skip it before looking for the next one:

```python
# Skip first 10 cm, then look for black
drive_forward(speed=1.0).until(after_cm(10) + on_black(Defs.front.right))
```

### Dual-Sensor Confirmation

Wait for both sensors to see the line (more reliable than a single sensor):

```python
drive_forward(speed=0.5).until(
    on_black(Defs.front.left) & on_black(Defs.front.right)
)
```

### Single-Robot Timing Gate

Use `wait_for_checkpoint()` inside a sequence to hold the robot until a safe time window, even without a partner robot. The ConeBot uses arithmetic in the argument for readability:

```python
drive_backward().until(after_cm(70)),
wait_for_checkpoint(60 + 27),    # Hold until T=87s — other robots clear the area
drive_backward().until(after_cm(30)),
```

See **[Synchronizing Two Robots]({{< ref "03a-synchronizing-robots" >}})** for the full timing-gate reference.

### Stall Detection with Timeout

Detect a motor stall but don't wait forever:

```python
drive_forward(speed=0.3).until(
    stall_detected(Defs.front_left_motor) | after_seconds(5)
)
```

## Related Pages

- **[Steps DSL]({{< ref "04-steps" >}})** — how builders and `.until()` fit the overall step model
- **[Missions]({{< ref "03-missions" >}})** — composing steps with `seq()`, `parallel()`, and control flow
- **[Synchronizing Two Robots]({{< ref "03a-synchronizing-robots" >}})** — `wait_for_checkpoint()` as a timing gate
