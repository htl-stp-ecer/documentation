---
title: "Project Model"
author: "Tobias Madlberger, Mario Scholze"
date: 2026-11-18
weight: 15
draft: false
---

# Project Model

This page explains how a project maps onto the running robot: what is generated, what you write, and what happens from `raccoon run` to the first movement. The layers of the library itself are on [Library Architecture]({{< ref "/06-advanced/01-architecture.md" >}}). Read this before diving into individual features — the mental model pays for itself many times over.

---

## Generated and handwritten files

Every raccoon project has the same structure. The key mental model is:

> **YAML is the single source of truth. Python is generated from YAML. You own the missions.**

```mermaid
graph LR
    YAML["raccoon.project.yml\n+ config/*.yml"]
    CLI["raccoon run / raccoon codegen"]
    GEN_DEFS["defs.py — GENERATED\nall hardware as Python objects"]
    GEN_ROBOT["robot.py — GENERATED\nkinematics + drive + mission list"]
    MAIN["main.py\nRobot().start()"]
    MISSIONS["src/missions/*.py\nyours to write and edit"]
    STEPS["src/steps/*.py\nyours to write and edit"]

    YAML -->|"read by"| CLI
    CLI -->|"generates"| GEN_DEFS
    CLI -->|"generates"| GEN_ROBOT
    GEN_DEFS -->|"imported by"| GEN_ROBOT
    GEN_ROBOT -->|"imported by"| MAIN
    GEN_ROBOT -->|"references"| MISSIONS
    MISSIONS -->|"may import"| STEPS

    style YAML fill:#FFA726,color:#fff
    style CLI fill:#42A5F5,color:#fff
    style GEN_DEFS fill:#AB47BC,color:#fff
    style GEN_ROBOT fill:#AB47BC,color:#fff
    style MAIN fill:#4CAF50,color:#fff
    style MISSIONS fill:#66BB6A,color:#fff
    style STEPS fill:#66BB6A,color:#fff
```

**Rules:**
- Edit `raccoon.project.yml` (and `config/*.yml`) to change hardware, kinematics, PIDs, or physical geometry.
- Run `raccoon run` — it regenerates `defs.py` and `robot.py` automatically, then executes.
- Write missions and steps freely — the codegen never touches those files.
- **Never edit `defs.py` or `robot.py` by hand** — your changes will be overwritten.

---

## From YAML to Running Robot

Here is what happens from the moment you type `raccoon run` to the moment the robot moves:

```mermaid
sequenceDiagram
    participant You
    participant CLI as raccoon run
    participant Codegen as Code Generator
    participant Sync as SFTP Sync
    participant Pi as Raspberry Pi
    participant Robot as robot.start()

    You->>CLI: raccoon run
    CLI->>Codegen: read raccoon.project.yml
    Codegen->>Codegen: generate defs.py + robot.py
    CLI->>Sync: sync changed files to Pi
    CLI->>Pi: execute src/main.py
    Pi->>Robot: Robot().start()
    Robot->>Robot: Platform.probe() — verify STM32 + IMU
    Robot->>Robot: run setup_mission (calibrate, home)
    Robot->>Robot: pre_start_gate (wait for light/button)
    loop Each main mission
        Robot->>Robot: run mission.sequence()
    end
    Robot->>Robot: run shutdown_mission
    Robot->>Robot: disable all motors
```

The probe step (`Platform.probe()`) verifies that the STM32 bridge and the IMU are reachable before any mission code runs, and raises `ProbeFailedError` if one is not. It fails fast so you find hardware problems immediately, not mid-mission. For offline development and headless tests, `LIBSTP_SKIP_PROBE=1` skips the probe.

---

## The Robot Definition: `Defs` + `Robot`

Two Python classes form the backbone of every project:

### `Defs` — Hardware Registry

A plain Python class with every physical component as a **class-level attribute**. You never instantiate `Defs` — you reference `Defs.front_left_motor` directly:

```python
class Defs:
    imu = IMU()
    button = DigitalSensor(port=10)
    front_left_motor = Motor(port=0, inverted=False, calibration=MotorCalibration(...))
    front_right_ir = IRSensor(port=0)
    front = SensorGroup(right=front_right_ir)
    arm = ServoPreset(Servo(port=1), positions={"up": 32, "down": 160})
    analog_sensors = [front_right_ir]   # REQUIRED for IR calibration
```

> **`analog_sensors` is required.** The `RobotDefinitionsProtocol` mandates it. If it is missing, the calibration steps raise an `AttributeError`; if it holds no IR sensors, they log a warning and skip the calibration.

### `Robot` — Integration Layer

A subclass of `GenericRobot` that wires kinematics, drive, odometry, and missions together. The `odometry` attribute is a lazy `@property` that calls `Platform.create_odometry(kinematics)` on first access — never a manually constructed object:

```python
class Robot(GenericRobot):
    defs = Defs()
    kinematics = DifferentialKinematics(...)
    drive = Drive(kinematics=kinematics, ...)
    # odometry: @property — platform-managed, not listed here
    shutdown_in = 120
    missions = [M010FirstMission()]
    setup_mission = M000SetupMission()
    shutdown_mission = M999ShutdownMission()
```

### Defs Relationship Diagram

```mermaid
graph TD
    DEFS["Defs class\nhardware inventory"]
    MOTOR["Motor objects\nport + calibration"]
    SERVO["ServoPreset objects\nnamed positions + offset"]
    SENSOR["IRSensor / AnalogSensor\ncalibration thresholds"]
    SGROUP["SensorGroup\nleft + right sensors"]
    ANALOG_LIST["analog_sensors list\nrequired for calibration"]

    ROBOT["Robot(GenericRobot)\nintegration layer"]
    DRIVE["Drive\nvelocity PID"]
    KIN["Kinematics\nDiff or Mecanum"]
    MISSIONS["Mission list"]

    DEFS --> MOTOR
    DEFS --> SERVO
    DEFS --> SENSOR
    SENSOR --> SGROUP
    DEFS --> ANALOG_LIST
    ROBOT --> DEFS
    ROBOT --> DRIVE
    DRIVE --> KIN
    KIN --> MOTOR
    ROBOT --> MISSIONS

    style DEFS fill:#AB47BC,color:#fff
    style ROBOT fill:#AB47BC,color:#fff
    style DRIVE fill:#42A5F5,color:#fff
    style KIN fill:#42A5F5,color:#fff
    style MISSIONS fill:#66BB6A,color:#fff
```

---

## Mission Execution Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Setup: robot.start()
    Setup --> PreStartGate: sequence() complete
    PreStartGate --> Running: light signal / button
    Running --> NextMission: mission complete
    NextMission --> Running: more missions
    NextMission --> Shutdown: no more missions
    Running --> Shutdown: shutdown_in timer fires
    Running --> Shutdown: mission.time_budget fires
    Shutdown --> [*]: all motors disabled
```

Key rules:
- **Setup mission** must subclass `SetupMission` (not `Mission`). If you get `TypeError: setup_mission must be a SetupMission`, this is why.
- **`shutdown_in`** is a last-resort safety timer (required by Botball rules). Your missions should complete well before it fires.
- **`time_budget`** on a `Mission` subclass adds a per-mission watchdog. When it fires, the main missions are cancelled, the shutdown mission runs and subsequent missions are skipped.
- The shutdown mission always runs, also after an error in the setup or a main mission. The error is re-raised afterwards, so the process exits non-zero.

---

## Import Convention

Always use `from raccoon import *` in mission and step files. `from libstp import *` is a deprecated compatibility shim that will be removed:

```python
# Correct — use this in all new code
from raccoon import *
from src.hardware.defs import Defs

# Deprecated — still works but emits DeprecationWarning
from libstp import *   # ← do not use
```

---

## Further Reading

| Topic | Page |
|-------|------|
| Full YAML reference for `raccoon.project.yml` | [Configuration Reference]({{< ref "/01-programming-guide/01-basics/02-config-reference.md" >}}) |
| `Defs` class patterns, `ServoPreset`, `SensorGroup` | [Robot Definition]({{< ref "/01-programming-guide/01-basics/05-robot-definition.md" >}}) |
| Writing your first mission | [Your First Robot Program]({{< ref "/01-programming-guide/01-basics/00-first-program.md" >}}) |
| YAML includes and `!include-merge` | [YAML Includes]({{< ref "/01-programming-guide/01-basics/03-yaml-includes.md" >}}) |
| Motion profiles and control loop internals | [Motion Flow and Kinematics]({{< ref "/01-programming-guide/02-driving/11-motion-flow-and-kinematics.md" >}}) |
