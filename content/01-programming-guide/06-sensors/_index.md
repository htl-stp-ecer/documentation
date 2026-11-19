---
title: "Sensors"
author: "Mario Scholze"
date: 2026-11-15
draft: false
weight: 60
description: "IR sensors, analog (ET) sensors and buttons: declaring them and using them as stop conditions."
---

# Sensors

Sensors are declared in `config/hardware.yml` and used in missions through `Defs`. Most of them double as stop conditions for driving steps, for example `drive_forward().until(on_black(Defs.front.left))`.

| Page | What it covers |
|------|----------------|
| [Sensors]({{< ref "/01-programming-guide/06-sensors/01-sensors.md" >}}) | IR sensors and sensor groups, digital sensors (buttons), analog sensors, ET distance sensors, stall detection |
| [Wait for Light]({{< ref "/01-programming-guide/06-sensors/02-wait-for-light.md" >}}) | Starting the run on the start lamp |

IR sensors need calibration to give reliable readings, see [IR Sensor Calibration]({{< ref "/01-programming-guide/03-calibration/02-ir-calibration.md" >}}).
