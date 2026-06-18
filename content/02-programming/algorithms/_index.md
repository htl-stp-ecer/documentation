---
title: "Deep Dives"
author: "Tobias Madlberger"
date: 2026-06-18
draft: false
weight: 20
---

# Deep Dives — Algorithms and Sensor Methods

This section explains the sensor processing, control theory, and geometry behind raccoon's key built-in algorithms. You do not need to read this to use the SDK — the high-level steps handle everything — but this material helps when:

- tuning PID gains or thresholds and you want to understand *why* a parameter exists
- debugging unexpected behavior (oscillation, false triggers, drift)
- implementing a custom step that reuses the same ideas

## Mental model

Every algorithm here follows the same three-phase pattern:

```
  Sense  →  Compute  →  Act
```

| Phase | What happens |
|-------|-------------|
| **Sense** | Read one or two calibrated IR sensors, an IMU, or a light sensor |
| **Compute** | Apply a control law (PID, geometry, Kalman filter) to produce a correction |
| **Act** | Apply a velocity override to the drive, or signal a stop |

The pages in this section go from beginner-relevant (line following, lineup, wait-for-light) to more diagnostic (IR calibration internals, wall alignment parameters).

## Pages in this section

| Page | Core idea | When you need it |
|------|-----------|-----------------|
| [Line Following]({{< ref "line-following" >}}) | PID error from sensor difference → angular or lateral velocity correction | Any surface-tracking mission |
| [Lineup]({{< ref "lineup" >}}) | Single-pass stagger geometry → exact turn angle, no iteration | Squaring up before a pickup or delivery |
| [Wait for Light]({{< ref "wait-for-light" >}}) | Kalman baseline + relative-drop trigger for the start lamp | Every competition run |
| [Wall Alignment]({{< ref "wall-alignment" >}}) | IMU linear-acceleration spike → settle-then-stop, heading reset | Re-localization after odometry drift |
| [IR Sensor Calibration (K-Means)]({{< ref "ir-calibration" >}}) | K-Means clustering separates black/white readings robustly | Understanding calibration quality or debugging mis-triggers |

## Reading order

If you are new: read **Line Following** first (it explains the PID error signal used everywhere), then **Lineup** (pure geometry, no tuning), then **Wait for Light** (competition workflow). Come back to **Wall Alignment** and **IR Calibration** when you need to tune or debug.

Cross-links:
- IR calibration produces the `probabilityOfBlack()` values that line following and lineup consume — see [IR Sensor Calibration]({{< ref "ir-calibration" >}})
- After wall alignment, call `mark_heading_reference()` to lock in the corrected heading for subsequent turns — see [Wall Alignment]({{< ref "wall-alignment" >}})
- Multiple calibration sets (for different floor surfaces) are covered in [Calibration]({{< ref "10-calibration" >}})
