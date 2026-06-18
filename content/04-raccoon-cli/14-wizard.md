---
title: "wizard"
author: "Raccoon Docs Team"
date: 2026-06-18
draft: false
weight: 15
---

# raccoon wizard

```bash
raccoon wizard [--dry-run]
```

An interactive, step-by-step setup assistant that writes — or updates — the hardware-specific sections of `raccoon.project.yml`. Run it when you first wire up your robot, and again whenever you change drivetrain hardware or need to recalibrate encoder ticks. You do not need to edit the YAML file by hand.

## What the wizard writes (and what it leaves alone)

The wizard performs a **partial update** of `raccoon.project.yml`. It touches only:

- `name`
- `robot.drive.kinematics` (drivetrain type, wheel radius, track width, wheelbase, motor references)
- `definitions` — motor, IMU, and button entries

It explicitly leaves everything else untouched: `shutdown_in`, `vel_config`, `odometry`, `motion_pid`, `physical`, extra sensors, servos, run configurations. This makes it safe to re-run the wizard on an existing project after a hardware change without losing advanced config you added by hand.

After the wizard, use the [Web IDE]({{< ref "16-raccoon-server" >}}) Device tab to set sensor positions, rotation centre, and start pose — these are not configurable from the wizard.

## When to use it

- Configuring a new robot from scratch.
- Changing drivetrain type (e.g. switching from differential to mecanum).
- Rewiring motor ports or adding/replacing a button sensor.
- After changing wheel size or track width — the wizard converts physical measurements into the correct SI values.
- Live encoder-ticks calibration using the connected Pi (see Step 6 below).

## Synopsis

```bash
raccoon wizard            # full interactive flow
raccoon wizard --dry-run  # preview config without saving anything
```

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--dry-run` | flag | off | Print the resulting config summary but do **not** write `raccoon.project.yml`. Useful for previewing changes before committing. |

## The 7-step walkthrough

The wizard runs entirely in the terminal. Use **arrow keys** to navigate lists, **Enter** to confirm, and **Ctrl-C** to abort at any point without saving.

### Step 0 — Pi connection (optional)

The wizard first checks whether you are already connected to a Pi. If not, it offers to connect:

- Choose from known Pis (addresses already in `~/.raccoon/config.yml`) or enter an address manually.
- Default address: `192.168.4.1`, default port: `8421`, default user: `pi`.
- A live connection is only required for **guided encoder calibration** in Step 6. All other steps work offline.

If you skip or the connection fails, the wizard continues — you can run live calibration separately later.

### Step 1 — Project name

Enter a human-readable name for the project. The default is the value already in `raccoon.project.yml`, or `"My Raccoon Robot"` for a brand-new project.

### Step 2 — Drivetrain type

Select the drivetrain:

| Choice | Value | Motor slots |
|--------|-------|------------|
| Mecanum (4-wheel holonomic) | `mecanum` | `front_left_motor`, `front_right_motor`, `rear_left_motor`, `rear_right_motor` |
| Differential (2-wheel tank) | `differential` | `left_motor`, `right_motor` |

The drivetrain choice determines how many motors you configure in the next step.

### Step 3 — Motor ports

For each drive motor slot you assign:

- **Port** — the Wombat motor port number (0–3). Select from a list.
- **Inverted** — whether the motor runs in reverse to go forward. Right-side motors are pre-defaulted to `true` (the most common wiring convention).

Pre-existing port assignments from `raccoon.project.yml` are shown as defaults so re-running the wizard does not force you to re-enter everything.

### Step 4 — Button sensor

Select the digital port (0–10) for the start/stop button. The default is port `10`. This creates a `DigitalSensor` entry named `button` in the `definitions:` section.

### Step 5 — Physical measurements

Enter your robot's dimensions. All values are validated immediately:

| Prompt | Units | Description |
|--------|-------|-------------|
| Wheel diameter | mm | Outer diameter of the drive wheel |
| Track width | cm | Centre-to-centre distance between left and right wheels |
| Wheelbase | cm | Centre-to-centre distance between front and rear axles (mecanum only; used for odometry) |
| Velocity low-pass alpha | 0–1 | Smoothing factor for the velocity low-pass filter. Higher = smoother but slower response. Default `0.8`. |

The wizard converts these into SI units before writing to YAML (wheel radius in metres, track width and wheelbase in metres).

### Step 6 — Encoder ticks calibration (optional)

Encoder ticks per revolution is a critical calibration value. The wizard offers three options:

1. **Guided calibration (live)** — requires a connected Pi. For each drive motor:
   - The wizard reads the current encoder position.
   - You manually rotate the wheel **exactly one full turn (360°)**.
   - Press Enter; the wizard reads the position again and computes the delta.
   - This is repeated for **3 trials per motor**; the average is used.
2. **Manual entry** — type a single ticks/rev value applied to all drive motors. The default is `1536` (a common value for typical robot motors).
3. **Skip** — keep the values already in `raccoon.project.yml`.

The computed ticks/rev is stored as `ticks_to_rad` in `calibration:` blocks: `ticks_to_rad = 2π / ticks_per_rev`.

## What the wizard writes — and what it preserves

The wizard saves exactly these top-level keys in `raccoon.project.yml`:

- `name` — project name
- `uuid` — unchanged from the existing value
- `robot.drive.kinematics` — drivetrain type, wheel radius, track width, wheelbase, and motor references; **all other fields under `robot:` are preserved unchanged** (e.g. `shutdown_in`, `vel_config`, `odometry`, `motion_pid`, `physical`)
- `definitions` — the motor, IMU, and button entries from the wizard; **all other definitions (extra sensors, servos, etc.) are preserved unchanged**

This partial-update behaviour makes it safe to re-run the wizard on an existing project — it will not erase custom definitions or advanced robot config you have added by hand.

## Dry-run preview

Run with `--dry-run` to see the resulting configuration without writing anything:

```bash
raccoon wizard --dry-run
```

The wizard still steps through all prompts, then prints a formatted summary table and exits with:

```
Dry run — raccoon.project.yml was not updated.
```

## After the wizard

The wizard prints a reminder when it saves:

```
Next step — physical configuration
Open the web IDE (raccoon web) and go to the Device tab to set your robot's
physical dimensions, sensor positions, rotation centre, and starting pose.
```

These additional settings (sensor offsets, rotation centre, starting pose) live in the physical section of the Device tab and are **not** configurable from the wizard — use the web IDE for them.

## Example session (mecanum robot)

```
raccoon wizard

  ╭─────────────────────────────────────────────────────────────────╮
  │ Raccoon Project Wizard                                          │
  │ Arrow keys to navigate · Enter to confirm · Ctrl-C to abort    │
  ╰─────────────────────────────────────────────────────────────────╯

Connect to a Pi? (enables live encoder calibration and syncing later) [Y/n]: n

Project name: [My Raccoon Robot] ConeBot

Drivetrain type:
  > Mecanum (4-wheel holonomic)
    Differential (2-wheel tank)

  [Drive motors]

  Front-left motor
    port:  > 0
    inverted? [N/y]: n

  Front-right motor
    port:  > 1
    inverted? [Y/n]: y

  Rear-left motor
    port:  > 2
    inverted? [N/y]: n

  Rear-right motor
    port:  > 3
    inverted? [Y/n]: y

  Button sensor (required — start/stop trigger)
    port:  > 10

  Physical measurements
    Wheel diameter (mm): [75.0]
    Track width cm (L↔R wheel centres): [20.0]
    Wheelbase cm (front↔rear axle): [15.0]
    Velocity low-pass alpha (0–1): [0.8]

Encoder ticks calibration (optional):
  > Skip — keep existing values

  ╭ Wizard Summary ──────────────────────────────────────────╮
  │  Project   name: ConeBot                                 │
  │  Drive     type: mecanum                                 │
  │            wheel_radius: 0.0375                          │
  │            track_width: 0.2                              │
  │            wheelbase: 0.15                               │
  │  Definitions  front_left_motor: {type: Motor, port: 0…} │
  │               …                                          │
  ╰──────────────────────────────────────────────────────────╯

Save configuration? [Y/n]: y
raccoon.project.yml updated.
```
