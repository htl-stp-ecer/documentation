---
title: "Missions"
date: 2024-01-01
draft: false
weight: 1
---

# Missions

A **mission** is a single autonomous routine that the robot executes. A project usually has several missions — one for setup, one (or more) for the main tasks, and one for shutdown. They run in order.

---

## Mission Structure

Every mission is a Python class that inherits from `Mission` and implements a `sequence` method:

```python
from libstp.mission import Mission

class MyMission(Mission):
    def sequence(self):
        # All your robot actions go here
        self.robot.motion.drive(distance_mm=500)
        self.robot.motion.turn(angle_deg=90)
```

The `sequence` method runs top-to-bottom. Each call blocks until the action completes before moving to the next line.

---

## Registering Missions in main.py

Open `src/main.py` to see (or change) the order missions run:

```python
from hardware.robot import Robot
from missions.my_mission import MyMission
from missions.collect_mission import CollectMission

robot = Robot()
robot.add_mission(MyMission)
robot.add_mission(CollectMission)
robot.start()
```

Missions run in the order they are added with `add_mission`.

---

## Setup and Shutdown Missions

When you create a project, raccoon generates two special missions:

- **`SetupMission`** — runs first, before any other missions. Use it to initialize positions (e.g., move a servo to its starting position) or wait for a start button.
- **`ShutdownMission`** — runs last, after all missions. Use it to safely park motors and servos.

These are just regular missions — you can put any code you want in them.

---

## Adding a New Mission

```bash
raccoon create mission <name>
```

This creates a skeleton file in `src/missions/`. Then register it in `src/main.py` with `robot.add_mission(...)`.

---

## Accessing Hardware in a Mission

Inside `sequence`, use `self.robot` to access the robot's hardware:

```python
def sequence(self):
    # Motion
    self.robot.motion.drive(distance_mm=300)

    # Read a sensor
    value = self.robot.sensors.analog(port=0)

    # Control a servo
    self.robot.servo(port=0).set_position(90)
```

See the [Motion guide]({{< ref "/02-programming/01-motion" >}}) and [Sensors guide]({{< ref "/02-programming/02-sensors" >}}) for all available commands.
