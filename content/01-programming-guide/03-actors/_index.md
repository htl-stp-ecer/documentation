---
title: "Actors"
author: "Mario Scholze"
date: 2026-11-19
draft: false
weight: 30
description: "The things your robot moves besides the drivetrain: servos and aux motors."
---

# Actors

Actors are the parts of the robot that move something, other than the drivetrain. There are two kinds, and each has its own config file.

| Section | Config file | What it covers |
|---------|-------------|----------------|
| [Servos]({{< ref "/01-programming-guide/03-actors/01-servos/_index.md" >}}) | `config/servos.yml` | Servos, named positions, offsets and calibration |
| [Motors]({{< ref "/01-programming-guide/03-actors/02-motors/_index.md" >}}) | `config/motors.yml` | Chassis motors versus aux motors, and how to drive the aux motors |

The drivetrain itself is controlled by the [driving steps]({{< ref "/01-programming-guide/02-driving/_index.md" >}}).
