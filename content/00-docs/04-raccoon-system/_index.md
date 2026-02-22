---
title: "Raccoon System"
date: 2024-01-01
draft: false
weight: 5
---

# The Raccoon System

Raccoon is a fully custom robotics platform built by the HTL St. Polten team for Botball competitions. It replaces the stock KIPR software stack with a modern, modular system designed for precision, extensibility, and developer experience.

## What Makes Raccoon Different

Instead of using the KISS IDE and stock Wombat firmware, Raccoon provides:

- **Custom STM32 firmware** with 200 Hz PID motor control and 9-axis IMU fusion
- **A C++20 robotics library (libstp)** with Python bindings for motion control, kinematics, and odometry
- **A developer toolchain** with project scaffolding, code generation, and remote execution
- **A Flutter-based touchscreen UI** running directly on the Raspberry Pi
- **LCM messaging** connecting all components via efficient UDP multicast
- **Simulation tools** for testing without hardware

## Documentation Overview

- [Architecture](/00-docs/04-raccoon-system/00-architecture/) -- System layers, components, and data flow
- [Zero to Hero](/00-docs/04-raccoon-system/01-zero-to-hero/) -- Complete guide from nothing to a running robot
- [Firmware](/00-docs/04-raccoon-system/02-firmware/) -- STM32 firmware and the Pi-side data reader
- [Library (libstp)](/00-docs/04-raccoon-system/03-library/) -- The core robotics library and Python API
- [Toolchain](/00-docs/04-raccoon-system/04-toolchain/) -- The `raccoon` CLI for project management
- [User Interface](/00-docs/04-raccoon-system/05-user-interface/) -- The Flutter touchscreen UI (botui)
- [Communication](/00-docs/04-raccoon-system/06-communication/) -- LCM channels, message types, and protocols
- [Simulation & Vision](/00-docs/04-raccoon-system/07-advanced/) -- Simulators, object detection, path planning
