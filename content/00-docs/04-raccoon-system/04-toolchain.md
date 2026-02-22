---
title: "Toolchain (raccoon CLI)"
date: 2024-01-01
draft: false
weight: 5
---

# The Raccoon Toolchain

The `raccoon` CLI is the developer-facing tool for creating, building, and running robot programs. It handles project scaffolding, hardware configuration, code generation, file synchronization, and remote execution.

## Installation

```bash
pip install raccoon
```

This installs two commands:
- `raccoon` -- The developer CLI (used on your laptop)
- `raccoon-server` -- The daemon that runs on the Pi

## Command Reference

### `raccoon create project <name>`

Creates a new robot project with the standard directory structure:

```bash
raccoon create project MyRobot
```

Generates:
```
MyRobot/
├── raccoon.project.yml     # Hardware and mission configuration
├── run.sh                  # Shell wrapper for execution
├── upload.sh               # Upload script
└── src/
    ├── main.py             # Program entry point
    ├── hardware/           # Generated code (defs.py, robot.py)
    └── missions/           # Your mission files
```

### `raccoon create mission <name>`

Adds a new mission to your project:

```bash
raccoon create mission CollectPoms
```

Creates `src/missions/collect_poms_mission.py` with a skeleton `Mission` class.

### `raccoon wizard`

Interactive hardware configuration wizard. Prompts for:
- Drivetrain type (differential / mecanum)
- Motor port assignments and inversion flags
- Robot physical dimensions (width, length in cm)
- Sensor ports and types

Updates `raccoon.project.yml` with your choices.

### `raccoon codegen`

Generates Python hardware classes from `raccoon.project.yml`:

| Generated File | Contains |
|---------------|----------|
| `src/hardware/defs.py` | Motor, Servo, Sensor, and IMU objects |
| `src/hardware/robot.py` | Robot class with drive, odometry, and motion control |

The generator is cache-aware -- it skips regeneration if the config hasn't changed.

**How it works:**
1. Reads `raccoon.project.yml`
2. Resolves YAML types to Python classes (e.g., `Motor` -> `libstp.Motor`)
3. Builds an AST using libcst
4. Formats with Black
5. Writes the generated files

### `raccoon run`

Executes your robot program. When connected to a Pi:

1. Syncs project files to the Pi (hash-based, only changed files)
2. Runs `raccoon codegen` if config changed
3. Executes the program on the Pi
4. Streams output back to your terminal in real-time via WebSocket
5. Syncs any changed files back to your laptop

```bash
raccoon run                # Run on connected Pi
raccoon run --local        # Run locally (for testing)
```

### `raccoon calibrate`

Runs the motor calibration routine on the robot. Determines:
- **kS**: Static friction compensation
- **kV**: Velocity constant
- **kA**: Acceleration constant
- **PID gains**: kP, kI, kD for velocity control

Results are saved to `raccoon.project.yml` and used by the generated robot code.

### `raccoon connect <ip>`

Establishes a connection to the robot:

```bash
raccoon connect 192.168.4.1
```

Stores the connection in `~/.raccoon/config.yml` for subsequent commands.

### `raccoon sync`

Manually sync project files:

```bash
raccoon sync push     # Laptop → Pi
raccoon sync pull     # Pi → Laptop
```

Uses rsync when available (Linux/macOS), falls back to SFTP (Windows).

### `raccoon web`

Opens the web-based IDE in your browser. The IDE provides:
- In-browser code editing
- Project file explorer
- Mission management
- Real-time output viewing
- Hardware configuration

### `raccoon status`

Shows current connection info and project state.

## Project Configuration

The `raccoon.project.yml` file is the heart of every project:

```yaml
name: MyRobot
uuid: unique-project-identifier

robot:
  drive:
    kinematics:
      type: mecanum
      wheel_radius: 0.035
      wheelbase: 0.17
      left_motor: front_left_motor
      right_motor: front_right_motor
  odometry:
    type: FusedOdometry
  motion_pid:
    distance:
      kp: 1.25
      ki: 0.0
      kd: 0.6875
    heading:
      kp: 2.1875
      ki: 0.0
      kd: 0.3062

definitions:
  button:
    type: DigitalSensor
    port: 10
  front_left_motor:
    type: Motor
    port: 0
    inverted: false
    calibration:
      ticks_to_rad: 1.753e-05
      vel_lpf_alpha: 1.0
  front_left_ir_sensor:
    type: IRSensor
    port: 0

missions:
  - SetupMission
  - MainMission
  - ShutdownMission

connection:
  pi_address: 192.168.4.1
  pi_port: 8421
  pi_user: pi
  auto_connect: true
```

## Remote Development Architecture

The toolchain uses a client-server model:

```
Laptop (raccoon CLI)                   Pi (raccoon-server)
├─ Project editing                     ├─ FastAPI daemon (port 8421)
├─ File sync (rsync/SFTP)  ──────────→├─ Program execution
├─ WebSocket output stream ←──────────├─ Output buffering
└─ SSH key management                  └─ Systemd auto-start
```

**Server endpoints:**

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Health check + version |
| `GET /api/v1/projects` | List projects |
| `POST /api/v1/run/{id}` | Start program |
| `POST /api/v1/calibrate/{id}` | Start calibration |
| `POST /api/v1/codegen/{id}` | Run code generation |
| `WS /ws/output/{id}` | Stream program output |

## Pi Server Management

```bash
# Install the server as a systemd service
sudo raccoon-server install --user pi

# Check status
sudo systemctl status raccoon.service

# View logs
sudo journalctl -u raccoon.service -f

# Restart
sudo systemctl restart raccoon.service
```

The server runs on port 8421 with memory limited to 256 MB, auto-restarts on failure, and runs as the unprivileged `pi` user.
