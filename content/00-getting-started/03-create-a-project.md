---
title: "Create a Project"
author: "Tobias Madlberger, Mario Scholze"
date: 2026-11-19
draft: false
weight: 30
description: "Set up a new robot project from the example template with one command."
---

# Create a Project

One command sets up everything: it installs the tools you need, asks you a few questions, downloads the example project, and prepares it for you.

Open a terminal in the folder you'd like to create the project in, then run the command for your system:

**Linux / macOS:**

```bash
curl -LsSf https://raw.githubusercontent.com/htl-stp-ecer/raccoon-template/main/raccoon-setup.sh | bash
```

**Windows (PowerShell):**

```
irm https://raw.githubusercontent.com/htl-stp-ecer/raccoon-template/main/raccoon-setup.ps1 | iex
```

The script will:
1. Install **Git** and **uv** if they are missing (uv also downloads the right Python version for you — no separate Python install needed)
2. Ask for a **project name** (letters, digits, `-` and `_`; must start with a letter)
3. Ask for your **drivetrain type**: `differential` (two-wheeled) or `mecanum` ("omniwheeled"). Other bot types are currently not supported by the template.
4. Download the matching branch of the [example project](https://github.com/htl-stp-ecer/raccoon-template) into a new folder named after your project, and rename the project inside its config files
5. Give the project its own fresh git repository and a unique project ID (`uuid`)
6. Run `uv sync` to download `raccoon-cli` and `raccoon-library` and create the virtual environment
7. Create the first commit

If the current folder is not writable, or a folder with your project name already exists, the script stops without changing anything.

Once it finishes, go into your project and activate the Python virtual environment, which makes the `raccoon` command available:

```bash
cd MyRobot     # replace "MyRobot" with your project name
```

- **Windows (PowerShell):** `.venv\Scripts\Activate.ps1`
- **Windows (cmd.exe):** `.venv\Scripts\activate.bat`
- **Linux / macOS:** `source .venv/bin/activate`

You know it worked when the command line is prefixed with `(MyRobot)` or `(.venv)`. Remember to activate the venv again whenever you open a new terminal.

The project you get looks like this:

```
MyRobot/
├── raccoon.project.yml         # top-level config — includes all sub-configs
├── config/
│   ├── connection.yml          # saved robot IP address (automatically managed)
│   ├── hardware.yml            # sensors, motors, servos
│   ├── missions.yml            # ordered list of missions to run
│   ├── motors.yml              # motor port assignments and calibration
│   ├── robot.yml               # kinematics, PID, physical dimensions
│   ├── run-configurations.yml  # named run profiles for `raccoon run` (default, dev, dev-nc, profile)
│   └── servos.yml              # servo ports and named positions
└── src/
    ├── main.py                 # entry point: Robot().start()
    ├── mission_params.py       # Mission parameter which you can adjust before a run on the screen
    ├── hardware/
    │   ├── defs.py             # auto-generated on `raccoon run` (not in git)
    │   ├── defs.pyi            # auto-generated on `raccoon run` (not in git)
    │   └── robot.py            # auto-generated on `raccoon run` (not in git)
    ├── missions/
    │   ├── m000_setup_mission.py
    │   ├── m010_navigate_to_object_mission.py
    │   ├── m020_collect_object_mission.py
    │   ├── m030_deliver_object_mission.py
    │   └── m999_shutdown_mission.py
    └── steps/                  # reusable custom steps used by the missions
```

The example comes with a small set of demo missions you can read, change, or delete. The `hardware/` files are generated from your YAML config, so edit the YAML, not the Python.

→ See [Project Structure]({{< ref "/01-programming-guide/01-basics/02-project-structure.md" >}}) for a full explanation of every file.

## Optional: IDE Setup

Open the project folder in your preferred IDE (PyCharm, VS Code, etc.). You'll have full tab completion on all `raccoon` types out of the box — no special interpreter configuration needed. Stubs are provided for the `raccoon.*` namespace and are installed alongside the library.
