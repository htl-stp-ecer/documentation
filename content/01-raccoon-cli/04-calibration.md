---
title: "Motor Calibration"
date: 2024-01-01
draft: false
weight: 5
---

# Motor Calibration

Motor calibration measures how your specific motors respond to power commands and calculates the best control parameters for accurate motion. Without calibration the robot may overshoot turns or drive crooked.

---

## Before You Calibrate

- **Place the robot on a flat surface** where all wheels can spin freely. The motors will spin during calibration.
- Make sure the **battery is well charged** — low battery causes inaccurate results.
- Ensure `raccoon codegen` has been run at least once so the hardware files exist.

---

## Running Calibration

From inside your project directory, with the robot connected:

```bash
raccoon calibrate
```

raccoon will:

1. Sync your project to the robot
2. Run the calibration routine on the robot (the motors will spin for about 30–60 seconds)
3. Collect the response data and calculate optimal parameters
4. Write the results (PID gains and feedforward values) back to your `raccoon.project.yml`

> **[PICTURE: Robot on the floor with wheels spinning during calibration, terminal showing progress]**

---

## What Gets Calibrated

For each motor, the routine determines:

- **kP, kI, kD** — PID controller gains that correct velocity errors in real time
- **kS** — static friction compensation (the minimum power needed to start moving)
- **kV** — velocity feedforward (how much power per unit of speed)
- **kA** — acceleration feedforward (how much extra power during speed changes)

These values are stored under each motor in `raccoon.project.yml` and are embedded into the generated hardware files the next time you run `raccoon codegen` or `raccoon run`.

---

## Re-Calibrating

Re-run calibration whenever:

- You swap out a motor for a different one
- You change the battery type or robot weight significantly
- You notice that straight driving or turns have become inaccurate

---

## Manual Adjustment

If calibration produces values that feel off (robot still over/undershoots), you can manually edit the `pid` and `ff` sections in `raccoon.project.yml` and then run `raccoon codegen` to apply the changes. Refer to the programming guide for an explanation of what each parameter does.
