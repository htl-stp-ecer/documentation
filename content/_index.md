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

## What Is RaccoonOS?

RaccoonOS is a five-layer robotics stack that runs on the [KIPR Wombat](https://www.kipr.org/kipr/hardware-software) controller. It covers everything from bare-metal STM32 firmware up to a visual drag-and-drop mission editor — with a shared LCM communication backbone tying it all together.

You write missions in Python. The platform handles kinematics, PID control, odometry, sensor fusion, and hardware communication underneath. You don't need to touch C++ to build a competitive robot.

```bash
pip install raccoon-cli
raccoon create project MyRobot
raccoon connect 192.168.1.100
raccoon run
```

New here? Start with the **[Quick Start guide →]({{< ref "/00-quick-start" >}})**

---

## Platform Architecture

Five layers, one platform:

| Layer | Component | What It Does |
|-------|-----------|--------------|
| **Application** | `raccoon-lib` | Python SDK — step DSL, missions, PID, odometry, sensors |
| **Visualization** | BotUI | Flutter touchscreen dashboard — sensor monitoring, program launcher |
| **Visual Editor** | Web IDE | Drag-and-drop flowchart editor that generates real Python |
| **Toolchain** | raccoon-cli | Laptop-side tool — project scaffolding, code generation, remote sync |
| **Firmware** | STM32 firmware | Bare-metal motor control, IMU, SPI bridge to Raspberry Pi |

All layers communicate over **LCM** (Lightweight Communications and Marshalling) — the same message bus whether you're reading sensor data in Python or displaying it in Flutter.

---

## Documentation Sections

| Section | What It Covers |
|---------|----------------|
| [Quick Start]({{< ref "/00-quick-start" >}}) | Flash the SD card, install the CLI, connect to the robot, and run your first mission |
| [BotUI]({{< ref "/01-botui" >}}) | The touchscreen UI on the robot — sensor dashboard, program launcher, settings |
| [Programming Guide]({{< ref "/02-programming" >}}) | The full `raccoon` SDK — missions, steps, sensors, drive system, odometry, servos, calibration |
| [Web IDE]({{< ref "/03-web-ide" >}}) | Visual flowchart editor for building missions without writing code |
| [raccoon-cli]({{< ref "/04-raccoon-cli" >}}) | All CLI commands — `create`, `connect`, `run`, `update`, `list` |
| [API Reference]({{< ref "/05-api-reference" >}}) | Full step and function reference with signatures and parameters |
| [Firmware]({{< ref "/06-firmware" >}}) | STM32 architecture, SPI protocol, motor control, sensor pipeline |

---

## Origins

RaccoonOS grew out of Tobias Madlberger's years competing in Botball at HTL St. Pölten (2022–2026). What started as competition code went through multiple complete rewrites, slowly becoming a proper five-layer platform — not by design, but by necessity.

The platform was formally named *RaccoonOS* in September 2025. On graduating in 2026, Tobias open-sourced everything — not just for future HTL teams, but for every Botball student who would otherwise face the same wall he hit in 2022: no documentation, no foundation, no starting point.

> *"Three years of figuring out what nobody wrote down — now it's written down."*
