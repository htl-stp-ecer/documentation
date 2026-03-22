---
title: "Configuration Reference"
author: "Tobias Madlberger"
date: 2026-03-22
draft: false
weight: 14
---

This page is a complete reference for every key in every configuration file used by a raccoon/libstp project. Configuration is split across several YAML files that are assembled by raccoon's include-aware loader at build time. All paths are relative to the project root.

## File layout and include graph

```
raccoon.project.yml
  ├── config/robot.yml         (robot: key)
  ├── config/missions.yml      (missions: key)
  ├── config/hardware.yml      (definitions: key)
  │   ├── config/motors.yml    (!include-merge)
  │   └── config/servos.yml    (!include-merge)
  └── config/connection.yml    (connection: key)
```

`raccoon.project.yml` is the root file. It uses `!include` to delegate each top-level section to the files listed above. `config/hardware.yml` in turn uses `!include-merge` for motors and servos, which means all motor and servo entries are promoted to the same level as the sensor definitions.

---

## `raccoon.project.yml`

The root project descriptor. Only a handful of keys live here directly; the rest are delegated.

| Key | Type | Description |
|-----|------|-------------|
| `name` | `string` | Human-readable project name. Displayed in the raccoon CLI and web IDE. Set once at `raccoon create`. |
| `uuid` | `string` | A unique identifier for the project (UUID v4). Used by the raccoon daemon to route commands to the correct project on the Pi. Set once at `raccoon create`, never change manually. |
| `robot` | `!include` | Delegates to `config/robot.yml`. The entire robot subsystem configuration lives there. |
| `missions` | `!include` | Delegates to `config/missions.yml`. The ordered list of missions. |
| `definitions` | `!include` | Delegates to `config/hardware.yml`. All hardware object definitions. |
| `connection` | `!include` | Delegates to `config/connection.yml`. SSH and daemon connection settings. |

---

## `config/robot.yml`

Top-level robot configuration. Maps directly to the generated `Robot` class in `src/hardware/robot.py`.

### `shutdown_in`

| Attribute | Value |
|-----------|-------|
| Type | `integer` |
| Default | `120` |
| Required | Yes |

Number of seconds after program start after which `GenericRobot` will automatically shut down the running mission sequence. Prevents the robot from running indefinitely if something goes wrong. Set to `0` to disable.

---

### `drive`

Container for the drive subsystem. All motion steps read their kinematics and velocity control from here.

#### `drive.kinematics`

Specifies the kinematic model that maps chassis velocities to per-wheel commands.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `type` | `string` | — | **Required.** Kinematic model. Supported values: `differential`, `mecanum`. |
| `wheel_radius` | `float` | — | **Required.** Wheel radius in metres. Used to convert angular wheel velocity (rad/s) to linear velocity (m/s). |
| `wheelbase` | `float` | — | **Required for differential and mecanum.** Distance between the left and right wheel contact patches in metres. For mecanum this is the front-to-back axle distance. |
| `track_width` | `float` | — | **Required for mecanum only.** Left-to-right distance between wheel contact patches in metres. |
| `left_motor` | `string` | — | **Required for differential.** Name of the left drive motor as it appears in `definitions`. Translated to `defs.<name>` in generated code. |
| `right_motor` | `string` | — | **Required for differential.** Name of the right drive motor as it appears in `definitions`. |
| `front_left_motor` | `string` | — | **Required for mecanum.** Name of the front-left motor in `definitions`. |
| `front_right_motor` | `string` | — | **Required for mecanum.** Name of the front-right motor in `definitions`. |
| `back_left_motor` | `string` | — | **Required for mecanum.** Name of the back-left motor in `definitions`. |
| `back_right_motor` | `string` | — | **Required for mecanum.** Name of the back-right motor in `definitions`. |

The `type` value is case-insensitive. `DifferentialKinematics` is instantiated as `DifferentialKinematics(left_motor, right_motor, wheelbase, wheel_radius)` and `MecanumKinematics` as `MecanumKinematics(front_left_motor, front_right_motor, back_left_motor, back_right_motor, wheelbase, track_width, wheel_radius)`.

Example — differential drive:

```yaml
drive:
  kinematics:
    type: differential
    wheel_radius: 0.03
    wheelbase: 0.16
    left_motor: left_motor
    right_motor: right_motor
```

#### `drive.vel_config`

Per-axis chassis velocity control configuration. Each axis has a PID controller and a feedforward term that together compute the motor command voltage.

The three axes are:

- `vx` — forward/backward linear velocity (m/s)
- `vy` — lateral (strafe) velocity (m/s); only relevant for mecanum
- `wz` — angular (yaw) velocity (rad/s)

Each axis block has the same structure:

```yaml
vel_config:
  vx:
    pid:
      kp: 0.0
      ki: 0.0
      kd: 0.0
    ff:
      kS: 0.0
      kV: 1.0
      kA: 0.0
  vy:
    pid: { kp: 0.0, ki: 0.0, kd: 0.0 }
    ff:  { kS: 0.0, kV: 1.0, kA: 0.0 }
  wz:
    pid: { kp: 0.0, ki: 0.0, kd: 0.0 }
    ff:  { kS: 0.0, kV: 1.0, kA: 0.0 }
```

**`pid` sub-keys** (maps to `PidGains`):

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `kp` | `float` | `0.0` | Proportional gain. |
| `ki` | `float` | `0.0` | Integral gain. |
| `kd` | `float` | `0.0` | Derivative gain. |

**`ff` sub-keys** (maps to `Feedforward`):

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `kS` | `float` | `0.0` | Static friction compensation. Added as a constant offset whenever the commanded velocity is non-zero. |
| `kV` | `float` | `1.0` | Velocity feedforward coefficient. Scales the commanded velocity to produce the open-loop motor command. `1.0` means the motor command equals the setpoint directly when no error exists. |
| `kA` | `float` | `0.0` | Acceleration feedforward coefficient. |

The `vel_config` is translated into a `ChassisVelocityControlConfig` struct at code-generation time.

---

### `odometry`

Selects the odometry model used to estimate the robot's pose (position + heading) during autonomous motion.

Can be specified in two forms:

**Short form** (type name only):
```yaml
odometry: FusedOdometry
```

**Long form** with configuration:
```yaml
odometry:
  type: FusedOdometry
  config:
    bemf_trust: 1.0
```

Supported `type` values (case-insensitive): `FusedOdometry`, `fused`, `ImuOdometry`, `imu`.

When `type` is `FusedOdometry`, the optional `config` sub-block maps to `FusedOdometryConfig`:

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `config.bemf_trust` | `float` | `0.95` | Complementary filter coefficient. `1.0` = rely entirely on BEMF-derived velocity; `0.0` = rely entirely on IMU accelerometer integration. Values between `0.8` and `1.0` are typical. |
| `config.imu_ready_timeout_ms` | `integer` | `1000` | Maximum milliseconds to wait for the IMU to become ready on startup. |
| `config.enable_accel_fusion` | `bool` | `true` | Enable the complementary filter that fuses BEMF estimates with IMU linear acceleration. When `false`, only BEMF is used for velocity. |
| `config.turn_axis` | `string` | `"world_z"` | Which axis to use for yaw rate. Accepted values: `"world_z"`, `"body_x"`, `"body_y"`, `"body_z"`. Change to a body axis only if the robot's up-axis is not the sensor's body Z. |

---

### `motion_pid`

Unified configuration for the position/heading PID controllers used by all drive-based motion steps (`Drive`, `Turn`, `DriveAngle`, etc.). **Required.**

This entire block maps to the `UnifiedMotionPidConfig` C++ struct.

#### Distance PID (`motion_pid.distance`)

Controls convergence toward a position target (linear or 2-D).

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `kp` | `float` | `2.0` | Proportional gain (velocity per metre of error). |
| `ki` | `float` | `0.0` | Integral gain. |
| `kd` | `float` | `0.0` | Derivative gain. |
| `integral_max` | `float` | `10.0` | Maximum accumulated integral value (anti-windup). |
| `integral_deadband` | `float` | `0.01` | Error magnitude below which the integrator stops accumulating. |
| `derivative_lpf_alpha` | `float` | `0.1` | Low-pass filter coefficient for the derivative term. `0.1` = heavy filtering; `1.0` = no filtering. |
| `output_min` | `float` | `-10.0` | Minimum PID output (velocity command, m/s or rad/s). |
| `output_max` | `float` | `10.0` | Maximum PID output. |

#### Heading PID (`motion_pid.heading`)

Controls convergence toward an angular target.

Same sub-keys as `distance` (`kp`, `ki`, `kd`, `integral_max`, `integral_deadband`, `derivative_lpf_alpha`, `output_min`, `output_max`).

Scaffold defaults: `kp: 3.0`, all others matching the distance block.

#### Velocity feedforward

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `velocity_ff` | `float` | `1.0` | Scalar multiplied by the profiled velocity target and added directly to the PID output as open-loop feedforward. `1.0` means full feedforward. |

#### Convergence tolerances

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `distance_tolerance_m` | `float` | `0.01` | Position error below which the robot is considered to have reached its linear target (metres). |
| `angle_tolerance_rad` | `float` | `0.02` | Heading error below which the robot is considered to have reached its angular target (radians). |

#### Linear saturation handling

When the drive command saturates the actuators, the controller de-rates its output to prevent integral windup.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `saturation_derating_factor` | `float` | `0.85` | Multiplier applied to the output scale when saturation is detected. Values below `1.0` cause the controller to back off. |
| `saturation_min_scale` | `float` | `0.1` | Minimum scale the de-rating is allowed to reach. Prevents the controller from going completely silent. |
| `saturation_recovery_rate` | `float` | `0.02` | Per-cycle increment to the output scale during recovery from saturation. |
| `saturation_hold_cycles` | `integer` | `5` | Number of consecutive unsaturated cycles required before recovery begins. |
| `saturation_recovery_threshold` | `float` | `0.95` | Output scale at which the robot is considered to have fully recovered from saturation. |

#### Heading-specific saturation handling

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `heading_saturation_derating_factor` | `float` | `0.85` | Same as `saturation_derating_factor` but applied to heading-axis saturation only. |
| `heading_min_scale` | `float` | `0.25` | Minimum heading output scale. Higher than the linear minimum because heading corrections are always needed. |
| `heading_recovery_rate` | `float` | `0.05` | Per-cycle recovery rate for heading saturation. |
| `heading_saturation_error_rad` | `float` | `0.01` | Heading error below which saturation de-rating engages for the heading axis. |
| `heading_recovery_error_rad` | `float` | `0.005` | Heading error threshold for considering heading saturation fully recovered. |

#### Motion profile constraints

These three sub-blocks are **populated automatically by `raccoon calibrate characterize_drive`** and should not be edited manually. They are commented out in the scaffold until characterization is run.

```yaml
motion_pid:
  linear:
    max_velocity: 0.0   # m/s
    acceleration: 0.0   # m/s²
    deceleration: 0.0   # m/s²
  lateral:
    max_velocity: 0.0
    acceleration: 0.0
    deceleration: 0.0
  angular:
    max_velocity: 0.0   # rad/s
    acceleration: 0.0   # rad/s²
    deceleration: 0.0   # rad/s²
```

Each sub-block maps to `AxisConstraints`:

| Key | Type | Description |
|-----|------|-------------|
| `max_velocity` | `float` | Physical speed ceiling for the axis. The motion profiler will not request more than this. |
| `acceleration` | `float` | Maximum acceleration rate used to ramp up from rest. |
| `deceleration` | `float` | Maximum deceleration rate used to ramp down to the target. |

When all three values in a block are `0.0` the profiler for that axis is disabled and the PID controller drives directly without trapezoidal profiling.

---

### `physical`

Geometric description of the robot body. Used to compute sensor positions relative to the robot center and to populate `_wheel_positions` in the generated `Robot` class for collision and pose reasoning.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `width_cm` | `float` | `15.0` | Robot body width in centimetres (left-to-right). |
| `length_cm` | `float` | `15.0` | Robot body length in centimetres (front-to-back). |
| `rotation_center.x_cm` | `float` | `width_cm / 2` | X position of the point the robot rotates around, measured from the left edge in centimetres. |
| `rotation_center.y_cm` | `float` | `length_cm / 2` | Y position of the rotation centre, measured from the rear edge in centimetres. |
| `start_pose.x_cm` | `float` | `30.0` | Starting X position on the game field in centimetres. Used for absolute pose tracking when a field map is available. |
| `start_pose.y_cm` | `float` | `20.0` | Starting Y position on the game field in centimetres. |
| `start_pose.theta_deg` | `float` | `90.0` | Starting heading in degrees. `0` = facing right (+X), `90` = facing up (+Y). |
| `sensors` | `list` | `[]` | List of sensor placement descriptors. Each entry has `name`, `x_cm`, `y_cm`, and optionally `clearance_cm`. The `name` must match a key in `definitions`. |

**Sensor entry sub-keys:**

| Key | Type | Description |
|-----|------|-------------|
| `name` | `string` | Must match a sensor key in `definitions`. |
| `x_cm` | `float` | Sensor X position from the robot's left edge in centimetres. |
| `y_cm` | `float` | Sensor Y position from the robot's rear edge in centimetres. |
| `clearance_cm` | `float` | Vertical distance the sensor sits above the floor (default `0`). Used for line-detection geometry compensation. |

---

## `config/hardware.yml`

Defines all hardware objects. Every key (other than `_motors` and `_servos`) maps to one attribute on the generated `Defs` class. Keys must be valid Python identifiers.

`hardware.yml` also contains the lines:

```yaml
_motors: !include-merge 'motors.yml'
_servos: !include-merge 'servos.yml'
```

These merge all motor and servo definitions from the separate files directly into the `definitions` namespace.

### Required entry: `button`

Every project must define a hardware entry named `button` of type `DigitalSensor`. The calibration and wait-for-light steps use `button` as the confirmation input. The code generator will reject a project that lacks this entry.

```yaml
button:
  type: DigitalSensor
  port: 10
```

### Built-in entry: `imu`

An `IMU` entry named `imu` is always generated, even if not listed in `hardware.yml`. If an `imu` key is present, any extra parameters in it are forwarded to the `Imu()` constructor. If absent, `imu = Imu()` is emitted with no arguments.

```yaml
imu:
  type: IMU
```

### Hardware type: `DigitalSensor`

Maps to `libstp.hal.DigitalSensor`.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `type` | `string` | — | Must be `DigitalSensor`. |
| `port` | `integer` | — | **Required.** Hardware port number. |

### Hardware type: `AnalogSensor`

Maps to `libstp.hal.AnalogSensor`.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `type` | `string` | — | Must be `AnalogSensor`. |
| `port` | `integer` | — | **Required.** Hardware port number. |

All `AnalogSensor` instances are also collected into the `Defs.analog_sensors` list, which is used by the analog-channel calibration steps.

### Hardware type: `IRSensor`

Maps to `libstp.sensor_ir.IRSensor` (subclass of `AnalogSensor`).

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `type` | `string` | — | Must be `IRSensor`. |
| `port` | `integer` | — | **Required.** Hardware port number (analog channel). |
| `calibrationFactor` | `float` | `1.0` | Raw ADC scale factor applied before probability computation. **Set automatically by `raccoon calibrate sensors`.** |

### Hardware type: `SensorGroup`

Maps to `libstp.step.motion.sensor_group.SensorGroup`. Binds a pair of IR sensors together with shared defaults for threshold, speed, and line-follow PID. At least one of `left` or `right` is required.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `type` | `string` | — | Must be `SensorGroup`. |
| `left` | `string` | — | Name of the left sensor in `definitions`. Referenced as a bare attribute (`defs.name`), not a string. |
| `right` | `string` | — | Name of the right sensor in `definitions`. |
| `threshold` | `float` | `0.7` | Default confidence threshold (0.0–1.0) for black/white classification. |
| `speed` | `float` | `1.0` | Default motion speed fraction (0.0–1.0) for sensor-triggered moves. |
| `follow_speed` | `float` | `0.8` | Default speed used by line-following steps. |
| `follow_kp` | `float` | `0.5` | Proportional gain for the line-follow PID controller. |
| `follow_ki` | `float` | `0.02` | Integral gain for the line-follow PID. |
| `follow_kd` | `float` | `0.0` | Derivative gain for the line-follow PID. |

Example:

```yaml
front:
  type: SensorGroup
  left: front_left_ir_sensor
  right: front_right_ir_sensor
  threshold: 0.6
  follow_kp: 0.6
```

---

## `config/motors.yml`

Defines drive and auxiliary motor objects. All entries are merged into the `definitions` namespace by `hardware.yml`. Each key must be a valid Python identifier and must match the name referenced in `drive.kinematics`.

### Motor entry

Maps to `libstp.hal.Motor`.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `type` | `string` | — | Must be `Motor`. |
| `port` | `integer` | — | **Required.** Hardware port number (0–3 on the Wombat). |
| `inverted` | `bool` | `false` | When `true`, all velocity and position commands are negated before sending to hardware. Use this to correct for motors mounted in reverse. |
| `calibration` | `mapping` | See below | Motor calibration data. Sub-keys are described below. |

#### `calibration` sub-keys

| Key | Type | Default (C++) | Description | Set by calibration |
|-----|------|---------------|-------------|-------------------|
| `ticks_to_rad` | `float` | `2π / 1440 ≈ 0.00436` | Encoder ticks per radian of shaft rotation. Converts raw position counter increments to radians. The scaffold default `0.00002` is a placeholder; the correct value depends on the encoder resolution and gear ratio. | `raccoon calibrate rpm` |
| `vel_lpf_alpha` | `float` | `0.5` | Low-pass filter coefficient for the velocity estimate derived from BEMF ticks. `1.0` = no filtering (raw BEMF); `0.0` = completely frozen. Lower values smooth at the cost of lag. | `raccoon calibrate motors` |
| `ff.kS` | `float` | `0.0` | Feedforward static friction constant. Added to every non-zero velocity command to overcome stiction. | `raccoon calibrate motors` |
| `ff.kV` | `float` | `0.0` | Feedforward velocity constant. Scales the target velocity to compute an open-loop motor command. | `raccoon calibrate motors` |
| `ff.kA` | `float` | `0.0` | Feedforward acceleration constant. | `raccoon calibrate motors` |
| `pid.kp` | `float` | `0.0` | Proportional gain for the per-motor velocity PID loop. | `raccoon calibrate motors` |
| `pid.ki` | `float` | `0.0` | Integral gain for the per-motor velocity PID. | `raccoon calibrate motors` |
| `pid.kd` | `float` | `0.0` | Derivative gain for the per-motor velocity PID. | `raccoon calibrate motors` |
| `bemf_scale` | `float` | — | Linear scale applied to raw BEMF ticks before converting to rad/s. | `raccoon calibrate rpm` |
| `bemf_offset` | `float` | — | Constant offset added after `bemf_scale` to zero out BEMF noise at rest. | `raccoon calibrate rpm` |
| `ticks_per_revolution` | `float` | — | Encoder ticks per full shaft revolution, computed from RPM data. Informational; not read at runtime. | `raccoon calibrate rpm` |

The `ff` and `pid` sub-keys within `calibration` are nested mappings. The code generator uses docstring introspection to detect that `MotorCalibration` accepts `ff` and `pid` as nested `Feedforward` and `PidGains` objects respectively, so the YAML nesting is preserved correctly.

Minimal scaffold entry:

```yaml
left_motor:
  type: Motor
  port: 0
  inverted: false
  calibration:
    ticks_to_rad: 0.00002
    vel_lpf_alpha: 1.0
```

After motor calibration:

```yaml
left_motor:
  type: Motor
  port: 0
  inverted: false
  calibration:
    ticks_to_rad: 0.00436
    vel_lpf_alpha: 0.8
    bemf_scale: 0.000312
    bemf_offset: -0.0041
    ticks_per_revolution: 1440.0
    ff:
      kS: 0.042
      kV: 0.981
      kA: 0.003
    pid:
      kp: 0.12
      ki: 0.0
      kd: 0.0
```

---

## `config/servos.yml`

Defines servo hardware objects with optional named positions. All entries are merged into the `definitions` namespace by `hardware.yml`.

### Servo entry

Maps to `libstp.hal.Servo` wrapped in `libstp.step.servo.preset.ServoPreset` when `positions` is specified.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `type` | `string` | — | Must be `Servo`. |
| `port` | `integer` | — | **Required.** Servo port number (0–5 on the Wombat). |
| `positions` | `mapping` | — | Optional. A mapping from position name to servo angle in degrees. When present, the entry is wrapped in a `ServoPreset` and each key becomes a callable attribute on `Defs` (e.g., `Defs.arm_servo.up()`). |
| `offset` | `float` | `0` | Angle offset in degrees added to every position value. Useful when a servo is remounted slightly off from its original alignment without needing to update each position individually. Only effective when `positions` is also specified. |

The `port` is the only argument passed to the underlying `Servo` constructor. The `positions` and `offset` keys are consumed by `ServoPreset` at the wrapper level and are not forwarded to the hardware object.

Example:

```yaml
arm_servo:
  type: Servo
  port: 0
  offset: 0
  positions:
    up: 30
    down: 160

claw_servo:
  type: Servo
  port: 1
  positions:
    open: 30
    closed: 135
```

Generated code (simplified):

```python
class Defs:
    arm_servo = ServoPreset(Servo(0), positions={'up': 30, 'down': 160}, offset=0)
    claw_servo = ServoPreset(Servo(1), positions={'open': 30, 'closed': 135})
```

Usage in a mission:

```python
seq([
    Defs.arm_servo.up(),
    Defs.claw_servo.open(),
    Defs.claw_servo.closed(speed=120),   # eased motion at 120 deg/s
])
```

---

## `config/missions.yml`

An ordered YAML list of missions to run. The code generator uses this to produce the `missions`, `setup_mission`, and `shutdown_mission` attributes on the `Robot` class.

### Entry formats

**Normal mission** (runs in sequence with others):

```yaml
- MyMission
```

**Typed mission** (dict with a single key):

```yaml
- SetupMission: setup
- AnotherMission: normal
- TeardownMission: shutdown
```

The value is one of three strings:

| Type | Description |
|------|-------------|
| `normal` | Added to `Robot.missions` list. Presented to the user for selection at runtime. |
| `setup` | Assigned to `Robot.setup_mission`. Runs automatically before any normal mission is selected. Only one setup mission is allowed; if multiple are listed, the last one wins. |
| `shutdown` | Assigned to `Robot.shutdown_mission`. Runs automatically after the program ends (timeout or explicit shutdown). |

If a bare string entry (without a type key) is used, it is treated as `normal`.

Each mission class name is converted to snake_case to derive the source filename. `DriveToBoxMission` → `src/missions/drive_to_box_mission.py`.

The scaffold generates:

```yaml
- SetupMission: setup
```

---

## `config/connection.yml`

Controls how `raccoon` connects to the robot over the network and copies files via SSH/SFTP.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `pi_address` | `string` | `192.168.4.1` | IP address or hostname of the Wombat controller. When connected to the Wombat's Wi-Fi hotspot, the default `192.168.4.1` is correct. |
| `pi_port` | `integer` | `8421` | TCP port on which the raccoon daemon (`raccoon server`) is listening on the Pi. |
| `pi_user` | `string` | `pi` | SSH username used for SFTP file transfers. |
| `remote_path` | `string` | *(empty)* | Absolute path on the Pi where the project is deployed. When empty, raccoon uses a default path derived from the project UUID. |
| `auto_connect` | `bool` | `true` | When `true`, raccoon CLI commands that require a connection (`run`, `sync`, `calibrate`, etc.) will attempt to connect automatically without prompting. Set to `false` to always require an explicit `raccoon connect`. |

---

## Calibration-populated keys summary

Several keys are written back to config files automatically by raccoon calibration commands. These should not be edited by hand unless you know the exact values.

| Config path | Calibration command | What it measures |
|-------------|---------------------|------------------|
| `definitions.<motor>.calibration.ticks_to_rad` | `raccoon calibrate rpm` | Encoder ticks per radian (requires physical rotation measurement jig) |
| `definitions.<motor>.calibration.bemf_scale` | `raccoon calibrate rpm` | Linear BEMF scaling factor |
| `definitions.<motor>.calibration.bemf_offset` | `raccoon calibrate rpm` | BEMF zero-offset correction |
| `definitions.<motor>.calibration.ticks_per_revolution` | `raccoon calibrate rpm` | Informational ticks-per-revolution value |
| `definitions.<motor>.calibration.vel_lpf_alpha` | `raccoon calibrate motors` | LPF coefficient for velocity estimate |
| `definitions.<motor>.calibration.ff.kS` | `raccoon calibrate motors` | Motor static friction (stiction) feedforward |
| `definitions.<motor>.calibration.ff.kV` | `raccoon calibrate motors` | Motor velocity feedforward constant |
| `definitions.<motor>.calibration.ff.kA` | `raccoon calibrate motors` | Motor acceleration feedforward constant |
| `definitions.<motor>.calibration.pid.kp` | `raccoon calibrate motors` | Per-motor velocity PID proportional gain |
| `definitions.<motor>.calibration.pid.ki` | `raccoon calibrate motors` | Per-motor velocity PID integral gain |
| `definitions.<motor>.calibration.pid.kd` | `raccoon calibrate motors` | Per-motor velocity PID derivative gain |
| `robot.motion_pid.linear.max_velocity` | `raccoon calibrate characterize_drive` | Measured maximum forward speed (m/s) |
| `robot.motion_pid.linear.acceleration` | `raccoon calibrate characterize_drive` | Measured linear acceleration (m/s²) |
| `robot.motion_pid.linear.deceleration` | `raccoon calibrate characterize_drive` | Measured linear deceleration (m/s²) |
| `robot.motion_pid.lateral.max_velocity` | `raccoon calibrate characterize_drive` | Measured maximum strafe speed (m/s) — mecanum only |
| `robot.motion_pid.lateral.acceleration` | `raccoon calibrate characterize_drive` | Measured lateral acceleration (m/s²) — mecanum only |
| `robot.motion_pid.lateral.deceleration` | `raccoon calibrate characterize_drive` | Measured lateral deceleration (m/s²) — mecanum only |
| `robot.motion_pid.angular.max_velocity` | `raccoon calibrate characterize_drive` | Measured maximum turn speed (rad/s) |
| `robot.motion_pid.angular.acceleration` | `raccoon calibrate characterize_drive` | Measured angular acceleration (rad/s²) |
| `robot.motion_pid.angular.deceleration` | `raccoon calibrate characterize_drive` | Measured angular deceleration (rad/s²) |
| `definitions.<ir_sensor>.calibrationFactor` | `raccoon calibrate sensors` | IR sensor K-means calibration factor |
