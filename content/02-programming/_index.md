---
title: "Programming"
author: "Florian Schwanzer"
date: 2026-06-18
draft: false
weight: 3
---

# Programming Guide

This section covers everything you need to program robots with the **raccoon** SDK — from writing your first mission to tuning low-level motor controllers.

## The Mental Model

`raccoon` is a layered framework. You write missions in Python using a high-level DSL; the control loops, kinematics, and hardware drivers run in compiled C++ underneath. You never need to write C++ to build a competition robot.

**Three things you touch directly:**
1. **YAML config** (`raccoon.project.yml` and `config/*.yml`) — describes your hardware, drive geometry, and mission list. The CLI reads this and generates Python.
2. **Mission files** (`src/missions/*.py`) — describe what the robot does, step by step. You own these entirely.
3. **Custom step files** (`src/steps/*.py`) — reusable behaviors you package as functions or classes.

**Two things the CLI generates for you — do not edit by hand:**
- `src/hardware/defs.py` — every motor, servo, and sensor as Python objects
- `src/hardware/robot.py` — the `Robot` class with kinematics, drive, and odometry wired together

The YAML is the single source of truth for hardware. Change hardware in YAML, run `raccoon run`, and the generated files update automatically.

```mermaid
graph TD
    A["Your Mission Code (Python)"] --> B["Step DSL"]
    B --> C["Motion Controller"]
    C --> D["Drive + Kinematics"]
    D --> E["HAL (Hardware Abstraction)"]
    E --> F["Wombat Platform Driver"]
    F --> G["Motors / Servos / Sensors"]

    style A fill:#4CAF50,color:#fff
    style B fill:#66BB6A,color:#fff
    style C fill:#42A5F5,color:#fff
    style D fill:#42A5F5,color:#fff
    style E fill:#AB47BC,color:#fff
    style F fill:#AB47BC,color:#fff
    style G fill:#FF7043,color:#fff
```

## Suggested Reading Path

**New to raccoon?** Read in this order:
1. [Your First Robot Program]({{< ref "00a-first-robot-program" >}}) — hands-on, no prerequisites
2. [Project Structure]({{< ref "01-project-structure" >}}) — understand what files do what
3. [Robot Definition]({{< ref "02-robot-definition" >}}) — configure your specific hardware
4. [Missions]({{< ref "03-missions" >}}) — write real competition code
5. [Stop Conditions]({{< ref "04a-stop-conditions" >}}) + [Calibration]({{< ref "10-calibration" >}}) — make it accurate

**Want the full picture first?** Read [Architecture & Project Model]({{< ref "00b-architecture-concepts" >}}) and [Architecture Overview]({{< ref "00-overview" >}}) before anything else.

## Sections

| Page | What You'll Learn |
|------|-------------------|
| [Architecture Overview]({{< ref "00-overview" >}}) | The full layer stack, how pieces connect |
| [Your First Robot Program]({{< ref "00a-first-robot-program" >}}) | Hands-on tutorial: drive, servos, sensors, first mission |
| [Architecture & Project Model]({{< ref "00b-architecture-concepts" >}}) | Deep dive: layered stack, YAML→codegen→runtime, mission lifecycle |
| [Project Structure]({{< ref "01-project-structure" >}}) | Files, folders, and configuration |
| [Robot Definition]({{< ref "02-robot-definition" >}}) | Declaring hardware, kinematics, and drive |
| [Missions]({{< ref "03-missions" >}}) | Writing and sequencing missions |
| [Synchronizing Two Robots]({{< ref "03a-synchronizing-robots" >}}) | Multi-robot coordination over the network |
| [Steps DSL]({{< ref "04-steps" >}}) | The motion/action building blocks |
| [Stop Conditions]({{< ref "04a-stop-conditions" >}}) | Combining conditions with OR, AND, THEN |
| [Custom Steps]({{< ref "05-custom-steps" >}}) | Writing your own reusable steps |
| [Sensors]({{< ref "06-sensors" >}}) | IR, analog, digital, and camera sensors |
| [Drive System]({{< ref "07-drive-system" >}}) | Kinematics, velocity control, PID tuning |
| [Odometry]({{< ref "08-odometry" >}}) | Position tracking and heading reference |
| [Servos]({{< ref "09-servos" >}}) | Servo control and presets |
| [Motor Steps]({{< ref "09a-motor-steps" >}}) | Direct motor control for arms, conveyors, and mechanism actuators |
| [Calibration]({{< ref "10-calibration" >}}) | Motor and sensor calibration workflow |
| [Advanced Topics]({{< ref "11-advanced" >}}) | Async, timing, transport, debugging |
| [UI Steps & Screens]({{< ref "12-ui-steps" >}}) | Touchscreen UI, widgets, custom screens |
| [Configuration Reference]({{< ref "13-configuration-reference" >}}) | Complete reference for every YAML configuration key |
| [IMU]({{< ref "14-imu" >}}) | Inertial measurement unit integration and heading reference |
| [Competition Ready]({{< ref "15-competition-ready" >}}) | Checklist and tuning guide for competition day |
| [Simulator And Testing]({{< ref "16-simulator-testing" >}}) | Running missions in the built-in simulator and writing pytest fixtures |
| [Table Maps]({{< ref "17-table-maps" >}}) | Field map format, coordinate conventions, and IDE integration |
| [YAML Includes]({{< ref "18-yaml-includes" >}}) | `!include` and `!include-merge` semantics and write-back behavior |
| [Motion Flow and Kinematics]({{< ref "19-motion-flow-and-kinematics" >}}) | How motion profiles, drive control, kinematics, HAL, and firmware fit together |
| [Arm Kinematics and Code Generation]({{< ref "20-arm-kinematics-and-codegen" >}}) | The actual `ArmChain` pipeline: IK, servo mapping, guards, and runtime behavior |
| [Smooth Path and Spline Motion]({{< ref "21-smooth-path" >}}) | Continuous fluid motion across waypoints using `smooth_path()` and `spline()` |
| [Localization and Resync]({{< ref "22-localization-resync" >}}) | Particle-filter localization, drift correction, and resync step injection |

### Deep Dives

| Page | What It Does |
|------|-------------|
| [Line Following]({{< ref "algorithms/line-following" >}}) | PID-based edge tracking with profiled and directional variants |
| [Lineup]({{< ref "algorithms/lineup" >}}) | Single-pass geometric line alignment |
| [IR Sensor Calibration (K-Means)]({{< ref "algorithms/ir-calibration" >}}) | Clustering-based threshold detection for IR sensors |
| [Wait for Light]({{< ref "algorithms/wait-for-light" >}}) | Kalman-filtered start lamp detection with test/arm workflow |
