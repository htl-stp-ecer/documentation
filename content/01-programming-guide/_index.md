---
title: "Programming Guide"
author: "Mario Scholze"
date: 2026-11-15
draft: false
weight: 10
description: "Learn to program a Botball robot with raccoon, in the order you need it: project basics, driving, calibration, servos, motors, sensors and custom steps."
---

# Programming Guide

This guide teaches you how to program a robot with `raccoon-lib`. It follows the order in which a new team usually needs things: first how a project is built and run, then driving, then calibration, servos, motors and sensors, and finally how to write your own steps.

You write **missions**: Python classes whose `sequence()` describes step by step what the robot does. The library takes care of kinematics, PID control, odometry and talking to the hardware.

```python
from raccoon import *

class M010DriveToZone(Mission):
    def sequence(self) -> Sequential:
        return seq([
            drive_forward(cm=40),
            turn_right(degrees=90),
            drive_forward().until(on_black(Defs.front.left)),
        ])
```

> **New here?** Finish [Getting Started]({{< ref "/00-getting-started/_index.md" >}}) first. You need a running project and a connected robot to try anything in this guide. The exact signature of every step is in the [Steps Reference]({{< ref "/02-steps-reference/_index.md" >}}).

---

## The learning path

| # | Section | You learn |
|---|---------|-----------|
| 1 | [Basics]({{< ref "/01-programming-guide/01-basics/_index.md" >}}) | How a project is built, the base config, code generation, missions, `raccoon run` and run configurations, `parallel` and `background` |
| 2 | [Driving]({{< ref "/01-programming-guide/02-driving/_index.md" >}}) | `drive`, `turn`, arcs, strafing on mecanum, stop conditions, absolute heading, line following, optimizing paths |
| 3 | [Calibration]({{< ref "/01-programming-guide/03-calibration/_index.md" >}}) | Making the robot drive accurately and the IR sensors read reliably |
| 4 | [Servos]({{< ref "/01-programming-guide/04-servos/_index.md" >}}) | Servo config (offsets, named positions) and servo steps |
| 5 | [Motors]({{< ref "/01-programming-guide/05-motors/_index.md" >}}) | Motor config, position and velocity commands for motors that are not part of the drivetrain |
| 6 | [Sensors]({{< ref "/01-programming-guide/06-sensors/_index.md" >}}) | IR sensors, analog (ET) sensors, buttons |
| 7 | [Custom Steps]({{< ref "/01-programming-guide/07-custom-steps/_index.md" >}}) | Writing your own steps and composing them with `seq(...)` |
| 8 | [More Topics]({{< ref "/01-programming-guide/08-more-topics/_index.md" >}}) | IMU, localization, table maps, two robots, arm, UI steps, simulator, competition checklist |
| 9 | [Camera]({{< ref "/01-programming-guide/09-camera/_index.md" >}}) | The camera service `raccoon-cam` (work in progress) |

---

## Where things live

- **Concepts and architecture:** [How Raccoon works]({{< ref "/06-advanced/02-project-model.md" >}}) explains the project model, `Defs` and the mission lifecycle. The full layer diagram is in [Advanced → Architecture]({{< ref "/06-advanced/01-architecture.md" >}}).
- **Command line tools:** [Raccoon CLI]({{< ref "/03-raccoon-cli/_index.md" >}}) and the visual [WebIDE]({{< ref "/04-web-ide/_index.md" >}}).
- **Every step with its signature:** [Steps Reference]({{< ref "/02-steps-reference/_index.md" >}}).
