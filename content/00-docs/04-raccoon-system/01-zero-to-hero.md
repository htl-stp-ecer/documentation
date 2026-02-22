---
title: "Zero to Hero"
date: 2024-01-01
draft: false
weight: 2
---

# Zero to Hero: Your First Raccoon Robot

This guide takes you from a blank slate to a running robot program. No prior Raccoon experience required.

## Prerequisites

**Hardware you need:**
- A Wombat controller (Raspberry Pi based) with the Raccoon image flashed
- At least 2 DC motors connected to motor ports
- A USB keyboard and mouse (for initial setup)
- A laptop on the same network as the robot

**Software on your laptop:**
- Python 3.8 or later
- pip (Python package manager)
- An SSH client (built into macOS/Linux, use PuTTY or Windows Terminal on Windows)

## Step 1: Install the Raccoon Toolchain

On your laptop, install the `raccoon` CLI tool:

```bash
pip install raccoon
```

This gives you the `raccoon` command for creating projects, generating code, syncing files, and running programs on the robot.

## Step 2: Connect to Your Robot

Power on the Wombat. It will create a Wi-Fi network (check the Wombat's screen for the network name and password). Connect your laptop to this network.

Find the robot's IP address (shown on the Wombat's touchscreen UI, usually `192.168.4.1`), then connect:

```bash
raccoon connect 192.168.4.1
```

This establishes an SSH connection and stores it for future commands.

## Step 3: Create a New Project

```bash
raccoon create project MyFirstRobot
cd MyFirstRobot
```

This creates a project directory with:
```
MyFirstRobot/
├── raccoon.project.yml    # Hardware configuration
├── run.sh                 # Execution script
├── src/
│   ├── main.py            # Entry point
│   ├── hardware/          # Generated hardware classes
│   └── missions/          # Your mission files
```

## Step 4: Configure Your Hardware

Run the interactive hardware wizard:

```bash
raccoon wizard
```

The wizard will ask you about:
- **Drivetrain type**: Choose `differential` (2-wheel) or `mecanum` (4-wheel omnidirectional)
- **Motor ports**: Which ports your motors are connected to
- **Motor inversion**: Whether any motors spin the wrong direction
- **Robot dimensions**: Width and length in centimeters
- **Sensors**: Which analog/digital sensors you have and their ports

This information is saved to `raccoon.project.yml`.

## Step 5: Generate Hardware Code

```bash
raccoon codegen
```

This reads your `raccoon.project.yml` and generates two Python files:

- `src/hardware/defs.py` -- Hardware definitions (motor objects, sensor objects, IMU)
- `src/hardware/robot.py` -- Robot class with drive system, odometry, and motion control

You never need to edit these files manually -- they're regenerated from the YAML config.

## Step 6: Write Your First Mission

Open `src/missions/` and create a file called `drive_forward_mission.py`:

```python
from libstp.mission import Mission

class DriveForwardMission(Mission):
    def sequence(self):
        # Drive forward 30 centimeters
        self.robot.motion.drive(distance_mm=300)

        # Turn 90 degrees to the right
        self.robot.motion.turn(angle_deg=90)

        # Drive forward another 20 centimeters
        self.robot.motion.drive(distance_mm=200)
```

Then update your `src/main.py` to run this mission:

```python
from hardware.robot import Robot
from missions.drive_forward_mission import DriveForwardMission

robot = Robot()
robot.add_mission(DriveForwardMission)
robot.start()
```

## Step 7: Calibrate Your Motors

Before running, calibrate your motors so the PID controllers are tuned for your specific hardware:

```bash
raccoon calibrate
```

This will:
1. Sync your project to the robot
2. Run the calibration routine (the motors will spin)
3. Determine optimal PID gains (kP, kI, kD) and feedforward parameters (kS, kV, kA)
4. Save results to your project configuration

**Important:** Place the robot on a surface where the wheels can spin freely during calibration.

## Step 8: Run Your Program

```bash
raccoon run
```

This will:
1. Auto-sync your project files to the robot via SFTP
2. Auto-run code generation if the config changed
3. Execute your program on the robot
4. Stream the output back to your terminal in real-time

You should see your robot drive forward, turn, and drive forward again.

## Step 9: Iterate and Improve

The development loop is:
1. Edit your mission code on your laptop
2. Run `raccoon run` -- it auto-syncs and executes
3. Watch the output and robot behavior
4. Repeat

You can also:
- **View sensor data** on the robot's touchscreen (tap "Sensors & Actors")
- **Monitor battery** on the touchscreen status bar
- **Use the web IDE** by opening `http://<robot-ip>:8421` in a browser

## What's Next?

- Read the [Library documentation](/00-docs/04-raccoon-system/03-library/) to learn about all available motion commands, sensor APIs, and advanced features
- Read the [Toolchain documentation](/00-docs/04-raccoon-system/04-toolchain/) for all `raccoon` CLI commands
- Check out the [Communication reference](/00-docs/04-raccoon-system/06-communication/) to understand how data flows through the system
- Explore [Increasing Robot Accuracy](/00-docs/01-programming/00-increasing-accuracy/) for tips on making your robot more precise

## Troubleshooting

### "Connection refused" when running `raccoon connect`
- Make sure you're on the robot's Wi-Fi network
- Check that the raccoon server is running: SSH into the Pi and run `sudo systemctl status raccoon.service`

### Motors don't move
- Check motor cable connections to the Wombat
- Verify the correct ports in `raccoon.project.yml`
- Make sure the `inverted` flag matches your motor wiring
- Check battery voltage on the touchscreen -- low battery can prevent motor operation

### Calibration fails
- Ensure wheels can spin freely (lift the robot off the ground)
- Make sure the battery is sufficiently charged (above 6V)
- Check that the STM32 firmware is flashed and running (the touchscreen should show sensor data)

### Robot drives in the wrong direction
- Swap the `inverted` flags for your motors in the wizard or `raccoon.project.yml`
- Re-run `raccoon codegen` after changing the config
