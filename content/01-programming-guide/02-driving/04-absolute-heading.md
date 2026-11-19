---
title: "Absolute Heading"
author: "Mario Scholze"
date: 2026-11-15
draft: false
weight: 40
description: "Mark a heading once and then turn to it or hold it, so turning errors do not add up over a mission."
---

# Absolute Heading

`turn_right(90)` turns **90 degrees from wherever the robot is now**. After ten turns, every small error is still in the robot's heading. **Absolute heading** fixes this: you mark a reference once, for example after squaring up on a wall, and from then on you say *which direction* the robot should face, not how far to turn.

```python
from raccoon import *

seq([
    wall_align_backward(accel_threshold=0.3),   # the robot now faces a known direction
    mark_heading_reference(),                    # call this direction 0 degrees

    drive_forward(cm=50),
    turn_to_heading_right(90),                   # face 90 degrees clockwise from the reference
    drive_forward(cm=30, heading=90),            # and keep exactly this heading while driving
    turn_to_heading_right(0),                    # back to the reference, no matter how the robot drifted
])
```

---

## The three building blocks

### 1. `mark_heading_reference()`

Stores the robot's current IMU heading as the reference (0 degrees). Call it once, early: right after `wait_for_light()` or right after a wall alignment.

```python
mark_heading_reference()                                   # current facing = 0 degrees
mark_heading_reference(origin_offset_deg=-30)              # robot starts 30 degrees clockwise of the board's forward
mark_heading_reference(positive_direction="right")         # count clockwise angles as positive
```

| Parameter | Default | Meaning |
|-----------|---------|---------|
| `origin_offset_deg` | `0.0` | Added to the captured heading. Use it to make 0 degrees mean "forward on the board" however the robot starts |
| `positive_direction` | `"left"` | `"left"`: counter-clockwise angles are positive. `"right"`: clockwise angles are positive |

The reference uses the raw IMU heading, so it survives odometry resets between steps. Calling it again overwrites the reference, and it stays valid across missions in one run.

### 2. `turn_to_heading_right(degrees)` and `turn_to_heading_left(degrees)`

Turn until the robot faces the given heading relative to the reference. The direction is part of the name, and `degrees` is always positive. There is no plain `turn_to_heading()`.

### 3. `heading=` on drive steps

`drive_forward`, `drive_backward`, `strafe_left` and `strafe_right` accept `heading=`. The robot then holds that absolute heading for the whole drive, correcting drift with IMU feedback, instead of holding "whatever the heading was at the start". It is also available as a builder call: `drive_forward(25).heading(90)`.

```python
drive_backward(cm=200)                  # relative: may end 5 to 10 degrees off after 200 cm
drive_backward(cm=200, heading=180)     # absolute: locked to 180 degrees the whole way
```

Use it for long drives (about 50 cm and more on mecanum), after any wall alignment, and per segment in a [`smooth_path`]({{< ref "/01-programming-guide/02-driving/05-smooth-path.md" >}}).

> **Always call `mark_heading_reference()` first.** `turn_to_heading_*` and `heading=` are interpreted relative to the reference, and they need one.

---

## Why this beats relative turns

```python
# Relative: every turn adds a little error
seq([turn_right(90), drive_forward(30), turn_left(90), drive_forward(30), turn_right(90)])

# Absolute: each turn goes to a fixed direction, errors do not accumulate
seq([
    mark_heading_reference(),
    turn_to_heading_right(90), drive_forward(30),
    turn_to_heading_right(0),  drive_forward(30),
    turn_to_heading_right(90),
])
```

---

## Related pages

- [Odometry]({{< ref "/01-programming-guide/02-driving/10-odometry.md" >}}): the heading reference in depth, including ramp robots and `origin_offset_deg`.
- [Drive System]({{< ref "/01-programming-guide/02-driving/01-drive-system.md" >}}): heading hold during linear motion.
- [Wall Alignment]({{< ref "/01-programming-guide/02-driving/09-wall-alignment.md" >}}): the usual way to get a trustworthy heading to mark.
- [Optimize]({{< ref "/01-programming-guide/02-driving/06-optimize.md" >}}): `.absolute_heading()` pins every straight leg of a path to one heading.
