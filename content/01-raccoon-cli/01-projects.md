---
title: "Managing Projects"
date: 2024-01-01
draft: false
weight: 2
---

# Managing Projects

A **project** is a folder containing your robot's hardware configuration and all your mission code. A project contains one or more **missions** — individual autonomous routines your robot can execute.

---

## Creating a Project

```bash
raccoon create project <name>
```

Example:

```bash
raccoon create project MyRobot
cd MyRobot
```

This creates a folder with the following structure:

```
MyRobot/
├── raccoon.project.yml    ← hardware and connection configuration
├── src/
│   ├── main.py            ← entry point — registers and runs missions
│   ├── hardware/
│   │   ├── defs.py        ← generated motor/sensor objects (do not edit)
│   │   └── robot.py       ← generated Robot class (do not edit)
│   ├── missions/
│   │   ├── setup_mission.py     ← runs before your main missions
│   │   └── shutdown_mission.py  ← runs after your main missions
│   └── steps/             ← optional custom step definitions
```

---

## Adding a Mission

Inside a project directory:

```bash
raccoon create mission <name>
```

Example:

```bash
raccoon create mission CollectBalls
```

This creates `src/missions/collect_balls_mission.py` with a mission skeleton ready for you to fill in.

---

## Listing Projects and Missions

Show all projects in the current directory:

```bash
raccoon list projects
```

Show all missions in the current project:

```bash
raccoon list missions
```

---

## Removing a Mission

```bash
raccoon remove mission <name>
```

This deletes the mission file. The change only takes effect on the robot after the next `raccoon sync` or `raccoon run`.

---

## The Configuration File

`raccoon.project.yml` stores everything about your project. You can view and edit it with any text editor, but most settings are more easily managed through `raccoon wizard` and `raccoon codegen`.

A typical configuration looks like:

```yaml
name: MyRobot
uuid: a1b2c3d4-...        # unique identifier, do not change
missions:
  - SetupMission
  - CollectBalls
  - ShutdownMission

drivetrain_type: differential   # or mecanum

motors:
  left_motor:
    port: 0
    inverted: false
    calibration:
      pid: {kp: 4.4, ki: 10.0, kd: 0.165}
      ff: {kS: 0.024, kV: 0.041, kA: 0.007}
  right_motor:
    port: 1
    inverted: true
    calibration:
      pid: {kp: 4.4, ki: 10.0, kd: 0.165}
      ff: {kS: 0.024, kV: 0.041, kA: 0.007}

connection:
  pi_address: 192.168.4.1
  pi_port: 8421
  pi_user: pi
```

The `calibration` values under each motor are written automatically by `raccoon calibrate` — you normally do not need to edit them manually.
