---
title: "Hardware Wizard"
date: 2024-01-01
draft: false
weight: 3
---

# Hardware Wizard

The hardware wizard is an interactive prompt that lets you describe your robot's physical hardware. It saves everything to `raccoon.project.yml`.

---

## Running the Wizard

From inside your project directory:

```bash
raccoon wizard
```

The wizard walks you through each section one question at a time.

> **[PICTURE: Terminal showing the raccoon wizard prompt with a drivetrain type question]**

---

## What the Wizard Configures

### Drivetrain Type

Choose between:

- **`differential`** — Two driven wheels (one on each side). The robot turns by driving wheels at different speeds.
- **`mecanum`** — Four mecanum wheels. The robot can also move sideways (strafe) in addition to forward/back and turning.

### Motor Ports

For each drive motor, you specify:

- **Port number** — The physical port number on the Wombat (0–3) that the motor is plugged into.
- **Is it inverted?** — If the motor spins the wrong direction (robot moves backward when it should go forward), mark it as inverted. You can also determine this by watching the robot and re-running the wizard.

> **[PICTURE: Wombat controller with numbered motor ports labeled]**

### Robot Dimensions

- **Wheel diameter** in millimetres — used to convert encoder ticks to real-world distance.
- **Track width** (distance between left and right wheels) in millimetres — used for accurate turning.

For mecanum robots, the wizard also asks for the **wheelbase** (front-to-back wheel distance).

### Sensors

The wizard asks which analog and digital sensors are connected and to which ports. Each sensor type has its own configuration questions.

---

## Changing Configuration Later

You can re-run `raccoon wizard` at any time to update any setting. After changing anything, run `raccoon codegen` to regenerate the hardware files so the changes take effect.

You can also directly edit `raccoon.project.yml` in a text editor for quick changes like port numbers.
