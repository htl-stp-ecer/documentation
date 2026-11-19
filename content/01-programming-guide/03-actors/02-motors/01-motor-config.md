---
title: "Motor Config"
author: "Tobias Madlberger, Mario Scholze"
date: 2026-11-19
draft: false
weight: 10
description: "Declaring motors in config/motors.yml: port, inversion and the calibration values."
---

# Motor Config

Motors are declared in `config/motors.yml`. [`hardware.yml`]({{< ref "/01-programming-guide/04-sensors/01-hardware-yml.md" >}}) merges that file in, so every motor becomes an attribute on `Defs`. Each key must be a valid Python identifier. Chassis motors and aux motors are declared the same way, see [Motors]({{< ref "/01-programming-guide/03-actors/02-motors/_index.md" >}}) for the difference. The chassis motors are then named in `drive.kinematics` in [robot.yml]({{< ref "/06-advanced/06-motion-and-localization/06-robot-yml.md" >}}).

## Motor entry

Maps to `libstp.hal.Motor`.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `type` | `string` | — | Must be `Motor`. |
| `port` | `integer` | — | **Required.** Hardware port number (0–3 on the Wombat). |
| `inverted` | `bool` | `false` | When `true`, all velocity and position commands are negated before sending to hardware. Use this to correct for motors mounted in reverse. |
| `calibration` | `mapping` | See below | Motor calibration data. Sub-keys are described below. |

### `calibration` sub-keys

These map directly to fields on the C++ `MotorCalibration` struct in `raccoon-lib/modules/libstp-foundation/include/foundation/motor.hpp`.

| Key | Type | C++ default | Description | Written by |
|-----|------|-------------|-------------|-----------|
| `ticks_to_rad` | `float` | `2π / 1440 ≈ 0.004363` | Converts raw encoder tick counts to radians of shaft rotation. Must be strictly positive. The scaffold placeholder `0.00002` is wrong for most hardware; run `raccoon calibrate ticks` to measure the real value. | `raccoon calibrate ticks` |
| `vel_lpf_alpha` | `float` | `0.5` | IIR low-pass filter coefficient for the BEMF-derived velocity estimate. `1.0` = no filtering (raw); `0.0` = frozen. Must be in `[0, 1]`. Lower values smooth velocity at the cost of lag. | `raccoon calibrate autotune` |
| `bemf_offset` | `float` | `0.0` | Per-motor BEMF zero-offset (ADC counts) subtracted on the STM32 before integrating encoder ticks. Corrects for drift so the tick integral stays proportional to wheel angle. | `raccoon calibrate autotune` |
| `pid.kp` | `float` | `1.0` | Proportional gain for the optional per-motor velocity PID loop. The `pid` block is **optional** — omit it entirely to disable per-motor closed-loop control. | `raccoon calibrate autotune` |
| `pid.ki` | `float` | `0.0` | Integral gain for the per-motor velocity PID. | `raccoon calibrate autotune` |
| `pid.kd` | `float` | `0.0` | Derivative gain for the per-motor velocity PID. | `raccoon calibrate autotune` |
| `static_friction_pct` | `float` | `0.0` | Minimum open-loop PWM duty (as a percent) required to overcome motor stiction, measured during the autotune static-friction phase. `0.0` = unmeasured / not applied. | `raccoon calibrate autotune` |

Minimal scaffold entry:

```yaml
left_motor:
  type: Motor
  port: 0
  inverted: false
  calibration:
    ticks_to_rad: 0.00002
    vel_lpf_alpha: 1.0
```

After running `raccoon calibrate ticks` and `raccoon calibrate autotune`:

```yaml
left_motor:
  type: Motor
  port: 0
  inverted: false
  calibration:
    ticks_to_rad: 0.004363      # written by: raccoon calibrate ticks
    vel_lpf_alpha: 0.8           # written by: raccoon calibrate autotune
    bemf_offset: -0.0041         # written by: raccoon calibrate autotune
    static_friction_pct: 3.2     # written by: raccoon calibrate autotune
    pid:                         # optional — only present after autotune
      kp: 0.12
      ki: 0.0
      kd: 0.0
```

**Real asymmetric values are normal.** The examplebot's two drive motors had calibrated values of `1.741e-05` (left) and `1.712e-05` (right) — a ~1.7% difference. This is within the normal manufacturing tolerance for hobbyist motors, and the per-motor `ticks_to_rad` exactly corrects for it so the robot drives straight. Do not assume both motors should have the same value; if you enter the same value for both, you may see the robot drift.

**The most common mistake** is entering a raw tick count rather than `2 * pi / ticks_per_revolution`. If you have a motor with 1440 ticks per revolution, `ticks_to_rad = 2 * pi / 1440 ≈ 0.004363`. The scaffold placeholder `0.00002` is wrong for most hardware — always run `raccoon calibrate ticks` to measure the real value.
