---
title: "Strafe and Mecanum"
author: "Mario Scholze"
date: 2026-11-15
draft: false
weight: 20
description: "Sideways and diagonal driving on mecanum and omni robots: strafe_left, strafe_right, strafe arcs and drive_angle."
---

# Strafe and Mecanum

A **mecanum** (or omni-wheel) robot can move sideways without turning. A differential robot cannot strafe, so these steps need a mecanum or omni drivetrain.

Which drivetrain you have is set in `config/robot.yml` under `drive.kinematics` (`type: mecanum`). Mecanum needs two measurements, `track_width` (left to right) and `wheelbase` (front axle to rear axle), both in **meters**. See [Configure Your Hardware]({{< ref "/00-getting-started/05-configure-your-hardware.md" >}}).

---

## Strafe left and right

```python
from raccoon import *

seq([
    strafe_left(cm=20),                                   # 20 cm to the left
    strafe_right(cm=15, speed=0.5),                       # half speed
    strafe_left().until(on_black(Defs.front.left)),       # until a sensor sees black
])
```

| Parameter | Description |
|-----------|-------------|
| `cm` | Distance in cm. Leave it out if you use `until` |
| `speed` | Fraction of the maximum speed, 0.0 to 1.0 (default `1.0`) |
| `until` | A [stop condition]({{< ref "/01-programming-guide/02-driving/03-stop-conditions.md" >}}), also available as `.until(...)` |
| `heading` | Hold an absolute heading while strafing (see below) |

The IMU keeps the heading while the robot moves sideways.

---

## Holding a heading on long strafes

On mecanum robots, sideways drift couples into rotation, so long drives slowly turn the robot. Pass `heading=` to lock the robot to an absolute heading for the whole step:

```python
seq([
    mark_heading_reference(),
    strafe_left(cm=80, heading=0),
])
```

`heading=` needs a heading reference, see [Absolute Heading]({{< ref "/01-programming-guide/02-driving/04-absolute-heading.md" >}}). The drive system page recommends it for drives longer than about 50 cm.

---

## Strafe arcs

`strafe_arc_left` and `strafe_arc_right` strafe and rotate at the same time and trace a circular arc:

```python
from raccoon.step.motion import strafe_arc_left, strafe_arc_right

strafe_arc_left(radius_cm=30, degrees=90)
strafe_arc_right(radius_cm=50, degrees=45, speed=0.5)
```

---

## Diagonal drives with `drive_angle`

`drive_angle` drives in any direction of the robot frame. The angle is measured clockwise from forward: `0` is forward, `90` pure right, `-90` pure left, `180` backward.

```python
from raccoon.step.motion import drive_angle

drive_angle(45, cm=30)                                  # forward-right for 30 cm
drive_angle(130).until(on_black(Defs.front.left))       # backward-left until the sensor fires
```

`drive_angle_left(angle_deg)` and `drive_angle_right(angle_deg)` take a positive angle measured to that side.

---

## Related pages

- [Drive System]({{< ref "/01-programming-guide/02-driving/01-drive-system.md" >}}): kinematics, velocity control and the full parameter tables.
- [Smooth Path and Spline Motion]({{< ref "/01-programming-guide/02-driving/05-smooth-path.md" >}}): omni robots can curve while rotating to a target heading.
