---
title: "Sensors"
author: "Mario Scholze"
date: 2026-11-19
draft: false
weight: 40
description: "Declaring sensors in hardware.yml and using IR, digital, analog and ET sensors in missions."
---

# Sensors

Sensors are declared in `config/hardware.yml` and used in missions through `Defs`. Most of them double as [until conditions]({{< ref "/01-programming-guide/02-driving/03-until-conditions.md" >}}) for driving steps, for example `drive_forward().until(on_black(Defs.front.left))`.

Each sensor type has one page that covers its entry in `hardware.yml` and how to use it.

| Page | What it covers |
|------|----------------|
| [hardware.yml]({{< ref "/01-programming-guide/04-sensors/01-hardware-yml.md" >}}) | The config file, the required `button` entry and the special entries |
| [IR Sensors]({{< ref "/01-programming-guide/04-sensors/02-ir-sensors.md" >}}) | Line sensors: shielding, the black/white probability, stop conditions |
| [Sensor Groups]({{< ref "/01-programming-guide/04-sensors/03-sensor-groups.md" >}}) | Pairs of IR sensors with pre-bound drive, strafe, follow and lineup steps |
| [Digital Sensors and Buttons]({{< ref "/01-programming-guide/04-sensors/04-digital-sensors.md" >}}) | Buttons and limit switches |
| [Analog and ET Sensors]({{< ref "/01-programming-guide/04-sensors/05-analog-and-et-sensors.md" >}}) | Raw analog readings and the ET distance sensor |

IR sensors need [calibration]({{< ref "/01-programming-guide/05-calibration/03-collect-ir.md" >}}) to give reliable readings. The start lamp sensor has its own page: [Wait for Light]({{< ref "/01-programming-guide/01-basics/11-wait-for-light.md" >}}). The camera is not a sensor in `hardware.yml`, see [Camera]({{< ref "/01-programming-guide/06-camera/_index.md" >}}).
