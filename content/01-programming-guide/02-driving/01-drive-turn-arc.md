---
title: "Drive, Turn and Arc"
author: "Tobias Madlberger, Mario Scholze"
date: 2026-11-22
draft: false
weight: 10
description: "drive_forward, drive_backward, turn_left, turn_right and arc steps, plus speed mode."
---

# Drive, Turn and Arc

These are the basic motion steps. Every one of them runs a profiled, closed-loop motion: the robot accelerates, cruises and slows down, and the IMU keeps the heading. For accurate distances the robot needs [calibration]({{< ref "/01-programming-guide/05-calibration/_index.md" >}}).

| Step | What it does |
|------|--------------|
| `drive_forward(cm, speed, until, heading)` | Drive straight forward |
| `drive_backward(cm, speed, until, heading)` | Drive straight backward |
| `turn_left(degrees, speed, until)` | Turn counter-clockwise on the spot |
| `turn_right(degrees, speed, until)` | Turn clockwise on the spot |
| `drive_arc_left(radius_cm, degrees, speed)` | Drive along an arc to the left |
| `drive_arc_right(radius_cm, degrees, speed)` | Drive along an arc to the right |
| `drive_arc_segment(heading_degrees, distance_cm, speed)` | Drive an arc given by heading change and distance |

## Drive

```python
drive_forward(25)                       # 25 cm
drive_backward(10, speed=0.5)           # 10 cm at half speed
drive_forward(speed=0.8).until(on_black(Defs.front.right))   # until a sensor fires
drive_forward(80, heading=0)            # hold an absolute heading
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `cm` | `float \| None` | `None` | Distance in cm. Leave it out to drive until the `until` condition fires. |
| `speed` | `float` | `1.0` | Fraction of the maximum speed, 0.0 to 1.0. |
| `until` | `StopCondition` | `None` | Stop condition, see [Until Conditions]({{< ref "/01-programming-guide/02-driving/03-until-conditions.md" >}}). You can also chain `.until(...)`. |
| `heading` | `float \| None` | `None` | Absolute heading to hold during the drive, see [Absolute Heading]({{< ref "/01-programming-guide/02-driving/04-absolute-heading.md" >}}). `None` holds the heading the robot had at the start. |

## Turn

```python
turn_left(90)
turn_right(45, speed=0.5)
turn_left(speed=0.4).until(on_black(Defs.front.left))   # turn until a sensor fires
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `degrees` | `float \| None` | `None` | Angle in degrees. Leave it out to turn until the `until` condition fires. |
| `speed` | `float` | `1.0` | Fraction of the maximum angular speed. |
| `until` | `StopCondition` | `None` | Stop condition. |

Turns are relative to where the robot is now. To turn to a fixed direction on the field, use `turn_to_heading_left` or `turn_to_heading_right` from [Absolute Heading]({{< ref "/01-programming-guide/02-driving/04-absolute-heading.md" >}}).

## Arcs

Arc steps drive the robot along a circular arc: forward motion combined with turning. Use them for smooth cornering without a full stop. Sideways arcs (`strafe_arc_left`, `strafe_arc_right`) are on [Strafe and Mecanum]({{< ref "/01-programming-guide/02-driving/02-strafe-and-mecanum.md" >}}).

### `drive_arc_left` / `drive_arc_right`

Drive forward while turning left or right through the specified angle:

```python
from raccoon.step.motion import drive_arc_left, drive_arc_right

# Quarter-circle turn to the left (CCW) with 30 cm radius
drive_arc_left(radius_cm=30, degrees=90)

# Gentle sweep to the right (CW) at half speed
drive_arc_right(radius_cm=50, degrees=45, speed=0.5)
```

Parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `radius_cm` | `float` | required | Turning radius in cm (measured from arc centre to robot centre) |
| `degrees` | `float` | required | Arc angle — how many degrees the robot rotates |
| `speed` | `float` | `1.0` | Fraction of max speed, 0.0–1.0 |

The arc length travelled is `2 * pi * radius_cm * (degrees / 360)` cm. A 90° arc with 30 cm radius travels about 47 cm along the curve.

### `drive_arc_segment`

Instead of specifying radius and arc angle separately, `drive_arc_segment` lets you specify the desired **heading change** and **travel distance** along the arc. The radius is computed automatically:

```text
radius = distance_cm / radians(|heading_degrees|)
```

```python
from raccoon.step.motion import drive_arc_segment

# Curve left by 10 degrees over 25 cm of travel
drive_arc_segment(heading_degrees=10, distance_cm=25)

# Curve right by 30 degrees over 40 cm at half speed
drive_arc_segment(heading_degrees=-30, distance_cm=40, speed=0.5)
```

Parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| `heading_degrees` | `float` | Positive = left/CCW, negative = right/CW |
| `distance_cm` | `float` | Distance along the arc path (always positive) |
| `speed` | `float` | Fraction of max speed, 0.0–1.0 (default 1.0) |

`drive_arc_segment` is the idiomatic factory for fixed-curve motion when you know how far you want to travel rather than the turning radius. It raises `ValueError` if `heading_degrees` is zero (which would imply infinite radius — use `drive_forward` instead) or if `distance_cm` is not positive.

## Speed Mode

`set_speed_mode()` toggles the firmware's BEMF closed-loop velocity control on or off. In normal mode (SpeedMode disabled), the STM32 measures wheel velocity via back-EMF and uses it to maintain accurate cm distances and angles. SpeedMode disables these measurements, granting roughly 10% additional top speed at the cost of distance and angle precision.

```python
from raccoon.step.motion import set_speed_mode, drive_forward
from raccoon.step.condition import on_black

seq([
    set_speed_mode(True),                              # engage SpeedMode
    drive_forward(speed=1.0).until(on_black(sensor)),  # sensor-terminated only
    set_speed_mode(False),                             # return to normal mode
])
```

**When SpeedMode is active:**
- All motion steps must terminate via a sensor condition (`.until(...)`), time limit, or stall detection
- Distance-based or angle-based goals raise `std::logic_error` — the controller has no velocity feedback to honour them
- Use `set_speed_mode(False)` before any step that uses a distance or angle target

Parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `enabled` | `bool` | required | `True` = SpeedMode on (BEMF off), `False` = return to normal |
| `timeout_s` | `float` | `0.5` | Max seconds to wait for firmware ACK before raising |

The step publishes an transport command, waits for the firmware's acknowledgement on the retained `hardware/feature/state/bemf_active` channel, then updates the library's internal speed-mode flag. If no ACK arrives within `timeout_s` it raises `RuntimeError` to prevent library and firmware state from diverging.
