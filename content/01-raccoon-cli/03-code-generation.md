---
title: "Code Generation"
date: 2024-01-01
draft: false
weight: 4
---

# Code Generation

Code generation turns your `raccoon.project.yml` configuration into Python files that your mission code can use. You never write these files yourself — raccoon writes them for you.

---

## Running Code Generation

From inside your project directory:

```bash
raccoon codegen
```

This produces two files:

### `src/hardware/defs.py`

Contains the individual hardware objects — one object per motor, per servo, per sensor. You import these in your mission code when you need to interact with a specific piece of hardware directly.

### `src/hardware/robot.py`

Contains the `Robot` class, which bundles everything together: the drivetrain, the motion controller, odometry, and all sensors. This is the main entry point for your mission code.

---

## When to Re-run codegen

Run `raccoon codegen` again any time you change `raccoon.project.yml`, for example after:

- Running `raccoon wizard` and changing any settings
- Adding or removing motors or sensors
- Running `raccoon calibrate` (calibration values are stored in the YAML and need to be baked into the generated files)

`raccoon run` automatically re-runs `codegen` if the configuration has changed since the last generation, so in normal development you do not need to think about this.

---

## Important Notes

- **Do not manually edit** `src/hardware/defs.py` or `src/hardware/robot.py`. Your changes will be overwritten the next time codegen runs.
- All your custom code belongs in `src/missions/`, `src/steps/`, and `src/main.py`.
