---
title: "IR Sensors"
author: "Tobias Madlberger, Mario Scholze"
date: 2026-11-19
draft: false
weight: 20
description: "Declaring IR line sensors, shielding them, the black/white probability model and using them as stop conditions."
---

# IR Sensors

IR sensors are the main tool for detecting and following lines. They measure how much light the surface reflects: black surfaces absorb it and give a high value, white surfaces reflect it and give a low value.

## Declaration

Declare an IR sensor in [`config/hardware.yml`]({{< ref "/01-programming-guide/04-sensors/01-hardware-yml.md" >}}):

```yaml
front_left_ir_sensor:
  type: IRSensor
  port: 1

front_right_ir_sensor:
  type: IRSensor
  port: 0
```

`port` is the analog port the sensor is plugged into. The generated `Defs` then has `Defs.front_left_ir_sensor` and `Defs.front_right_ir_sensor`. To use the sensors with the shortcut steps, bundle them in a [Sensor Group]({{< ref "/01-programming-guide/04-sensors/03-sensor-groups.md" >}}).

## Calibrate before use

An IR sensor only gives meaningful black/white values after calibration on your table. The thresholds are not part of the YAML: they are stored in `racoon.calibration.yml` and loaded at startup. See [Collect IR]({{< ref "/01-programming-guide/05-calibration/03-collect-ir.md" >}}) for how to calibrate them during the setup mission.

## Shield the sensors

An IR line sensor works by shining its own infrared LED at the table and measuring the bounce-back. The problem is that it can't tell *its* light apart from anyone else's. Overhead fluorescent tubes, halogen stage lamps, a sunbeam through a window, the IR emitters on a neighbouring robot — all of it leaks into the reading. A sensor that was rock-solid on your workshop bench can suddenly see "black" everywhere because the competition venue's ceiling lights are flooding it, or swing between readings every time someone walks past.

The fix is cheap and mechanical: put a physical shroud around each sensor so its field of view is limited to the patch of table directly underneath it. A small collar cut from black paper, black foam board, or even a few layers of electrical tape is usually enough. What matters is:

- **It extends past the front face of the sensor.** A few millimeters of overhang blocks light coming in at an angle, which is where most of the stray IR enters.
- **It sits close to the table.** Leave about 2–3 mm of clearance so the shroud doesn't scrape the surface, but no more than that — the bigger the gap, the more ambient light slips in from the side.
- **It's actually opaque to IR.** Matte black paper and foam board are fine. Some glossy black plastics look opaque to your eye but still pass infrared; if in doubt, double it up, or hold it up to a TV remote and see whether the remote still works through it.

Shield the sensors **before** you calibrate them. The K-Means thresholds are only meaningful under the lighting conditions in which the samples were taken — if you calibrate an unshielded sensor in your workshop and then add a shroud at the venue (or vice versa), every threshold on the robot will be wrong and line following will fall apart.

> **Quick check:** After fitting the shrouds, watch a raw IR reading in BotUI while waving a flashlight around the robot — not shining it down through the shroud, but sweeping it past the sides and in front. A well-shielded sensor barely moves. An unshielded one jumps by hundreds or thousands of units, and that is exactly the noise you're going to be fighting at competition.

## Probabilistic Threshold Model

Each IR sensor exposes a `probabilityOfBlack()` method (and the equivalent `probabilityOfWhite()`) that returns a float between 0.0 and 1.0. This is the confidence that the surface underneath is black, derived from how far the raw reading falls from the calibrated white and black cluster centres.

Stop conditions use this probability:

```python
# Default threshold=0.7: fire when confidence of black >= 70%
drive_forward(speed=0.8).until(on_black(Defs.front.right))

# Stricter: only fire at 90% confidence (sensor almost fully over a black area)
drive_forward(speed=0.8).until(on_black(Defs.front.right, threshold=0.9))

# Looser: fire as soon as there's any hint of black (edge detection)
drive_forward(speed=0.8).until(on_black(Defs.front.right, threshold=0.5))
```

A higher threshold requires the sensor to be more fully over black before triggering — useful for avoiding false positives from gradual colour transitions at line edges. A lower threshold triggers earlier, which is useful for detecting the very beginning of a line.

## Using IR sensors in steps

The most common way to use IR sensors is through **stop conditions** and **SensorGroup shortcuts**:

```python
# Stop conditions
drive_forward(speed=0.8).until(on_black(Defs.front.right))
drive_forward(speed=0.8).until(on_white(Defs.front.right))
drive_forward(speed=0.8).until(on_black(Defs.front.right, threshold=0.9))

# SensorGroup shortcuts (the easiest way)
Defs.front.drive_until_black()              # Drive forward → black
Defs.front.drive_over_line()                # Drive forward over a line
Defs.front.strafe_left_until_black()        # Strafe until black
Defs.front.strafe_right_until_black()       # Strafe until black
Defs.front.follow_right_edge(cm=50)         # Follow right edge of line
Defs.front.lineup_on_black()                # Square up on a line

# Using a specific sensor from the group
Defs.front.strafe_left_until_black(sensor=Defs.front.right)
```

For the steps that use IR sensors for motion, see [Line Following]({{< ref "/01-programming-guide/02-driving/05-line-following.md" >}}) and [Lineup]({{< ref "/01-programming-guide/02-driving/06-lineup.md" >}}).
