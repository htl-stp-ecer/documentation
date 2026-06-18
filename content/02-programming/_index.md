---
title: "Programming"
author: "Florian Schwanzer"
date: 2026-06-18
draft: false
weight: 3
---

# Programming Guide

This section covers everything you need to program robots with the **raccoon** SDK — from writing your first mission to tuning low-level motor controllers.

The current platform is a layered robotics framework: you write missions in Python using a high-level DSL, while the control loops, kinematics, and hardware drivers run in optimized C++ underneath. You don't need to touch C++ to build a competition robot.

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

## Sections

| Page | What You'll Learn |
|------|-------------------|
| [Architecture Overview]({{< ref "00-overview" >}}) | The full layer stack, how pieces connect |
| [Your First Robot Program]({{< ref "00a-first-robot-program" >}}) | Hands-on tutorial: drive, servos, sensors, first mission |
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
