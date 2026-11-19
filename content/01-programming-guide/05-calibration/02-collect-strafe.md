---
title: "Collect Strafe"
author: "Tobias Madlberger, Mario Scholze"
date: 2026-11-19
draft: false
weight: 20
description: "Calibrating the sideways distance scale on mecanum robots."
---

# Collect Strafe

Sideways driving has its own distance scale, called the **lateral** axis. There is no separate `collect_strafe` step: wrap a strafe step with [`collect_drive`]({{< ref "/01-programming-guide/05-calibration/01-collect-drive.md" >}}) and the sample is filed under the lateral axis automatically.

```python
collect_drive(strafe_right(30))
```

Then ask the gate to finalize that axis:

```python
calibration_gate(
    require_axes=[CalibrationAxis.FORWARD, CalibrationAxis.LATERAL],
)
```

## Only for drivetrains that can strafe

The lateral axis is only calibrated when the drivetrain supports sideways motion, meaning mecanum or omni robots. On a differential drivetrain the gate skips the lateral axis.

## Fallback

If you require the lateral axis but no strafe was collected, the gate drives a strafe itself (50 cm by default) and asks you to measure it, see [Calibration Gate]({{< ref "/01-programming-guide/05-calibration/04-calibration-gate.md" >}}).

The strafe steps themselves are on [Strafe and Mecanum]({{< ref "/01-programming-guide/02-driving/02-strafe-and-mecanum.md" >}}).
