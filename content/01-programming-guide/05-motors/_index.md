---
title: "Motors"
author: "Mario Scholze"
date: 2026-11-15
draft: false
weight: 50
description: "Motor config and steps for motors that are not part of the drivetrain: position, velocity and stop."
---

# Motors

The drivetrain motors are driven through the chassis (`drive_forward`, `turn_right`, ...). This section is for **all other motors**, for example an arm or a lift, which you command directly.

| Page | What it covers |
|------|----------------|
| [Motor Steps]({{< ref "/01-programming-guide/05-motors/01-motor-steps.md" >}}) | Position steps, velocity steps, stop modes, getting a motor by port |

Motors are declared in `config/motors.yml` (port, `inverted`, calibration), see the [Configuration Reference]({{< ref "/01-programming-guide/01-basics/02-config-reference.md" >}}). Use these steps only for motors outside the drivetrain: commanding a drivetrain motor directly fights the chassis controller.
