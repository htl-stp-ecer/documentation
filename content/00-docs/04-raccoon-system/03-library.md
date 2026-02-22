---
title: "Library (libstp)"
date: 2024-01-01
draft: false
weight: 4
---

# libstp -- The Raccoon Robotics Library

libstp is the core robotics library powering Raccoon. Written in C++20 with Python bindings via pybind11, it provides everything from low-level motor control to high-level motion planning.

## Architecture

The library is organized into 22 modules, each with a specific responsibility:

```
User Python Code
       │
       ▼
┌──────────────────────────────────────────────┐
│  High-Level API                               │
│  Robot, Mission, Step Framework               │
├──────────────────────────────────────────────┤
│  Motion & Control                             │
│  Drive (velocity), Motion (distance/angle)   │
├──────────────────────────────────────────────┤
│  Core Systems                                 │
│  Kinematics, Odometry, Calibration           │
├──────────────────────────────────────────────┤
│  Hardware Abstraction (HAL)                   │
│  Motor, Servo, Sensors, IMU                  │
├──────────────────────────────────────────────┤
│  Platform (Wombat via LCM)                   │
│  LcmReader, LcmWriter                       │
└──────────────────────────────────────────────┘
```

## Key Modules

### Foundation (libstp-foundation)

Strongly-typed units prevent conversion errors at compile time:

```python
from libstp import Meters, Radians, MetersPerSecond

# These types enforce correct usage
distance = Meters.from_cm(30)   # 0.30 meters
angle = Radians.from_deg(90)    # pi/2 radians
speed = MetersPerSecond(0.5)    # 0.5 m/s
```

Also provides: `PidController`, `FeedforwardController`, logging macros.

### Hardware Abstraction Layer (libstp-hal)

Interfaces for all hardware:

```python
from libstp import Motor, Servo, AnalogSensor, DigitalSensor, IMU

# Motor control
motor = Motor(port=0, inverted=False)
motor.setVelocity(500)           # BEMF units
motor.moveToPosition(300, 1000)  # velocity, target position
position = motor.getPosition()   # accumulated BEMF ticks

# Servo control
servo = Servo(port=0)
servo.setPosition(1024)          # 0-2047 range
servo.disable()

# Sensors
analog = AnalogSensor(port=0)
value = analog.getValue()        # 12-bit ADC reading

digital = DigitalSensor(port=10)
pressed = digital.getValue()     # True/False

# IMU
imu = IMU()
gyro = imu.getGyroscope()        # (x, y, z) in rad/s
accel = imu.getAccelerometer()   # (x, y, z) in m/s^2
quat = imu.getQuaternion()       # (w, x, y, z) orientation
```

**Port safety:** When `SAFETY_CHECKS_ENABLED` is on (default), the library tracks which ports are in use and prevents double-assignment.

### Kinematics (libstp-kinematics)

Supports two drivetrain types:

**Differential Drive** -- 2 motors, skid steering:
```python
# Forward kinematics: chassis velocity → wheel speeds
# Inverse kinematics: wheel speeds → chassis velocity estimate
```

**Mecanum Drive** -- 4 omnidirectional wheels:
```python
# Can move in any direction: forward, lateral, rotation
# All 4 wheels contribute to motion in X, Y, and rotation
```

### Drive (libstp-drive)

High-frequency velocity controller running at 100+ Hz:

```python
# The Drive class manages per-axis velocity controllers:
# - vx (forward/backward)
# - vy (lateral, mecanum only)
# - wz (rotation)
#
# Each axis uses PID + feedforward control
# Handles motor saturation detection and management
```

### Motion Primitives (libstp-motion)

Higher-level motion commands with trapezoidal velocity profiles:

```python
# LinearMotion: drive forward/lateral with heading correction
robot.motion.drive(distance_mm=500)      # Drive 500mm forward
robot.motion.strafe(distance_mm=200)     # Strafe 200mm right (mecanum)

# TurnMotion: rotate with profiled angular setpoints
robot.motion.turn(angle_deg=90)          # Turn 90 degrees right
robot.motion.turn(angle_deg=-45)         # Turn 45 degrees left
```

Motion commands use trapezoidal acceleration profiles and PID controllers with cross-track error correction for smooth, accurate movement.

### Odometry (libstp-odometry)

Fused position tracking combining multiple sensors:

```python
pose = robot.odometry.getPose()          # (x, y, heading)
heading = robot.odometry.getHeading()    # Current heading in radians
distance = robot.odometry.getDistanceFromOrigin()
```

**Fused Odometry** combines:
- Wheel encoders (BEMF) for distance
- IMU gyroscope for heading
- Accelerometer for drift correction

### Calibration (libstp-calibration)

Automatic motor and motion tuning:

**Motor Calibration** determines:
- kS: Static friction compensation
- kV: Velocity constant (via linear regression)
- kA: Acceleration constant
- PID gains: via step response or relay feedback methods

**Motion Calibration** tunes:
- Distance PID (how accurately the robot drives to a target distance)
- Heading PID (how accurately the robot maintains its heading)
- Uses Nelder-Mead optimization with metrics: ITAE, jerk, settling time, overshoot

### Robot API (libstp-robot)

The top-level class your programs use:

```python
from hardware.robot import Robot

robot = Robot()
# Properties:
#   robot.drive     -- velocity controller
#   robot.motion    -- motion primitives (drive, turn, strafe)
#   robot.odometry  -- position tracking

# Mission execution:
robot.add_mission(SetupMission)
robot.add_mission(MainMission)
robot.add_mission(ShutdownMission)
robot.start()  # Runs missions in order
```

### Step Framework (libstp-step)

Python-based task execution with sequential and parallel composition:

```python
from libstp.step import Sequential, Parallel, Drive, Turn, Wait

mission = Sequential([
    Drive(500),                              # Drive 500mm
    Turn(90),                                # Turn 90 degrees
    Parallel([Drive(300), Wait(1.0)]),       # Run in parallel
])
mission.run()
```

Steps are discovered automatically by the WebIDE backend, which scans for `@dsl` decorated functions.

### IR Sensor (libstp-sensor-ir)

Line detection with statistical calibration:

```python
from libstp import IRSensor

sensor = IRSensor(port=0)
sensor.calibrate_black(samples=100)   # Train on black surface
sensor.calibrate_white(samples=100)   # Train on white surface

if sensor.isOnBlack():
    # Robot is on a line
    pass

probability = sensor.probabilityOfBlack()  # 0.0 to 1.0
```

## Building libstp

### Local Build (for testing)

```bash
cd library
mkdir build && cd build
cmake .. -DUSE_SPI_MOCK=ON
make -j$(nproc)
```

### Docker Cross-Compilation (for Pi)

```bash
cd library
./build.sh          # Builds ARM64 wheel
./deploy.sh         # Installs on Pi via SSH
```

**Environment variables:**
- `RPI_HOST` -- Pi IP address
- `RPI_USER` -- SSH username (default: `pi`)
- `BUILD_TYPE` -- `Release` or `Debug`

### Key Build Options

| CMake Flag | Default | Description |
|-----------|---------|-------------|
| `ENABLE_SAFETY_CHECKS` | ON | Port tracking and safety assertions |
| `LIBSTP_TRACE_LOGGING` | ON | Compile trace-level log statements |
| `LIBSTP_BUILD_TESTS` | OFF | Build C++ test suite |

## Dependencies

- **Eigen 3.4.0** -- Linear algebra (kinematics, odometry)
- **LCM 1.5.0** -- Inter-process communication
- **spdlog 1.14.1** -- Structured logging
- **pybind11 2.13.6** -- Python bindings
- **yaml-cpp 0.7.0** -- Configuration parsing
- **Google Test 1.14.0** -- C++ unit tests (optional)
