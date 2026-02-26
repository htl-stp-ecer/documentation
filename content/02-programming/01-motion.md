---
title: "Motion"
date: 2024-01-01
draft: false
weight: 2
---

# Motion

The motion API provides high-level commands for moving the robot. All commands block until the movement is complete before returning, so you can chain them in sequence without extra coordination.

All motion commands are accessed through `self.robot.motion` inside a mission.

---

## Driving Straight

```python
self.robot.motion.drive(distance_mm=500)
```

Drives the robot straight forward by the given distance in millimetres. Use a negative value to drive backward:

```python
self.robot.motion.drive(distance_mm=-200)   # drive backward 200 mm
```

---

## Turning

```python
self.robot.motion.turn(angle_deg=90)
```

Rotates the robot in place by the given angle in degrees. Positive values turn **right** (clockwise), negative values turn **left** (counter-clockwise):

```python
self.robot.motion.turn(angle_deg=-45)    # turn left 45 degrees
self.robot.motion.turn(angle_deg=180)    # turn around
```

---

## Strafing (Mecanum Only)

```python
self.robot.motion.strafe(distance_mm=200)
```

Moves the robot sideways without turning. Positive values move **right**, negative values move **left**. Only available on robots with a mecanum drivetrain.

```python
self.robot.motion.strafe(distance_mm=-150)   # strafe left 150 mm
```

---

## Example Sequence

```python
def sequence(self):
    # Drive forward 50 cm
    self.robot.motion.drive(distance_mm=500)

    # Turn right 90 degrees
    self.robot.motion.turn(angle_deg=90)

    # Drive forward 30 cm
    self.robot.motion.drive(distance_mm=300)

    # Turn left 45 degrees
    self.robot.motion.turn(angle_deg=-45)

    # Drive backward 10 cm
    self.robot.motion.drive(distance_mm=-100)
```

---

## Motion Accuracy Tips

- **Calibrate your motors** before relying on accurate distances and angles. See [Motor Calibration]({{< ref "/01-raccoon-cli/04-calibration" >}}).
- Ensure the **wheels are clean** and the surface is flat and consistent. Slipping wheels reduce accuracy.
- For mecanum robots, avoid extremely tight turning radii when precision is needed — use `turn` for in-place rotation.
- Check `raccoon.project.yml` to confirm the **wheel diameter** and **track width** values match your actual robot — wrong values will cause systematic errors in all movements.

---

## Combining Motion with Sensors

You can stop a motion command early based on sensor input using the [Step Framework]({{< ref "/02-programming/03-steps" >}}), for example stopping when an IR sensor detects a line.
