---
title: "Other Calibration"
author: "Tobias Madlberger, Mario Scholze"
date: 2026-11-26
draft: false
weight: 50
description: "Skipping calibration with --no-calibrate, the motor calibration commands and the single-sensor calibration steps."
---

# Other Calibration

## Skipping calibration

Calibrating takes time. While you iterate on a mission you can skip it. Start the program with `raccoon run --no-calibrate`, or use a [run configuration]({{< ref "/01-programming-guide/01-basics/04-run-configurations.md" >}}) with `no_calibrate: true` (the builtin `dev` preset does).

With `--no-calibrate`:

- `collect_drive`, `collect_ir_set` and `calibration_gate` do nothing. The stored distance scales are loaded at startup, and each IR sensor loads its stored thresholds when it is created.
- `calibrate_sensors` and `calibrate_analog_sensor` apply the stored values instead of asking you.

Wrap setup steps that need you in `run_unless_no_calibrate(...)`, so that the whole block is skipped:

```python
run_unless_no_calibrate(
    seq([
        wait_for_button("Place the robot"),
        collect_drive(drive_forward(50)),
        calibration_gate(require_axes=[CalibrationAxis.FORWARD]),
    ])
)
```

Without calibration data on a new robot the stored values do not exist yet, so run once without the flag first.

## When to calibrate again

- After changing wheels, motors or the drivetrain
- On a table with a different surface or different lighting
- After moving or replacing an IR sensor
- When distances or turns are visibly off

## `calibrate_sensors`

Samples the IR sensors in its own step with the BotUI guiding you, instead of collecting them during a motion. Use it when you do not want to combine the IR calibration with a drive.

```python
calibrate_sensors()
calibrate_sensors(calibration_time=8.0, calibration_sets=["default", "transparent"])
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `calibration_time` | `float` | `5.0` | Seconds to sample each surface. |
| `allow_use_existing` | `bool` | `True` | Offer to reuse the stored calibration instead of sampling. |
| `calibration_sets` | `list[str]` | `["default"]` | The sets to calibrate in one run. |

The thresholds are computed as described in [Collect IR]({{< ref "/01-programming-guide/05-calibration/03-collect-ir.md" >}}).

## Motor calibration commands

The values in `config/motors.yml` come from commands you run on your laptop with a connected robot, not from setup steps:

| Command | What it does |
|---------|--------------|
| `raccoon calibrate ticks` | Measures the encoder ticks per revolution and writes `ticks_to_rad` for each motor. |
| `raccoon calibrate autotune` | Runs `auto_tune()` on the robot. Writes motor values (`ticks_to_rad`, `bemf_offset`, `vel_lpf_alpha`, `static_friction_pct`) and, in `config/robot.yml`, the motion constraints, the motion PID gains and the velocity command gains. |
| `raccoon calibrate servos` | Sets servo offsets, see [Servo Offsets and Calibration]({{< ref "/01-programming-guide/03-actors/01-servos/02-offsets-and-calibration.md" >}}). |
| `raccoon calibrate step-response` | Records the step response of the motors as CSV and plot, for diagnostics. Does not change the configuration. |

Run `ticks` first, then `autotune`. All options are described in [calibrate]({{< ref "/03-raccoon-cli/07-calibrate.md" >}}). The motor keys these commands write are described in [Motor Config]({{< ref "/01-programming-guide/03-actors/02-motors/01-motor-config.md" >}}).

`calibrate_deadzone(motor_ports=None, start_percent=1, max_percent=30, settle_time=0.3)` is a setup step that finds the power a motor needs to start turning. It raises the power slowly and asks you to confirm when the wheel moves.

## Single-sensor steps

| Step | What it does |
|------|--------------|
| `calibrate_analog_sensor(sensor, set_name="default", sample_duration=3.0)` | Stores the reading of an analog or ET sensor at the current robot position. `drive_to_analog_target()` then drives to that reading, see [Analog and ET Sensors]({{< ref "/01-programming-guide/04-sensors/05-analog-and-et-sensors.md" >}}). |
| `calibrate_wait_for_light(sensor)` | Measures the start-lamp sensor with the lamp off and on, for `wait_for_light_legacy`. See [Wait for Light]({{< ref "/01-programming-guide/01-basics/11-wait-for-light.md" >}}). |
