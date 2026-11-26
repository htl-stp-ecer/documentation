---
title: "calibrate"
author: "Tobias Madlberger, Mario Scholze"
date: 2026-11-26
draft: false
weight: 7
description: "Measure encoder ticks, auto-tune the robot, set servo offsets and record motor step responses."
---

# raccoon calibrate

```bash
raccoon calibrate ticks
raccoon calibrate autotune
raccoon calibrate servos
raccoon calibrate step-response
```

Each subcommand does one job. For what the values mean and when to recalibrate, see [Calibration]({{< ref "/01-programming-guide/05-calibration/_index.md" >}}).

| Subcommand | What it does | Writes |
|------------|--------------|--------|
| [`ticks`](#ticks) | Measures the encoder ticks per revolution | `config/motors.yml` |
| [`autotune`](#autotune) | Tunes the robot with `auto_tune()` | `config/motors.yml`, `config/robot.yml` |
| [`servos`](#servos) | Corrects servo offsets | `config/servos.yml` |
| [`step-response`](#step-response) | Records how the motors react, for diagnostics | A CSV file and a plot |

## Where it runs

All subcommands need to be inside a project. By default they use the connected robot. If no connection exists, raccoon tries the connection saved in the project, or the first known Pi if the project has none. If no robot can be reached, it prints `No Pi connection` and runs locally.

Two options belong to the `calibrate` group, so they go before the subcommand:

| Option | Description |
|--------|-------------|
| `--local`, `-l` | Run on this machine. Use it on the robot itself, because it needs the hardware |
| `--no-codegen` | Local runs of `autotune` and `step-response`: use the hardware code that is already generated |

```bash
raccoon calibrate --local ticks
```

`autotune` and `step-response` load the `Robot` class of your project, so they [generate the code]({{< ref "/03-raccoon-cli/04-codegen.md" >}}) first. In a remote run this happens on your laptop. The Pi server then starts `raccoon calibrate --local --no-codegen` with the subcommand.

## ticks

Measures the encoder ticks per revolution of every motor in your definitions.

For each motor, raccoon asks for confirmation and then runs 3 trials. In every trial you rotate the wheel by hand exactly one full turn and press Enter; raccoon compares the encoder values before and after. It averages the trials, shows a summary table (ticks per revolution and radians per tick) and writes `ticks_to_rad` into the motor's `calibration` block in `config/motors.yml`. A motor that is not an entry of that file is reported as an error and not saved.

Make sure the wheels can spin freely. Encoder values are read from the Pi when connected, otherwise from the local hardware. The file is written on the machine where you run the command.

## autotune

Tunes the robot to its actual hardware with `auto_tune()`. For the tuning phases, see [Drive System]({{< ref "/06-advanced/06-motion-and-localization/01-drive-system.md" >}}).

The command runs your robot program with `auto_tune()` as its only main mission:

1. The setup mission runs.
2. `auto_tune()` starts directly afterwards. There is no wait for the start light or a start button, also if the setup mission defines its own `pre_start_gate()`.
3. The shutdown mission runs.

The `shutdown_in` timer does not cut the tuning off. Buttons are still needed where a step asks for them: `auto_tune()` waits for a button press before its phases, and so do `wait_for_button` steps in your setup mission.

> The robot drives during the tuning. Give it room and stay near it. Several phases need a [calibration board]({{< ref "/05-bot-ui/04-calibration-board.md" >}}).

- **Remote:** raccoon generates the code, syncs the project, runs the autotune on the Pi and streams its output. Ctrl+C cancels it. When it finishes, the changes are pulled back to your laptop.
- **Local (`--local`):** raccoon runs a temporary autotune script in the project folder. Ctrl+C stops it. The script is deleted afterwards.

The command exits with the exit code of the autotune run.

## servos

Corrects the offset of a servo, for example after you have replaced it. It works on servos that have named positions.

raccoon connects to the `raccoon-server` on the robot, lists the servos and lets you pick a servo and a position. With `--local` it uses the server on the same machine. The servo moves to `position + offset`, and you jog it with the keyboard:

| Key | Action |
|-----|--------|
| ↑ / ↓ | Move the servo |
| ← / → | Change the step size: 0.5, 1, 2 or 5 degrees |
| Enter | Confirm the position |
| Esc / Ctrl+C | Quit without saving the current servo |

> The servo moves as soon as you have picked a position. Check that nothing is in its way.

On confirm, the movement is added to the `offset` of the servo, rounded to three decimals and saved to its entry in `config/servos.yml`. The offset applies to all positions of that servo.

## step-response

Runs the motors for a short time, brakes them and records back-EMF (BEMF) and encoder position. It is a tool for debugging motor control and does not change your configuration.

```bash
raccoon calibrate step-response --ports 0,1 --mode velocity --speed 500 --duration 2
```

1. The robot's screen asks you to press the button.
2. The motors spin while the screen shows `Measuring step response...`.
3. raccoon writes the CSV file and generates the plot. In a remote run it pulls the CSV to your laptop and plots it there.

The values are read per motor port as the hardware reports them, without the `inverted` setting of your motor definitions.

| Option | Default | Description |
|--------|---------|-------------|
| `--local` | off | Run directly on this machine. Works like the group option |
| `--ports` | `0,1,2,3` | Comma-separated motor ports to record |
| `--mode` | `speed` | `speed` uses `set_speed()` (percent). `velocity` uses `set_velocity()` (BEMF units, with PID) |
| `--speed` | `70` | Speed value, percent or BEMF units depending on the mode |
| `--duration` | `3.0` | Run duration in seconds |
| `--brake-tail` | `2.0` | Extra seconds to record after braking |
| `--hz` | `100` | Sample rate in Hz |
| `--out` | `step_response.csv` | CSV output file, relative to the project folder. A remote run only accepts paths inside the project and replaces an existing file |
| `--plot` | `step_response.png` | Plot output file, relative to the project folder |
| `--no-plot` | off | Skip generating the plot |

Ctrl+C before the button press stops the command without moving the motors. During the measurement it brakes the motors early and records at most 1 second after braking. A cancelled remote run produces no plot.

The plot needs `matplotlib` on the machine where you run the command. Without it, raccoon skips the plot and keeps the CSV.
