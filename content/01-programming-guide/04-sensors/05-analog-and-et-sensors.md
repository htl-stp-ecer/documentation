---
title: "Analog and ET Sensors"
author: "Tobias Madlberger, Mario Scholze"
date: 2026-11-19
draft: false
weight: 50
description: "Declaring analog and ET distance sensors, using them as stop conditions and driving to a calibrated reading."
---

# Analog and ET Sensors

An `AnalogSensor` returns the raw reading of an analog port. The values depend on the sensor and the wiring. An `ETSensor` is a distance (range) sensor: it is an `AnalogSensor` with a dedicated type, and adds `raw()` as an alias for `read()`.

## Declaration

```yaml
# config/hardware.yml
light_sensor:
  type: AnalogSensor
  port: 2

distance_sensor:
  type: ETSensor
  port: 3
```

| Key | Type | Description |
|-----|------|-------------|
| `type` | `string` | `AnalogSensor` or `ETSensor`. |
| `port` | `integer` | **Required.** Analog port number. |

Both are added to `Defs.analog_sensors`, see [hardware.yml]({{< ref "/01-programming-guide/04-sensors/01-hardware-yml.md" >}}).

## Usage in steps

```python
# Stop conditions
drive_forward(speed=0.5).until(on_analog_above(Defs.distance_sensor, 2000))
drive_forward(speed=0.5).until(on_analog_below(Defs.distance_sensor, 500))

# Read in custom code
run(lambda robot: print(f"Light: {robot.defs.light_sensor.read()}"))
```

## Drive to a calibrated analog value

`drive_to_analog_target()` drives the robot until an analog sensor reaches its calibrated reference value, then stops. This is the idiomatic way to use an ET or distance sensor to stop at a repeatable distance.

**Step 1: calibrate the position during setup**

```python
from raccoon.step.calibration import calibrate_analog_sensor

# During setup: operator positions the robot at the target location,
# then the step samples the sensor and stores the reference value.
calibrate_analog_sensor(Defs.et_sensor)                    # stores as "default"
calibrate_analog_sensor(Defs.et_sensor, set_name="near")   # named position
calibrate_analog_sensor(Defs.et_sensor, set_name="far")    # another named position
```

Parameters for `calibrate_analog_sensor()`:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `sensor` | `AnalogSensor` | required | The sensor to calibrate |
| `set_name` | `str` | `"default"` | Label for this calibration point |
| `sample_duration` | `float` | `3.0` | Seconds to sample for (longer = more stable) |

**Step 2: use the calibrated value in the mission**

```python
from raccoon.step.motion import drive_to_analog_target

# Drive toward the calibrated target (direction chosen automatically)
drive_to_analog_target(Defs.et_sensor)

# Slow approach to a named position with 30 cm safety backstop
drive_to_analog_target(Defs.et_sensor, speed=0.2, set_name="near", timeout_cm=30)
```

Parameters for `drive_to_analog_target()`:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `sensor` | `AnalogSensor` | required | The sensor to monitor |
| `speed` | `float` | `0.3` | Drive speed 0.0–1.0 |
| `set_name` | `str` | `"default"` | Which calibration point to target |
| `timeout_cm` | `float \| None` | `None` | Max distance before giving up |

The direction (forward or backward) is chosen automatically at runtime by comparing the current reading to the stored target — the step drives toward the target value, not a hardcoded direction. Use a slow speed (`0.2`–`0.3`) for precise positioning; the default 0.3 is a safe starting point.

> **Direction inference edge case:** In some configurations the automatic direction inference can be wrong (e.g., non-monotonic sensor response or an inverted analog wiring). The cube-bot codebase implements a `DriveToAnalogTargetBidirectional` custom step that accepts an explicit direction override for these cases. If `drive_to_analog_target` drives the wrong way, add an explicit check of the current sensor reading before calling it, or implement a similar explicit-direction variant.
