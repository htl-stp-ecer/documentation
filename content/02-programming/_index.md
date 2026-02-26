---
title: "Programming"
date: 2024-01-01
draft: false
weight: 3
---

# Programming

This section covers how to write mission code using the **LibStp** robotics library that raccoon projects use by default.

All your code lives in `src/missions/` and `src/steps/`. The `src/hardware/` folder is auto-generated — do not edit it.

## Sections

- [Missions]({{< ref "/02-programming/00-missions" >}}) — what missions are and how to structure them
- [Motion]({{< ref "/02-programming/01-motion" >}}) — driving, turning, and strafing commands
- [Sensors & Actuators]({{< ref "/02-programming/02-sensors" >}}) — reading sensors and controlling servos
- [Step Framework]({{< ref "/02-programming/03-steps" >}}) — building complex sequences with Sequential and Parallel steps

## The Robot Object

Every mission receives a `Robot` object via `self.robot`. This is your primary interface to all hardware:

```python
self.robot.motion     # high-level motion commands (drive, turn, strafe)
self.robot.drive      # lower-level drive control
self.robot.sensors    # sensor readings
```

The `Robot` class and everything it exposes is generated based on your `raccoon.project.yml` configuration, so the exact attributes available depend on what hardware you configured.
