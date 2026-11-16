---
title: "calibrate"
author: "Tobias Madlberger, Mario Scholze"
date: 2026-11-16
draft: false
weight: 7
description: "Measure encoder ticks, tune the motor PID, set servo positions and record motor step responses."
---

# raccoon calibrate

```bash
raccoon calibrate ticks
raccoon calibrate autotune
raccoon calibrate servos
raccoon calibrate step-response --local
```

`raccoon calibrate` has one subcommand per calibration phase. Run one phase at a time. For what the values mean and when to recalibrate, see [Calibration]({{< ref "/01-programming-guide/03-calibration/_index.md" >}}).

## Where it runs

All subcommands need to be inside a project. By default they use the connected robot. If no connection exists, raccoon tries the connection saved in the project, then the first known Pi. If that also fails, it falls back to running locally.

The group option `--local` / `-l` forces local execution. This only works on the robot itself, because it needs the hardware:

```bash
raccoon calibrate --local ticks
```

## ticks

Phase 1: measures the encoder ticks per revolution of every motor in your definitions.

For each motor, raccoon asks for confirmation and then runs 3 trials. In every trial you rotate the wheel by hand exactly one full turn and press Enter; raccoon compares the encoder values before and after. It averages the trials, shows a summary table (ticks per revolution and radians per tick) and writes `ticks_to_rad` into the motor's `calibration` block in `raccoon.project.yml`.

Make sure the wheels can spin freely. Encoder values are read from the Pi when connected, otherwise from the local hardware.

## autotune

Phase 2: runs `auto_tune()` as a mission step to tune the motor controllers.

- **Remote:** raccoon generates the code, syncs the project, runs the autotune on the Pi and streams its output. Ctrl+C cancels it. When it finishes, the changes are pulled back to your laptop.
- **Local (`--local`):** raccoon generates the code and runs a temporary autotune script in the project folder. Ctrl+C stops it. The script is deleted afterwards.

The command exits with the exit code of the autotune run.

## servos

Phase 3: lets you move servos by hand to find their named positions.

raccoon connects to the Pi, lists the servos that have named positions and lets you pick a servo and a position. Then you jog the servo with the keyboard:

| Key | Action |
|-----|--------|
| ↑ / ↓ | Move the servo |
| ← / → | Change the step size |
| Enter | Confirm the position |
| Esc / Ctrl+C | Quit |

On confirm, the resulting `offset` is rounded to three decimals and saved to the servo's definition in your config. If the servo is defined in an included file, that file is updated.

This subcommand needs a connection to the Pi.

## step-response

Records the step response of motors and plots the back-EMF (BEMF) over time. It is a tool for debugging motor control, not part of the normal calibration.

> Only local execution is implemented. Without `--local`, the command prints "Remote step-response not yet implemented" and exits with an error. Run it on the Wombat itself.

```bash
raccoon calibrate step-response --local --ports 0,1 --mode velocity --speed 500 --duration 2
```

| Option | Default | Description |
|--------|---------|-------------|
| `--local` | off | Run directly on this machine (required) |
| `--ports` | `0,1,2,3` | Comma-separated motor ports to record |
| `--mode` | `speed` | `speed` uses `set_speed()` (percent). `velocity` uses `set_velocity()` (BEMF units, with PID) |
| `--speed` | `70` | Speed value, percent or BEMF units depending on the mode |
| `--duration` | `3.0` | Run duration in seconds |
| `--brake-tail` | `2.0` | Extra seconds to record after braking |
| `--hz` | `100` | Sample rate in Hz |
| `--out` | `step_response.csv` | CSV output file, relative to the project folder |
| `--plot` | `step_response.png` | Plot output file, relative to the project folder |
| `--no-plot` | off | Skip generating the plot |

Ctrl+C brakes the motors early. The plot needs `matplotlib`; without it, raccoon skips the plot and keeps the CSV.
