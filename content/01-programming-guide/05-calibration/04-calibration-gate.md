---
title: "Calibration Gate"
author: "Tobias Madlberger, Mario Scholze"
date: 2026-11-19
draft: false
weight: 40
description: "calibration_gate: apply the collected distance and IR samples once."
---

# Calibration Gate

`calibration_gate(...)` finalizes everything the collectors recorded. Put it once in the setup mission, after the last [`collect_drive`]({{< ref "/01-programming-guide/05-calibration/01-collect-drive.md" >}}) and [`collect_ir_set`]({{< ref "/01-programming-guide/05-calibration/03-collect-ir.md" >}}), and the robot is calibrated.

```python
calibration_gate(
    require_axes=[CalibrationAxis.FORWARD],
    require_ir_sets=["default"],
)
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `require_axes` | `list[CalibrationAxis]` | `None` | Drive axes that must be finalized: `CalibrationAxis.FORWARD`, `CalibrationAxis.LATERAL`. `None` finalizes every axis that has a sample or was required by a collector. |
| `require_ir_sets` | `list[str]` | `None` | IR set names that must be finalized. `None` finalizes every set collected so far. |
| `fallback_cm` | `float` | `None` | Distance of the fallback drive for both axes. Replaces `forward_fallback_cm` and `lateral_fallback_cm`. |
| `forward_fallback_cm` | `float` | `70` | Distance of the fallback drive when the forward axis has no sample. |
| `lateral_fallback_cm` | `float` | `50` | Distance of the fallback strafe when the lateral axis has no sample. |

## What it does

**For each drive axis:**

1. If there is no sample for the axis, the robot drives a measured fallback and you measure the distance. With a calibration board the board measures it.
2. The median of the samples gives the scale. The BotUI shows the requested and the measured distance and asks you to confirm. You can also enter the measurement again or redo the drive.
3. After you confirm, the scale is stored and applied to every following distance-based drive. It is stored in `racoon.calibration.yml` and loaded again at the next start.

The scale is set, not multiplied, so running calibration again does not make the error grow.

**For each IR set:** if the set has too few samples, a fallback drive collects them, then the thresholds are computed and shown for confirmation, see [Collect IR]({{< ref "/01-programming-guide/05-calibration/03-collect-ir.md" >}}).

## Behavior

- **It runs once.** After it has finalized, further `calibration_gate` calls return immediately until new samples arrive.
- **The lateral axis is skipped** on drivetrains that cannot strafe.
- **It does nothing with [`--no-calibrate`]({{< ref "/01-programming-guide/05-calibration/05-other-calibration.md" >}}#skipping-calibration).**
- If you dismiss the screens, the axis stays untrimmed and distance-based drives keep warning that calibration is missing.
