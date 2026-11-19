---
title: "Collect Drive"
author: "Tobias Madlberger, Mario Scholze"
date: 2026-11-19
draft: false
weight: 10
description: "collect_drive: record a distance sample while a setup motion runs."
---

# Collect Drive

`collect_drive(step)` wraps a motion and records how far the robot really went compared to how far the odometry says it went. The calibration gate later turns these samples into a distance trim, so `drive_forward(50)` covers 50 cm.

```python
collect_drive(drive_forward(50))
```

The wrapped step runs unchanged. While it runs, `collect_drive` compares two distances:

- the **odometry distance**, what the robot thinks it drove
- the **ground truth**, what it really drove

The ground truth comes from a calibration board if one is connected. Without one, the BotUI asks you to measure the distance with a ruler and type it in. That measured value becomes the sample.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `step` | step | | Any step whose motion should be measured, for example a `seq([...])`. |
| `manual_measurement` | `bool` | `True` | When there is no board ground truth: `True` asks you to measure by hand, `False` records no sample for this drive. |

```python
# Ask for a manual measurement if no board is connected (default)
collect_drive(drive_forward(50))

# Only sample when a board is connected, otherwise record nothing
collect_drive(drive_forward(50), manual_measurement=False)
```

## Which axis is measured

`collect_drive` finds the axis from what the robot did: if most of the odometry displacement was forward or backward, the sample counts for the **forward** axis, if it was sideways, for the **lateral** axis. You do not declare it. See [Collect Strafe]({{< ref "/01-programming-guide/05-calibration/02-collect-strafe.md" >}}) for the lateral axis.

## Notes

- The drive runs without the current distance trim. Otherwise the stored scale would change what is measured, and the calibration would never settle.
- Wrapping several motions in one `seq([...])` gives one sample for the whole sequence.
- You can collect several samples for an axis. The gate uses the median.
- Under [`--no-calibrate`]({{< ref "/01-programming-guide/05-calibration/05-other-calibration.md" >}}#skipping-calibration) `collect_drive` just runs the wrapped step.
- A sample only counts after a [`calibration_gate`]({{< ref "/01-programming-guide/05-calibration/04-calibration-gate.md" >}}) has applied it.
