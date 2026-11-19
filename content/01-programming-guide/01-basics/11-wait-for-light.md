---
title: "Wait for Light"
author: "Tobias Madlberger, Mario Scholze"
date: 2026-11-19
draft: false
weight: 110
description: "Starting the run on the start lamp: mounting and declaring the sensor, and how the Kalman-filter detection works."
---

# Wait for Light

In Botball competitions, robots start when a light signal turns on. The robot must detect this light reliably — without false-triggering from ambient changes (people walking past, overhead lighting shifting) and without missing a weak signal. raccoon's `wait_for_light` step solves this using a 1D Kalman filter for baseline tracking and a multi-phase workflow with a built-in test mode.

The approach is based on the paper [*"Comprehensive Light-Start Methods in Botball"*](https://ecer.pria.at/archive/ecer-2024/papers/Comprehensive_Light-Start_Methods_in_Botball.pdf) by James Gosling, Matthias Rottensteiner, and Alexander Müllner (ECER 2023), which compares several noise reduction techniques and proposes the Kalman filter + downward-facing sensor combination used here.

## Setting it up

### Mount the sensor downward

Mount the sensor **facing down** at the table, with no black tape or shielding. When the start lamp fires above the robot, light reflects off the table and reaches the sensor. Pick a spot where the sensor has a clear view of the table, is not shaded by a mechanism that moves during the match and is over the starting area.

### Declare it in hardware.yml

The framework looks the start sensor up **by name**: it must be called exactly `wait_for_light_sensor`.

```yaml
# config/hardware.yml
wait_for_light_sensor:
  type: IRSensor
  port: 11
  mode: auto              # optional: "auto" (default) or "legacy"
  drop_fraction: 0.35     # optional: how far the signal must drop
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `type` | `string` | | The sensor type, for example `IRSensor` or `AnalogSensor`. |
| `port` | `integer` | | **Required.** Analog port of the light sensor. |
| `mode` | `string` | `"auto"` | `"auto"` is the Kalman-filter detection described below, `"legacy"` is a fixed threshold. |
| `drop_fraction` | `float` | `0.15` | Fraction by which the reading must drop below the baseline to count as lamp on. |

`mode` and `drop_fraction` are not passed to the sensor. The code generator emits them as `Defs.wait_for_light_mode` and `Defs.wait_for_light_drop_fraction`, which the start gate reads.

Once this entry exists, the runtime inserts the light-start gate between your setup mission and your first main mission. You do not call `wait_for_light()` yourself. Without the entry the robot starts on a button press, which is fine at your desk but not at the competition.

### Leave it out of the IR calibration

The start-lamp sensor never sees a black line, so it must not be calibrated like a line sensor. [`collect_ir_set`]({{< ref "/01-programming-guide/05-calibration/03-collect-ir.md" >}}) samples every `IRSensor` by default. Pass the line sensors explicitly:

```python
collect_ir_set(
    drive_forward(50),
    set_name="default",
    sensors=[Defs.front_left_ir_sensor, Defs.front_right_ir_sensor],
)
```

### At the table

1. Power on the robot. The setup mission runs.
2. The BotUI shows **warm-up** for about one second while the baseline is built.
3. It then enters **test mode**. Cover and uncover the sensor, or switch a flashlight on and off above it. The test counter goes up on every detection. The robot does not start in test mode.
4. When detections work, press the button. The gate is now **armed**.
5. Place the robot and step back. When the judge turns on the lamp, the mission clock starts at T=0 and the first main mission begins.

If test mode never detects anything, the sensor does not see the lamp, `drop_fraction` is too high or the sensor is shielded. Fix it in test mode, not when armed.

### Tuning the sensitivity

The defaults work for most setups. For dim venues or a weak lamp, call `wait_for_light` yourself with other parameters, see the parameters below:

```python
# More sensitive: triggers on a 10% drop instead of 15%
wait_for_light(Defs.wait_for_light_sensor, drop_fraction=0.10, confirm_count=2)
```

## Concept

The fundamental problem is that a fixed trigger threshold breaks across venues (different lighting conditions). The Kalman-filter approach adapts: instead of "trigger below value X", the step triggers on "drop of N% below the current ambient baseline".

```mermaid
stateDiagram-v2
    [*] --> WarmUp : step starts
    WarmUp --> TestMode : warmup_seconds elapsed\nbaseline established
    TestMode --> TestMode : lamp on → TEST TRIGGER\n(baseline continues updating)
    TestMode --> Armed : operator presses button\nafter ≥1 test trigger
    Armed --> NeedsClear : transition from test
    NeedsClear --> Armed : sensor confirms lamp is OFF
    Armed --> Started : lamp on AND confirm_count consecutive drops
    Started --> [*]
```

| Phase | What happens |
|-------|-------------|
| **Warm-Up** | Read sensor at ~200 Hz, feed into Kalman filter. Process variance is high so baseline tracks fast. |
| **Test Mode** | Operator can turn the lamp on and off to verify detection. The robot will NOT start. Each successful detection increments a counter shown on screen. |
| **Armed** | After operator confirmation. A `needs_clear` gate prevents instant false-start if lamp is still on from the test phase. |
| **Started** | `confirm_count` consecutive readings drop below `baseline × (1 − drop_fraction)`. Mission begins. |

## The Problem

A light sensor returns a raw analog value that varies with ambient conditions. The start lamp adds brightness, which causes the sensor reading to drop (lower value = more light on a typical LDR). The challenge is distinguishing "the lamp turned on" from "the room got slightly brighter" or "someone's shadow moved."

Naive approaches fail in predictable ways:

- **Fixed threshold** (e.g. "trigger below 2000"): breaks when the room lighting changes between setup and match start, or between venues.
- **Manual calibration** (measure dark/light, compute midpoint): works, but requires operator interaction before every run and is sensitive to the time gap between calibration and match start.
- **Simple delta detection** (trigger on any sudden change): fires on noise spikes.

## How It Works

### Sensor Mounting

The sensor faces **downward** toward the table surface, with no shielding (no black tape, no straw). When the start lamp turns on above the robot, light reflects off the table and reaches the sensor. This downward-facing mount reduces environmental noise by up to 76% compared to a horizontal mount (Gosling et al., 2023), because the sensor's field of view is dominated by the table (a stable reflector) rather than the room.

### Phase 1: Warm-Up (Baseline Establishment)

During a configurable warm-up period (default: 1 second), the step reads the sensor at ~200 Hz and feeds every reading into a 1D Kalman filter. The filter tracks the slowly-changing ambient baseline while smoothing out sensor noise.

The Kalman filter maintains two values:
- **Estimate** — the current best guess of the true ambient reading
- **Error** — how uncertain the estimate is

Each new sensor reading updates both via the standard Kalman predict/update cycle. During warm-up, the process variance is set relatively high (0.01) so the filter adapts quickly to the current lighting conditions.

### Phase 2: Test Mode

After warm-up, the step enters **test mode**. In this mode, the lamp can be turned on and off to verify detection works — but the robot **will not start**. The UI shows "TEST MODE" and counts how many times the lamp was successfully detected.

This is critical at competition: you can verify the sensor picks up the lamp signal from its actual position on the starting board before committing to an armed state. If it doesn't trigger, you can adjust the sensor position or the `drop_fraction` parameter without wasting a run.

While in test mode, the Kalman filter continues updating the baseline on non-triggering readings, keeping it current.

### Phase 3: Armed

Once the operator has confirmed detection works (by pressing the button after at least one successful test trigger), the step transitions to **armed** mode. Now a trigger will actually start the mission.

A key detail: when transitioning from test mode to armed, the step sets a **needs_clear gate**. The gate clears only when the raw sensor reading is at or above the trigger threshold — that is, when the lamp is demonstrably off. This prevents an instant false start if the lamp happens to still be on from the last test trigger. Once the sensor confirms the lamp is off, the gate clears and the step will fire normally on the next lamp-on event.

The Kalman filter's process variance is also reduced (from 0.01 to 0.001) after warm-up, making the baseline more stable — it tracks slow ambient drift but won't chase the lamp signal.

### Trigger Detection

A trigger fires when the raw sensor reading drops below `baseline * (1 - drop_fraction)` for `confirm_count` consecutive samples.

With the defaults (15% drop, 3 consecutive samples at 200 Hz):
- The lamp must cause at least a 15% brightness increase
- This must persist for ~15 ms (3 samples) — effectively instant, but rejects single-sample noise spikes

## Parameters of `wait_for_light`

| Parameter | Default | Effect |
|-----------|---------|--------|
| `drop_fraction` | 0.15 | How much the reading must drop below baseline. Lower = more sensitive, higher = safer |
| `confirm_count` | 3 | Consecutive below-threshold samples needed. Higher = more noise-resistant, slower response |
| `warmup_seconds` | 1.0 | Baseline establishment time. Longer = more stable baseline |
| `poll_interval` | 0.005 | Seconds between reads (~200 Hz). Faster = more responsive |

## Legacy Method

If the automatic method doesn't work for your setup (e.g. the sensor isn't mounted downward, or the lamp signal is too weak for flank detection), there's a manual fallback:

```python
wait_for_light_legacy(Defs.wait_for_light_sensor)
```

This runs the traditional two-step flow: the operator measures the sensor with the lamp off, then with it on, confirms the midpoint threshold, and the robot waits for the reading to cross it. It works, but requires manual interaction before every run.

For the competition flow around it (shutdown timer and shutdown mission) see [Competition Ready]({{< ref "/06-advanced/08-runtime-and-tooling/05-competition-ready.md" >}}).
