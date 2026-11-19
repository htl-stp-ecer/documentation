---
title: "Servos"
author: "Mario Scholze"
date: 2026-11-19
draft: false
weight: 10
description: "Declare servos with named positions and offsets, calibrate them and move them in missions."
---

# Servos

Servos are declared in `config/servos.yml` with a port, optional named positions and an offset. In missions you move them by name (`Defs.arm.up()`) instead of by raw angles.

| Page | What it covers |
|------|----------------|
| [Servos in servos.yml]({{< ref "/01-programming-guide/03-actors/01-servos/01-servos-yml.md" >}}) | The config file and what the code generator makes of an entry |
| [Offsets and Calibration]({{< ref "/01-programming-guide/03-actors/01-servos/02-offsets-and-calibration.md" >}}) | Offsets, `raccoon calibrate servos`, finding angles, hardware limits |
| [Servo Positions]({{< ref "/01-programming-guide/03-actors/01-servos/03-servo-positions.md" >}}) | Named positions and calling them in missions |
| [Servo Steps]({{< ref "/01-programming-guide/03-actors/01-servos/04-servo-steps.md" >}}) | Plain angles, slow and shake servos, builder options, power states |
