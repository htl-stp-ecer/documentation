---
title: "Programming"
date: 2026-03-21
draft: false
weight: 3
---

# Programming Guide

This section covers everything you need to program robots with the **LibSTP** SDK — from writing your first mission to tuning low-level motor controllers.

LibSTP is a layered robotics framework: you write missions in Python using a high-level DSL, while the control loops, kinematics, and hardware drivers run in optimized C++ underneath. You don't need to touch C++ to build a competition robot.

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
| [Project Structure]({{< ref "01-project-structure" >}}) | Files, folders, and configuration |
| [Robot Definition]({{< ref "02-robot-definition" >}}) | Declaring hardware, kinematics, and drive |
| [Missions]({{< ref "03-missions" >}}) | Writing and sequencing missions |
| [Steps DSL]({{< ref "04-steps" >}}) | The motion/action building blocks |
| [Custom Steps]({{< ref "05-custom-steps" >}}) | Writing your own reusable steps |
| [Sensors]({{< ref "06-sensors" >}}) | IR, analog, digital, and camera sensors |
| [Drive System]({{< ref "07-drive-system" >}}) | Kinematics, velocity control, PID tuning |
| [Odometry]({{< ref "08-odometry" >}}) | Position tracking and heading reference |
| [Servos]({{< ref "09-servos" >}}) | Servo control and presets |
| [Calibration]({{< ref "10-calibration" >}}) | Motor and sensor calibration workflow |
| [UI Steps & Screens]({{< ref "12-ui-steps" >}}) | Touchscreen UI, widgets, custom screens |
| [Advanced Topics]({{< ref "11-advanced" >}}) | Async, timing, transport, debugging |
