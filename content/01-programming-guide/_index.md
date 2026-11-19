---
title: "Programming Guide"
author: "Mario Scholze"
date: 2026-11-19
draft: false
weight: 10
description: "Learn to program a Botball robot with raccoon, in the order you need it: basics, driving, actors, sensors, calibration, camera and custom steps."
---

# Programming Guide

This guide teaches you how to program a robot with `raccoon-lib`. It follows the order in which a new team usually needs things: first how a project is built and run, then driving, the things that move (servos and motors), sensors, calibration, the camera, and finally how to write your own steps.

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
| 1 | [Basics]({{< ref "/01-programming-guide/01-basics/_index.md" >}}) | The concept of raccoon, project and config structure, code generation, run configurations, missions, `seq`, `parallel` and `background`, `wait_for_*` steps, wait for light |
| 2 | [Driving]({{< ref "/01-programming-guide/02-driving/_index.md" >}}) | `drive`, `turn`, arcs, strafing on mecanum, until conditions, absolute heading, line following, lineups, optimizing paths, wall alignment |
| 3 | [Actors]({{< ref "/01-programming-guide/03-actors/_index.md" >}}) | Servos (config, offsets, positions, steps) and motors (chassis versus aux motors, config, steps) |
| 4 | [Sensors]({{< ref "/01-programming-guide/04-sensors/_index.md" >}}) | `hardware.yml`, IR sensors, sensor groups, buttons, analog and ET sensors |
| 5 | [Calibration]({{< ref "/01-programming-guide/05-calibration/_index.md" >}}) | Making the robot drive accurately and the IR sensors read reliably |
| 6 | [Camera]({{< ref "/01-programming-guide/06-camera/_index.md" >}}) | The camera service `raccoon-cam`: client API, backends and processors (work in progress) |
| 7 | [Custom Steps]({{< ref "/01-programming-guide/07-custom-steps/_index.md" >}}) | Writing your own steps with `run`, `defer` and step classes |

IMU, localization, table maps, arm kinematics, UI steps, the simulator, two robots and the competition checklist are in [Advanced]({{< ref "/06-advanced/_index.md" >}}).

---

## Where things live

- **Concepts and architecture:** [How Raccoon works]({{< ref "/06-advanced/02-project-model.md" >}}) explains the project model, `Defs` and the mission lifecycle. The full layer diagram is in [Advanced → Architecture]({{< ref "/06-advanced/01-architecture.md" >}}).
- **Command line tools:** [Raccoon CLI]({{< ref "/03-raccoon-cli/_index.md" >}}) and the visual [WebIDE]({{< ref "/04-web-ide/_index.md" >}}).
- **Every step with its signature:** [Steps Reference]({{< ref "/02-steps-reference/_index.md" >}}).
