---
title: "Servos"
author: "Mario Scholze"
date: 2026-11-15
draft: false
weight: 40
description: "Declare servos with offsets and named positions, and move them in missions."
---

# Servos

Servos are declared in `config/servos.yml` with a port, a mounting offset and named positions. In missions you then move them by name (`Defs.arm.up()`) instead of by raw angles.

| Page | What it covers |
|------|----------------|
| [Servos]({{< ref "/01-programming-guide/04-servos/01-servos.md" >}}) | Servo config (offset, positions), servo steps, speed and easing, power states, finding angles |

The calibration helper `raccoon calibrate servos` sets the offsets interactively. The `config/servos.yml` keys are also listed in the [Configuration Reference]({{< ref "/01-programming-guide/01-basics/02-config-reference.md" >}}).
