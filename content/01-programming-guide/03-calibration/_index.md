---
title: "Calibration"
author: "Mario Scholze"
date: 2026-11-15
draft: false
weight: 30
description: "Make the robot drive and turn accurately and make IR sensors read reliably on your table."
---

# Calibration

Calibration measures your real robot and writes the results back into the config, so that `drive_forward(30)` really is 30 cm and a sensor reading really means "black".

| Page | What it covers |
|------|----------------|
| [Calibration]({{< ref "/01-programming-guide/03-calibration/01-calibration.md" >}}) | What gets calibrated, the calibration workflow, distance calibration, calibration sets, `--no-calibrate`, when to re-calibrate |
| [IR Sensor Calibration]({{< ref "/01-programming-guide/03-calibration/02-ir-calibration.md" >}}) | How IR sensors learn black and white with K-Means |

The related CLI commands are `raccoon calibrate ticks`, `raccoon calibrate autotune`, `raccoon calibrate servos` and `raccoon calibrate step-response`. Run `raccoon calibrate --help` for details.
