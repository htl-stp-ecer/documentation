---
title: "Quick Start"
date: 2024-01-01
draft: false
weight: 1
---

# Quick Start: From Robot Setup to Running a Program

This page covers the **minimum required steps** to go from a freshly assembled robot to a running program. Nothing optional, no detours.

---

## What You Need

**Hardware:**
- A Wombat controller (Raspberry Pi 5 based) with the Raccoon image flashed to the SD card
- At least 2 DC motors wired to motor ports 0 and 1
- A powered battery pack connected to the Wombat

**On your laptop:**
- Python 3.11 or newer
- pip (comes with Python)
- A terminal (Terminal on macOS/Linux, Windows Terminal on Windows)

> **[PICTURE: Photo of a Wombat controller with motors connected and battery attached]**

---

## Step 1 — Power On the Robot

Connect the battery and switch the Wombat on. After a few seconds the touchscreen will show the dashboard with three tiles: **Sensors & Actors**, **Programs**, and **Settings**.

> **[PICTURE: Robot touchscreen showing the dashboard with the three tiles]**

The robot also broadcasts a WiFi access point. The network name (SSID) and password are shown on the screen.

---

## Step 2 — Connect Your Laptop to the Robot's WiFi

On your laptop, open your WiFi settings and connect to the network the robot is broadcasting. The robot's IP address is usually **192.168.4.1** and is displayed on the touchscreen.

> **[PICTURE: Laptop WiFi settings screen selecting the robot's network]**

---

## Step 3 — Install raccoon on Your Laptop

Open a terminal and run:

```bash
pip install raccoon
```

Verify it installed correctly:

```bash
raccoon --help
```

You should see a list of available commands.

---

## Step 4 — Connect raccoon to Your Robot

```bash
raccoon connect 192.168.4.1
```

raccoon will establish a connection to the robot and save it for future commands. You only need to do this once (or when you switch robots).

Confirm the connection is active:

```bash
raccoon status
```

---

## Step 5 — Create a New Project

```bash
raccoon create project MyRobot
cd MyRobot
```

This creates a project folder with the following structure:

```
MyRobot/
├── raccoon.project.yml    ← hardware configuration
├── src/
│   ├── main.py            ← entry point
│   ├── hardware/          ← generated files (do not edit manually)
│   └── missions/          ← your mission files go here
```

---

## Step 6 — Configure Your Hardware

```bash
raccoon wizard
```

The wizard asks a series of questions:

1. **Drivetrain type** — choose `differential` (2 driven wheels) or `mecanum` (4 omnidirectional wheels)
2. **Motor ports** — which port number each motor is connected to on the Wombat
3. **Motor inversion** — whether any motors spin the wrong direction (you can always change this later)
4. **Robot dimensions** — wheel diameter and track width in millimetres

Your answers are saved to `raccoon.project.yml`. You can re-run the wizard at any time to change them.

---

## Step 7 — Generate Hardware Code

```bash
raccoon codegen
```

This reads your configuration and creates two files:

- `src/hardware/defs.py` — motor and sensor objects
- `src/hardware/robot.py` — the `Robot` class with your drivetrain

**Do not edit these files manually** — they are overwritten every time you run `codegen`.

---

## Step 8 — Calibrate Your Motors

Place the robot on the ground where the wheels can spin freely, then run:

```bash
raccoon calibrate
```

The motors will spin while the calibration routine measures their response. When it finishes, the optimal PID and feedforward parameters are saved to your `raccoon.project.yml` automatically.

> **[PICTURE: Robot on the floor with wheels spinning during calibration]**

---

## Step 9 — Write a Mission

Open `src/missions/` and create a file called `drive_mission.py`:

```python
from libstp.mission import Mission

class DriveMission(Mission):
    def sequence(self):
        # Drive forward 30 cm
        self.robot.motion.drive(distance_mm=300)

        # Turn 90 degrees right
        self.robot.motion.turn(angle_deg=90)

        # Drive forward 20 cm
        self.robot.motion.drive(distance_mm=200)
```

Then open `src/main.py` and register the mission:

```python
from hardware.robot import Robot
from missions.drive_mission import DriveMission

robot = Robot()
robot.add_mission(DriveMission)
robot.start()
```

---

## Step 10 — Run It

```bash
raccoon run
```

raccoon will automatically sync your project files to the robot and execute `src/main.py`. You will see the robot's output streamed back to your terminal in real time.

> **[PICTURE: Terminal showing output from raccoon run with the robot moving]**

---

## What Comes Next

Now that your robot is running, explore the rest of the documentation:

- **[raccoon-cli reference]({{< ref "/01-raccoon-cli" >}})** — all available commands explained
- **[Programming guide]({{< ref "/02-programming" >}})** — all motion commands, sensor APIs, and mission patterns
- **[Web IDE]({{< ref "/03-web-ide" >}})** — build missions visually in the browser
- **[Robot UI]({{< ref "/04-robot-ui" >}})** — what you can do from the robot's touchscreen

---

## Common Problems

**"Connection refused" when running `raccoon connect`**  
Make sure your laptop is connected to the robot's WiFi, not your home network.

**Motors don't move**  
Check that the motor cables are firmly seated in the Wombat ports. Verify the port numbers match what you entered in the wizard.

**Robot drives in the wrong direction**  
Re-run `raccoon wizard` and flip the `inverted` setting for the affected motor, then re-run `raccoon codegen`.

**Calibration fails immediately**  
Ensure the battery is sufficiently charged. Low battery prevents motor operation.
