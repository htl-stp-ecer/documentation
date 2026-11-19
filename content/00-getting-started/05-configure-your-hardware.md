---
title: "Configure your Hardware"
author: "Tobias Madlberger, Mario Scholze"
date: 2026-11-15
draft: false
weight: 50
description: "Describe your motors, servos, sensors and drivetrain dimensions in the project's YAML files."
---

# Configure Your Hardware

The example project ships with a default hardware setup for the drivetrain type you picked. Adjust it to match your robot by editing the YAML files — they are the source of truth for your hardware:

| What to change | File |
|----------------|------|
| Motor ports, `inverted` flags, encoder scaling | `config/motors.yml` |
| Servo ports and named positions | `config/servos.yml` |
| Sensors | `config/hardware.yml` |
| Wheel size, Track width, PIDs, ... | `config/robot.yml` |

The generated `src/hardware/` files are rebuilt from the YAML on every `raccoon run`, so never edit those by hand.

You shouldn't edit most values in `robot.yml`, as those are automatically adjusted by autotune.

→ See [Robot Definition]({{< ref "/01-programming-guide/01-basics/05-robot-definition.md" >}}) for the full YAML reference.

## Measure your robot's dimensions

The drivetrain dimensions live in `config/robot.yml` under `drive.kinematics`. They are what lets the robot turn by exactly 90° and drive exactly 30 cm, so measure them carefully (calipers or a ruler is fine).

> ### ⚠️ UNITS: THE KINEMATICS VALUES ARE IN **METERS**, NOT CM OR INCHES!
>
> `wheel_radius`, `wheelbase` and `track_width` must be entered in **meters**. If you enter centimeters or inches the robot will drive and turn completely wrong (a `wheelbase` of `16` is a 16-meter-wide robot, not a 16 cm one) and it can look like a broken motor or a bad calibration.
>
> | You measured | Convert to meters | Example |
> |--------------|-------------------|---------|
> | millimeters (mm) | divide by 1000 | 34.5 mm → `0.0345` |
> | centimeters (cm) | divide by 100 | 16 cm → `0.16` |
> | inches (in) | multiply by 0.0254 | 6.3 in → `0.16002` |
>
> Note that the `physical:` section further down the same file is the opposite: its keys end in `_cm` (`width_cm`, `x_cm`, ...) and are in **centimeters**. Always go by the unit in the key name or the comment next to it.

### Configuring a differential (two-wheeled) bot

| Key | What to measure |
|-----|-----------------|
| `wheel_radius` | Radius of one wheel: measure the **diameter** with calipers and halve it. Convert to meters. |
| `wheelbase` | Distance between the **left and right wheels**, measured between the points where each wheel touches the ground (contact points), not between the motors or the outside of the robot. In other words, this is the track width. |

```yaml
kinematics:
  type: differential
  wheel_radius: 0.0345   # 6.9 cm wheel diameter -> 3.45 cm radius -> 0.0345 m
  wheelbase: 0.16        # 16 cm between left and right contact points -> 0.16 m
```

### Configuring a mecanum (four-wheeled with omniwheels) bot

> **Careful:** the name `wheelbase` means something different than on a differential robot!

| Key | What to measure |
|-----|-----------------|
| `wheel_radius` | Radius of one wheel: measure the **diameter** with calipers and halve it. Convert to meters. |
| `track_width` | **Left-to-right** distance between the wheel contact points (same measurement as `wheelbase` on a differential robot). |
| `wheelbase` | **Front-to-back** distance between the front and rear axles. |

```yaml
kinematics:
  type: mecanum
  wheel_radius: 0.0345   # 6.9 cm wheel diameter -> 3.45 cm radius -> 0.0345 m
  track_width: 0.16      # 16 cm left to right -> 0.16 m
  wheelbase: 0.12        # 12 cm front axle to rear axle -> 0.12 m
```

If the robot turns too much or too little, the width value (`wheelbase` on differential, `track_width` and `wheelbase` on mecanum) is usually the culprit. If it drives too far or too short, check `wheel_radius`. `raccoon calibrate` can fine-tune the rest later.

## Configuring Motor Direction

**The most critical setting:** all motors must spin **forward** when given a positive power command. Decide which direction is "forward" for your robot, then set `inverted: true` in `config/motors.yml` for any motor that spins the wrong way.
We recommend you plug in all motors with the **red cable facing up** to keep it simple when you for example quickly need to plug in a cable that fell out under stress.
For that, you need to configure the `inverted` property of each motor correctly.
