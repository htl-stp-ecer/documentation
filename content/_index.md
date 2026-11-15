---
title: "RaccoonOS Documentation"
author: "Tobias Madlberger"
date: 2024-01-01
draft: false
---

# RaccoonOS

**A full custom robotics platform for competitive Botball — built from scratch, documented for everyone.**

> *"Raise the Floor, Don't Lower the Ceiling"*

---

## What is RaccoonOS?

RaccoonOS is a robotics platform for competitive Botball that runs on the [KIPR Wombat](https://www.kipr.org/kipr/hardware-software) controller. It covers everything from the STM32 firmware up to a visual mission editor, and all parts talk to each other over one shared transport.

You write missions in Python. The platform handles kinematics, PID control, odometry, sensor fusion and the hardware communication underneath. You do not need to touch C++ to build a competitive robot.

```bash
# create the project with the setup script (see Getting Started), then, inside it:
raccoon connect 192.168.1.100
raccoon run
```

New here? Start with **[Getting Started →]({{< ref "/00-getting-started/_index.md" >}})**

---

## Platform at a glance

| Part | What it does |
|------|--------------|
| **raccoon-lib** | Python SDK on a C++20 core: steps, missions, motion control, odometry, sensors |
| **raccoon CLI** | Laptop tool: code generation, sync, running programs on the robot, logs |
| **Web IDE** | Visual flowchart editor that generates real Python |
| **Bot UI** | The touchscreen UI on the robot: sensors, programs, WiFi, settings |
| **STM32 firmware and reader** | Motor control and IMU on the microcontroller, bridged to the Pi over SPI |
| **raccoon-transport** | Messages and shared-memory transport between all components |
| **raccoon-cam** | Camera service with pluggable image processors |

How these fit together is in [Advanced → Platform at a glance]({{< ref "/06-advanced/_index.md" >}}).

---

## Documentation sections

| Section | What it covers |
|---------|----------------|
| [Getting Started]({{< ref "/00-getting-started/_index.md" >}}) | Flash the SD card, create a project, connect to the robot and run your first mission |
| [Programming Guide]({{< ref "/01-programming-guide/_index.md" >}}) | Learn the `raccoon` SDK step by step: basics, driving, calibration, servos, motors, sensors, custom steps |
| [Steps Reference]({{< ref "/02-steps-reference/_index.md" >}}) | Every step with signature and parameters |
| [raccoon CLI]({{< ref "/03-raccoon-cli/_index.md" >}}) | All CLI commands: `connect`, `run`, `sync`, `logs`, `doctor`, ... |
| [Web IDE]({{< ref "/04-web-ide/_index.md" >}}) | The visual flowchart editor for building missions |
| [Bot UI]({{< ref "/05-bot-ui/_index.md" >}}) | The touchscreen UI on the robot |
| [Advanced]({{< ref "/06-advanced/_index.md" >}}) | Architecture, transport, firmware and the Web IDE internals |
| [Build and Contribute]({{< ref "/07-build-and-contribute/_index.md" >}}) | Build components yourself, releases, CI and how to contribute |

---

## Origins

RaccoonOS grew out of Tobias Madlberger's years competing in Botball at HTL St. Pölten (2022–2026). What started as competition code went through multiple complete rewrites, slowly becoming a proper platform — not by design, but by necessity.

The platform was formally named *RaccoonOS* in September 2025. On graduating in 2026, Tobias open-sourced everything — not just for future HTL teams, but for every Botball student who would otherwise face the same wall he hit in 2022: no documentation, no foundation, no starting point.

> *"Three years of figuring out what nobody wrote down — now it's written down."*
