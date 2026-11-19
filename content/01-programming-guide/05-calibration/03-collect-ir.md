---
title: "Collect IR"
author: "Tobias Madlberger, Mario Scholze"
date: 2026-11-19
draft: false
weight: 30
description: "collect_ir_set: sample the IR sensors during a setup motion, how thresholds are computed and calibration sets."
---

# Collect IR

`collect_ir_set(step, set_name, sensors=None)` wraps a motion and samples the IR sensors while it runs. The [`calibration_gate`]({{< ref "/01-programming-guide/05-calibration/04-calibration-gate.md" >}}) later turns the samples into a black and a white threshold for each sensor.

```python
collect_ir_set(drive_forward(50), set_name="default")
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `step` | step | | A motion that moves the sensors over both a black and a white area. |
| `set_name` | `str` | | Name of the calibration set, for example `"default"` or `"upper"`. |
| `sensors` | `list[IRSensor]` | all IR sensors in `Defs.analog_sensors` | The sensors to sample. Pass a list to leave sensors out, for example the start-lamp sensor. |

The sensors are read every 10 ms while `step` runs. To combine it with a distance sample, nest the two:

```python
collect_drive(
    collect_ir_set(
        drive_forward(50),
        set_name="default",
        sensors=[Defs.front_left_ir_sensor, Defs.front_right_ir_sensor],
    ),
)
```

Then list the set in the gate: `calibration_gate(require_ir_sets=["default"])`.

**The motion must cross black and white.** Every sensor needs to see both surfaces. If a sensor sees only one, its thresholds cannot be computed.

If a required set has fewer than 20 samples when the gate runs, the gate asks you to place the sensors on the surface and drives 50 cm itself to sample. Before the thresholds are stored you see a results screen for every sensor, where you can accept them or sample again.

## How the thresholds are computed

The thresholds come from a 1D **K-Means clustering with k = 2** over the raw readings of a sensor. This is more robust than a percentile when most of the samples are white and only a short pass crosses the black line. The idea follows [*Applied Machine Learning in Sensor Calibration: A Clustering Technique*](/papers/liu-xie-jiang-2025-ml-sensor-calibration.pdf) (Liu, Xie and Jiang, GCER 2025).

1. Start with two centroids at the minimum and the maximum of the samples.
2. Assign every sample to the nearest centroid and move each centroid to the mean of its samples.
3. Repeat 10 times.
4. The lower centroid is the **white threshold**, the higher one the **black threshold**.

```
Samples:  [180, 195, 210, 185, 2800, 3100, 2950, 190, 205, ...]
K-Means:   white = 193.5,  black = 2950.0
```

Before the result is accepted it is checked:

- The spread between the smallest and the largest reading must be at least 500. Otherwise the sensor did not see both surfaces.
- The two centroids must be at least 700 apart and at least 25% of that spread.

If a check fails, the sensor is not calibrated and you can sample again.

After calibration, `probabilityOfBlack()` interpolates linearly between the two thresholds. It is 0.0 at or below the white threshold, 1.0 at or above the black threshold. The [stop conditions]({{< ref "/01-programming-guide/04-sensors/02-ir-sensors.md" >}}), [line following]({{< ref "/01-programming-guide/02-driving/05-line-following.md" >}}) and [lineup]({{< ref "/01-programming-guide/02-driving/06-lineup.md" >}}) use these probabilities.

## Calibration sets

Some robots cross surfaces with different reflectivity, for example a white floor and a dark ramp. Give each surface its own set. Every set stores independent thresholds for each sensor.

```python
# Setup: collect both surfaces
collect_ir_set(drive_forward(50), set_name="default")
collect_ir_set(drive_backward(50), set_name="upper")   # sensors on the dark surface
calibration_gate(require_ir_sets=["default", "upper"])

# Mission: switch to the matching set before using the sensors
switch_calibration_set("upper")
# ... later
switch_calibration_set("default")
```

`switch_calibration_set(set_name)` loads the stored thresholds of that set into all IR sensors. The change applies from the next sensor read.
