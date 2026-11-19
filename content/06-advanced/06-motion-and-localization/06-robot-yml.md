---
title: "robot.yml Reference"
author: "Tobias Madlberger, Mario Scholze"
date: 2026-11-19
draft: false
weight: 60
description: "Every key of config/robot.yml: shutdown_in, drive kinematics, motion PID and physical dimensions."
---

# robot.yml Reference

`config/robot.yml` describes the drivetrain, the motion control and the physical size of the robot. It maps to the generated `Robot` class in `src/hardware/robot.py`. You set it up once for a robot. Most values in `motion_pid` and `drive.vel_config` are then filled in by calibration and [auto-tuning]({{< ref "/06-advanced/06-motion-and-localization/01-drive-system.md" >}}). The other config files are explained on [Config Structure]({{< ref "/01-programming-guide/01-basics/03-config-structure.md" >}}).

## `shutdown_in`

| Attribute | Value |
|-----------|-------|
| Type | `integer` |
| Default | `120` |
| Required | Yes |

Number of seconds after program start after which `GenericRobot` will automatically shut down the running mission sequence. Prevents the robot from running indefinitely if something goes wrong. Set to `0` to disable.

---

## `drive`

Container for the drive subsystem. All motion steps read their kinematics and velocity control from here.

### `drive.kinematics`

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

### `drive.vel_config`

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

## `motion_pid`

Unified configuration for the position/heading PID controllers used by all drive-based motion steps (`Drive`, `Turn`, `DriveAngle`, etc.). **Required.**

This entire block maps to the `UnifiedMotionPidConfig` C++ struct.

### Distance PID (`motion_pid.distance`)

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

### Heading PID (`motion_pid.heading`)

Controls convergence toward an angular target.

Same sub-keys as `distance` (`kp`, `ki`, `kd`, `integral_max`, `integral_deadband`, `derivative_lpf_alpha`, `output_min`, `output_max`).

Scaffold defaults: `kp: 3.0`, all others matching the distance block.

### Velocity feedforward

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `velocity_ff` | `float` | `1.0` | Scalar multiplied by the profiled velocity target and added directly to the PID output as open-loop feedforward. `1.0` means full feedforward. |

### Convergence tolerances

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `distance_tolerance_m` | `float` | `0.01` | Position error below which the robot is considered to have reached its linear target (metres). |
| `angle_tolerance_rad` | `float` | `0.02` | Heading error below which the robot is considered to have reached its angular target (radians). |

### Linear saturation handling

When the drive command saturates the actuators, the controller de-rates its output to prevent integral windup.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `saturation_derating_factor` | `float` | `0.85` | Multiplier applied to the output scale when saturation is detected. Values below `1.0` cause the controller to back off. |
| `saturation_min_scale` | `float` | `0.1` | Minimum scale the de-rating is allowed to reach. Prevents the controller from going completely silent. |
| `saturation_recovery_rate` | `float` | `0.02` | Per-cycle increment to the output scale during recovery from saturation. |
| `saturation_hold_cycles` | `integer` | `5` | Number of consecutive unsaturated cycles required before recovery begins. |
| `saturation_recovery_threshold` | `float` | `0.95` | Output scale at which the robot is considered to have fully recovered from saturation. |

### Heading-specific saturation handling

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `heading_saturation_derating_factor` | `float` | `0.85` | Same as `saturation_derating_factor` but applied to heading-axis saturation only. |
| `heading_min_scale` | `float` | `0.25` | Minimum heading output scale. Higher than the linear minimum because heading corrections are always needed. |
| `heading_recovery_rate` | `float` | `0.05` | Per-cycle recovery rate for heading saturation. |
| `heading_saturation_error_rad` | `float` | `0.01` | Heading error below which saturation de-rating engages for the heading axis. |
| `heading_recovery_error_rad` | `float` | `0.005` | Heading error threshold for considering heading saturation fully recovered. |

### Motion profile constraints

These three sub-blocks are **populated automatically by `raccoon calibrate step-response`** and should not be edited manually. They are commented out in the scaffold until characterization is run.

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

## `physical`

Geometric description of the robot body. Used to compute sensor positions relative to the robot center and to populate `_wheel_positions` in the generated `Robot` class for collision and pose reasoning.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `width_cm` | `float` | `15.0` | Robot body width in centimetres (left-to-right). |
| `length_cm` | `float` | `15.0` | Robot body length in centimetres (front-to-back). |
| `rotation_center.x_cm` | `float` | `width_cm / 2` | X position of the point the robot rotates around, measured from the left edge in centimetres. |
| `rotation_center.y_cm` | `float` | `length_cm / 2` | Y position of the rotation centre, measured from the rear edge in centimetres. |
| `start_pose.x_cm` | `float` | `30.0` | Starting X position on the game field in centimetres. Used for absolute pose tracking when a field map is available. |
| `start_pose.y_cm` | `float` | `20.0` | Starting Y position on the game field in centimetres. |
| `start_pose.theta_deg` | `float` | `0.0` | Starting heading in degrees. `0` = facing right (+X), `90` = facing up (+Y). The scaffold template ships with `90.0` as a preset value, but the code default when `start_pose` is absent is `0.0`. |
| `table_map` | `mapping` | — | **Optional.** Path to a `.ftmap` file used for on-robot localization. When present, the code generator emits a `table_map` class attribute on the generated `Robot` class (accessible as `Robot.table_map`), allowing steps to query field-relative coordinates. |
| `sensors` | `list` | `[]` | List of sensor placement descriptors. Each entry has `name`, `x_cm`, `y_cm`, and optionally `clearance_cm`. The `name` must match a key in `definitions`. |

**Sensor entry sub-keys:**

| Key | Type | Description |
|-----|------|-------------|
| `name` | `string` | Must match a sensor key in `definitions`. |
| `x_cm` | `float` | Sensor X position from the robot's left edge in centimetres. |
| `y_cm` | `float` | Sensor Y position from the robot's rear edge in centimetres. |
| `clearance_cm` | `float` | Vertical distance the sensor sits above the floor (default `0`). Used for line-detection geometry compensation. |

### `start_pose` — initial localization estimate

`start_pose` sets where the robot thinks it is at the start of the run. This is the initial odometry estimate, not a physical constraint — the robot does not drive to this position. It tells the localization system where on the field to begin tracking.

When `table_map` is also specified, `start_pose` initialises the field-relative pose for absolute coordinate queries. Without `table_map`, `start_pose` only affects the initial pose returned by `robot.odometry.get_pose()`.

```yaml
physical:
  width_cm: 23.5
  length_cm: 29.6
  rotation_center:
    x_cm: 11.75    # geometric center left-to-right
    y_cm: 14.8     # offset front-to-back
  start_pose:
    x_cm: 30.0     # 30 cm from left edge of field
    y_cm: 20.0     # 20 cm from bottom edge
    theta_deg: 90.0  # facing toward +Y (up the field)
  table_map:
    path: config/2026-game-table.ftmap
  sensors:
    - name: front_left_ir_sensor
      x_cm: 7.8
      y_cm: 29.6   # front edge of robot
    - name: front_right_ir_sensor
      x_cm: 15.7
      y_cm: 29.6
    - name: rear_left_ir_sensor
      x_cm: 7.8
      y_cm: 0.0    # rear edge
```

`start_pose.theta_deg` convention: `0.0` faces the +X direction (right), `90.0` faces +Y (up in the standard field coordinate system). The scaffold ships with `90.0` because most robots start facing up the field.

## Complete mecanum example

A real mecanum competition robot's `robot.yml` (adapted from the clawbot) showing `start_pose`, sensor positions, and motion PID for two surfaces:

```yaml
# config/robot.yml — mecanum four-wheel competition robot
shutdown_in: 120

drive:
  kinematics:
    type: mecanum
    wheel_radius: 0.024      # metres
    wheelbase: 0.161         # front-to-back axle distance, metres
    track_width: 0.192       # left-to-right wheel distance, metres
    front_left_motor: front_left_motor
    front_right_motor: front_right_motor
    back_left_motor: back_left_motor
    back_right_motor: back_right_motor
  vel_config:
    vx:
      pid: { kp: 0.0, ki: 0.0, kd: 0.0 }
      ff:  { kS: 0.0, kV: 1.0, kA: 0.0 }
    vy:
      pid: { kp: 0.0, ki: 0.0, kd: 0.0 }
      ff:  { kS: 0.0, kV: 1.0, kA: 0.0 }
    wz:
      pid: { kp: 0.0, ki: 0.0, kd: 0.0 }
      ff:  { kS: 0.0, kV: 1.0, kA: 0.0 }

motion_pid:
  distance:
    kp: 2.5
    kd: 0.1
  heading:
    kp: 3.0
    kd: 0.05
  velocity_ff: 1.0
  distance_tolerance_m: 0.012
  angle_tolerance_rad: 0.025
  linear:
    max_velocity: 0.55   # m/s — measured by autotune
    acceleration: 1.2
    deceleration: 1.4
  lateral:
    max_velocity: 0.40
    acceleration: 1.0
    deceleration: 1.2
  angular:
    max_velocity: 4.2    # rad/s
    acceleration: 8.0
    deceleration: 8.0

physical:
  width_cm: 23.5
  length_cm: 29.6
  rotation_center:
    x_cm: 11.75
    y_cm: 14.8
  start_pose:
    x_cm: 30.0            # initial localization estimate — where on the field
    y_cm: 20.0
    theta_deg: 90.0       # facing up the field (+Y direction)
  table_map:
    path: config/2026-game-table.ftmap
  sensors:
    - name: front_left_light_sensor
      x_cm: 7.8
      y_cm: 29.6          # front edge of robot body
    - name: front_right_light_sensor
      x_cm: 15.7
      y_cm: 29.6
    - name: rear_left_light_sensor
      x_cm: 7.8
      y_cm: 0.0           # rear edge
```
