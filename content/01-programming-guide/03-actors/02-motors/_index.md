---
title: "Motors"
author: "Tobias Madlberger, Mario Scholze"
date: 2026-11-19
draft: false
weight: 20
description: "Chassis motors versus aux motors, and how to configure and drive the aux motors."
---

# Motors

Raccoon has two kinds of motors, and they are controlled in completely different ways.

| | Chassis motors | Aux motors |
|-|----------------|------------|
| What | The drivetrain wheels (front-left, front-right and so on) | Everything else: arm lifts, drum collectors, conveyors, indexers |
| Controlled by | The kinematic model (`DifferentialKinematics` or `MecanumKinematics`), through `drive_forward`, `turn_left`, `strafe_right` and the other [driving steps]({{< ref "/01-programming-guide/02-driving/_index.md" >}}) | Directly, one motor at a time, with the motor steps |
| Named in | `drive.kinematics` of `robot.yml` | Only in `motors.yml` |

```mermaid
flowchart TD
    subgraph "Chassis motors"
        DS["drive_forward(cm)\nturn_left(deg)\nstrafe_right(cm)"] --> KM["Kinematic model\nDifferential / Mecanum"]
        KM --> WHL["Per-wheel velocity commands"]
    end
    subgraph "Aux motors"
        MS["move_motor_to(motor, pos)\nset_motor_dps(motor, dps)\nset_motor_power(motor, pct)"] --> MW["Direct motor command"]
    end
    style DS fill:#4CAF50,color:#fff
    style MS fill:#42A5F5,color:#fff
```

**Never command a chassis motor directly.** Do not use `move_motor_to`, `set_motor_power`, `set_motor_dps` or the other motor steps on a drivetrain motor: you fight the drive controller and the robot drives unpredictably. In the other direction, aux motors are not part of the kinematic model, so `drive_forward` does not move them.

| Page | What it covers |
|------|----------------|
| [Motor config]({{< ref "/01-programming-guide/03-actors/02-motors/01-motor-config.md" >}}) | Declaring a motor in `motors.yml` |
| [Move to Position]({{< ref "/01-programming-guide/03-actors/02-motors/02-move-to-position.md" >}}) | `move_motor_to` and `move_motor_relative` |
| [Other Motor Steps]({{< ref "/01-programming-guide/03-actors/02-motors/03-other-motor-steps.md" >}}) | Velocity, power and stop steps, stop modes, patterns |
