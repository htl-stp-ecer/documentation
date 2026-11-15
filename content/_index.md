---
title: "RaccoonOS Documentation"
author: "Tobias Madlberger, Mario Scholze"
date: 2026-11-15
draft: false
---

# RaccoonOS

**A full custom robotics platform for competitive Botball — built from scratch, documented for everyone.**

## What is RaccoonOS?

RaccoonOS is a robotics platform for competitive Botball that runs on the [KIPR Wombat](https://www.kipr.org/kipr/hardware-software) controller. It covers everything from the STM32 firmware up to a visual mission editor, and all parts talk to each other over one shared transport.

You write missions in Python. The platform handles kinematics, PID control, odometry, sensor fusion and the hardware communication underneath. You do not need to touch C++ to build a competitive robot.

## The Platform at a glance

| Part | What it does |
|------|--------------|
| **raccoon-lib** | Python SDK on a C++ core: steps, missions, motion control, odometry, sensors and more |
| **raccoon-cli** | Code generation, project management, running programs on the robot, logs, ... |
| **raccoon-transport** | Messages and shared-memory transport between all components on the robot |
| **raccoon-cam** | Camera service with pluggable image processors and camera backends|
| **botui** | The touchscreen UI on the robot |
| **STM32 Reader and Firmware** | Motor control and IMU on the microcontroller, bridged to the Pi over SPI |
| **WebIDE** | Visual flowchart editor which can generate the python code |

How these fit together is in [Advanced → The platform at a glance]({{< ref "/06-advanced/_index.md" >}}).


## Documentation sections

| Section | What it covers |
|---------|----------------|
| [Getting Started]({{< ref "/00-getting-started/_index.md" >}}) | How to set up RaccoonOS, create a raccoon project and get started on programming|
| [Programming Guide]({{< ref "/01-programming-guide/_index.md" >}}) | Learn Raccoon's steps |
| [Steps Reference]({{< ref "/02-steps-reference/_index.md" >}}) | Every step with signature and parameters |
| [Raccoon CLI]({{< ref "/03-raccoon-cli/_index.md" >}}) | All CLI commands: `connect`, `run`, `sync`, `logs`, `doctor`, ... |
| [WebIDE]({{< ref "/04-web-ide/_index.md" >}}) | The visual flowchart editor for building missions |
| [BotUI]({{< ref "/05-bot-ui/_index.md" >}}) | The touchscreen UI on the robot |
| [Advanced]({{< ref "/06-advanced/_index.md" >}}) | Architecture, transport, firmware and other internals |
| [Build and Contribute]({{< ref "/07-build-and-contribute/_index.md" >}}) | How to build components yourself, how to contribute and how the build system works |


## Origins

RaccoonOS grew out of Tobias Madlberger's years competing in Botball at HTL St. Pölten (2022–2026). What started as competition code went through multiple complete rewrites, slowly becoming a proper platform — not by design, but by necessity.

The platform was formally named *RaccoonOS* in September 2025. On graduating in 2026, Tobias open-sourced everything — not just for future HTL teams, but for every Botball student who would otherwise face the same wall he hit in 2022: no documentation, no foundation, no starting point.

> *"Three years of figuring out what nobody wrote down — now it's written down."*
