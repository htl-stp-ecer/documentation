---
title: "Sensor Groups"
author: "Tobias Madlberger, Mario Scholze"
date: 2026-11-19
draft: false
weight: 30
description: "SensorGroup: bundling IR sensors with defaults and the pre-bound drive, strafe, follow and lineup steps."
---

# Sensor Groups

A `SensorGroup` bundles one or two IR sensors and pre-binds the common step patterns to them, so you write `Defs.front.drive_until_black()` instead of building the step and its stop condition by hand. It also stores default threshold, speed and line-follow PID values for the pair.

## Declaration

```yaml
# config/hardware.yml
front:
  type: SensorGroup
  left: front_left_ir_sensor
  right: front_right_ir_sensor
  threshold: 0.6
  follow_kp: 0.6
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `type` | `string` | | Must be `SensorGroup`. |
| `left` | `string` | | Name of the left sensor in `hardware.yml`. |
| `right` | `string` | | Name of the right sensor in `hardware.yml`. |
| `threshold` | `float` | `0.7` | Default `probabilityOfBlack` / `probabilityOfWhite` threshold (0.0 to 1.0). |
| `speed` | `float` | `1.0` | Default speed fraction for the non-follow methods. |
| `follow_speed` | `float` | `0.8` | Speed for `follow_right_edge()` and `follow_right_until_black()`. |
| `follow_kp` | `float` | `0.5` | Line-follow PID proportional gain. |
| `follow_ki` | `float` | `0.02` | Line-follow PID integral gain. |
| `follow_kd` | `float` | `0.0` | Line-follow PID derivative gain. |

At least one of `left` or `right` is required. The sensors are referenced by name, not as strings in the generated code.

**Single-sensor groups are valid.** Many robots have only one IR sensor on a side, so leave out the one you do not have:

```yaml
front:
  type: SensorGroup
  right: front_right_ir_sensor
```

```python
Defs.front.drive_until_black()           # uses Defs.front.right
Defs.front.strafe_right_until_black()    # uses Defs.front.right by default
```

## Methods

Every method returns a step builder that works inside `seq([...])` and `parallel(...)` just like any other step. All accept optional `speed` and `threshold` overrides to use values different from the group defaults.

| Method | Description |
|--------|-------------|
| `.drive_until_black(speed, threshold)` | Drive forward until any sensor sees black |
| `.drive_until_white(speed, threshold)` | Drive forward until any sensor sees white |
| `.drive_over_line(speed, threshold)` | Drive forward through black then white (crosses one line) |
| `.drive_backward_until_black(sensor, speed, threshold)` | Drive backward until the specified sensor (default: right) sees black |
| `.lineup_on_black(threshold)` | Align both sensors on a black line (forward lineup) |
| `.lineup_on_white(threshold)` | Align both sensors on a white area (forward lineup) |
| `.backward_lineup_on_black()` | Align both sensors on a black line (backward lineup) |
| `.backward_lineup_on_white()` | Align both sensors on a white area (backward lineup) |
| `.strafe_left_until_black(sensor, speed, threshold)` | Strafe left until the specified sensor (default: left) sees black |
| `.strafe_right_until_black(sensor, speed, threshold)` | Strafe right until the specified sensor (default: right) sees black |
| `.strafe_right_until_white(sensor, speed, threshold)` | Strafe right until the specified sensor sees white |
| `.follow_right_edge(cm, speed)` | Follow the right edge of a line for the given distance |
| `.follow_right_until_black(speed)` | Follow line on right sensor until the **left** sensor sees black |

> **`follow_right_until_black()` stop condition:** Despite the method name mentioning the right sensor for following, the stop condition monitors the **left** sensor at threshold 1.0. This is intentional — it is designed to follow along a line until the robot arrives at an intersection where the left sensor detects a perpendicular line.

## Per-call overrides

Default values can be overridden per call:

```python
front = SensorGroup(left=front_left_ir, right=front_right_ir, threshold=0.7)

# Use the group default threshold
front.lineup_on_black()

# Override threshold for this call only
front.lineup_on_black(threshold=0.5)

# Override speed for this call only
front.strafe_left_until_black(speed=0.3, threshold=0.3)

# Specify which sensor to use
front.strafe_left_until_black(sensor=front.right)
```
