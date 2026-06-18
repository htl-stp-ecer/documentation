---
title: "IMU"
author: "Tobias Madlberger"
date: 2026-06-18
draft: false
weight: 19
---

# IMU

The Wombat's IMU (Inertial Measurement Unit) is the primary source of heading information for the robot. It is what lets `turn_left(90)` know that exactly 90 degrees have elapsed, and what keeps the robot driving straight rather than veering sideways.

## The Sensor Hardware

The Wombat uses an **InvenSense MPU-9250**, a nine-axis MEMS sensor package that combines three independent sensors:

| Sensor | Measures | Unit |
|--------|----------|------|
| Gyroscope | Angular velocity around each axis | degrees/s |
| Accelerometer | Linear acceleration along each axis | m/s² |
| Magnetometer (AK8963) | Magnetic field strength along each axis | µT |

The chip is connected to the **STM32 coprocessor** via SPI. The STM32 reads the sensor, runs orientation estimation firmware, and forwards the results to the Raspberry Pi over a shared SPI buffer at **50 Hz**. User programs on the Pi access these values through the `raccoon` HAL.

### Axes and Orientation

The IMU defines three axes relative to the Wombat's board:

- **X**: Points forward (toward the front of the robot)
- **Y**: Points left (toward the left side of the robot)
- **Z**: Points upward (perpendicular to the table surface)

For a robot sitting flat on a table, the gyroscope's Z axis measures yaw — the rotation the robot performs when turning in place. That is the axis the drive system uses for heading estimation.

The **sign convention** used by `raccoon` is counter-clockwise positive (CCW = positive, CW = negative). This is the standard mathematical convention. The firmware reports heading in a clockwise-positive convention, so `getHeading()` internally negates the firmware value before returning it.

## The Digital Motion Processor (DMP)

The MPU-9250 includes a **Digital Motion Processor** (DMP) — a small dedicated compute block inside the sensor chip. The DMP runs a proprietary 6-axis fusion algorithm (gyroscope + accelerometer) entirely on-chip at 200 Hz, without using the host CPU. The STM32 reads the DMP's quaternion output from a FIFO buffer at 50 Hz and forwards it to the Pi at the same **50 Hz** rate.

The DMP also handles gyroscope bias calibration at startup and on an ongoing basis (see [Calibration](#calibration) below). This calibrated gyroscope signal is what the rest of the pipeline uses.

The heading value available via `imu.get_heading()` comes from this DMP pipeline. In dynamic conditions — the kind of fast rotation that a Botball match involves — the DMP's 6-axis fusion has been shown to track heading with a Mean Absolute Error of around 12° over a 2-minute test, which is significantly better than raw gyroscope integration or software-based filters running at the 50 Hz rate available on the Pi.

## How the Drive System Uses the IMU

The IMU is the heading source for all motion primitives. It is used in two distinct ways:

### Turns

`turn_left()` and `turn_right()` use a **profiled PID controller** whose measured variable is the IMU heading. When a turn is commanded, the odometry is reset (heading back to zero), and the PID drives the motors until the IMU-integrated heading matches the target angle. The controller declares done only when the heading error is within tolerance *and* the filtered angular velocity has dropped below a settling threshold — preventing the robot from stopping prematurely while still rotating.

```python
turn_left(90)   # Rotates until IMU heading = +90°
turn_right(45)  # Rotates until IMU heading = -45°
```

### Straight Driving

`drive_forward()` and related steps use a **heading-hold PID** running in parallel with the distance PID. At the moment the drive starts, the current heading is captured. On each control cycle, the heading PID measures how far the robot has drifted from that initial heading and applies a corrective angular velocity. A well-tuned heading PID makes the robot drive in a straight line even on uneven surfaces or with slight motor imbalances.

The heading error signal is: `yaw_error = current_heading - initial_heading`. If the robot drifts right, `yaw_error` becomes negative, and the heading PID commands a left correction.

## Orientation Estimation: Why One Sensor Is Not Enough

Raw gyroscope integration is simple — integrate angular velocity over time to get angle — but gyroscopes have **bias**: a small non-zero output even when stationary. A bias of only 0.05 °/s accumulates to 3° of heading error per minute, and several centimetres of sideways offset over a match. Without correction, heading drift is unavoidable.

The accelerometer and magnetometer provide long-term stable references (gravity and magnetic north respectively) but are noisy and susceptible to vibration and motor-induced interference. Sensor fusion combines both types to get the benefits of each.

### The DMP's Approach

The DMP's 6-axis fusion combines the gyroscope and accelerometer. The accelerometer's gravity vector provides a reference for roll and pitch, and the gyroscope provides high-rate rotation tracking. In static tests, this keeps roll and pitch below 0.35°. However, in static yaw tests the DMP showed surprising behaviour: it drifted 19° over 10 minutes — about six times more than raw gyroscope integration (3° drift) over the same period.

This extra drift is most likely caused by **gravity-vector coupling**: when the DMP corrects roll and pitch using the accelerometer, small errors in its gravity estimate leak into the yaw channel. This is a known artefact of 6-axis fusion when gravity is not perfectly aligned with the sensor Z axis. Despite this static disadvantage, during fast dynamic rotation (the actual working condition for Botball) the DMP outperforms software alternatives because it runs at the full internal 200 Hz rate.

### Software Fusion Comparison

A **Mahony complementary filter** (6-axis, implemented in software) was tested using the same sensor data. It showed only 3° of yaw drift over 10 minutes — matching raw gyroscope integration and far better than the DMP in static conditions. The Mahony filter uses a PI correction term with gains k_P = 2.0 and k_I = 0.005 to correct gyroscope integration using the accelerometer reference. Because it uses the DMP's already-bias-corrected gyroscope data as input, it benefits from the DMP's signal conditioning without inheriting its fusion artefact.

Adding the magnetometer (9-axis Mahony) reduces static yaw drift to under 0.2 °/h — about 150× better than the DMP in static conditions. The filter converges to magnetic north within 1.3 seconds. However, this advantage reverses during fast rotation: the magnetometer's correction term continuously pulls the heading estimate toward magnetic north, fighting the gyroscope during rapid yaw changes, and the resulting Mean Absolute Error during a 2-minute dynamic test was 113° — the worst of all tested methods.

### Summary of Trade-offs

| Method | Static yaw drift | Dynamic MAE | Notes |
|--------|-----------------|-------------|-------|
| DMP 6-axis | 109 °/h | **12°** | Best for motion; runs on-chip at 200 Hz |
| Mahony 6-axis | 21 °/h | 32° | Good static; software filter at 50 Hz (Pi data rate) |
| Raw gyro integration | 27 °/h | 30° | Simplest; no correction |
| Mahony 9-axis (with magnetometer) | **0.19 °/h** | 113° | Best static; degrades under fast rotation |

**For Botball competition use, the DMP is the right choice.** Matches involve fast turns and the 12° dynamic MAE is far better than the alternatives. The DMP is what `raccoon` uses by default.

## Calibration

Low-cost MEMS sensors like the MPU-9250 have systematic errors that require calibration. The standard MEMS error model is:

```
y = K(x + b) + n
```

Where `y` is the raw reading, `x` is the true value, `b` is bias, `K` is a scale factor, and `n` is noise. On a tested Wombat unit, the uncalibrated Z-axis accelerometer read 19.43 m/s² instead of the expected 9.81 m/s² — a scale error of almost 2×. The magnetometer had a hard-iron offset of 14.87 µT along Z, roughly 30% of the local geomagnetic field.

### Gyroscope Bias

The DMP handles gyroscope bias automatically, both at startup and continuously during operation:

- **Initial calibration:** at startup the DMP estimates each gyro axis bias while the robot is stationary and subtracts it from subsequent readings. The robot must be still for a brief settling period (typically under a second).
- **Continuous re-calibration:** the firmware enables `DMP_FEATURE_GYRO_CAL`, which re-runs bias estimation after every 8-second window of detected no-motion. It also enables `inv_enable_in_use_auto_calibration()`, which refines bias estimates continuously during normal operation.
- **Persistence:** whenever the MPL library reports improved sensor accuracy, the firmware automatically saves the updated calibration data to flash memory. This means calibration persists across power cycles and improves over time.

The calibrated gyroscope Z-axis bias is around 0.005 °/s, which over 10 minutes gives approximately 3° of drift — the theoretical minimum for a gyroscope without a magnetic reference.

### Accelerometer Calibration

Accelerometer calibration corrects for per-axis biases and scale factors. The method requires no special equipment:

1. Place the robot with the Z axis vertical and collect static samples (~30,000 samples on a test unit).
2. Compute the per-axis bias as the mean of those samples, then subtract 9.81 m/s² from the gravity axis to get the true bias.
3. Compute the scale factor for each axis from the ratio of measured gravity magnitude to expected gravity.
4. Validate by rotating the robot freely and confirming that the corrected acceleration vectors form a sphere centred at the origin in 3D space (ellipsoid fitting on ~25,000 free-rotation samples).

The corrected accelerometer output is:

```
a_corr = K_a^-1 * (a_raw - b_a)
```

### Magnetometer Calibration

Magnetometer calibration is more involved because nearby ferromagnetic parts — motor housing, mounting hardware, battery — distort the local field. Two types of distortion are corrected:

- **Hard-iron offset** (`b_m`): A constant additive shift from permanently magnetised parts near the sensor. Shifts the measurement sphere off-centre.
- **Soft-iron distortion** (`S_m`): A multiplicative stretch and rotation caused by magnetically soft (non-permanent) materials. Deforms the sphere into an ellipsoid.

The combined error model is:

```
m_raw = S_m * m_true + b_m + n_m
```

Calibration collects magnetic field measurements during slow full 3D rotation of the robot (~12,000 samples over 8 minutes), then fits an ellipsoid to the data using least-squares. The result is a hard-iron vector and a soft-iron matrix. At runtime, correction is applied as:

```
m_corr = S_m^-1 * (m_raw - b_m)
```

Outlier rejection using MAD (Median Absolute Deviation) removes transient disturbances (e.g. from another robot nearby) before fitting.

**The magnetometer calibration must be repeated whenever the robot's mechanical configuration changes** — adding or moving motors, batteries, or metal structural parts all change the local magnetic field and invalidate the previous calibration. Motor currents also contribute to magnetic distortion during operation, which is an open question for the in-match case.

### Calibration Tools

Calibration scripts and collected data are available at:
https://github.com/ToberoCat/wombat-imu-calibration

The calibration scripts are Python-based and run offline on data collected from the Wombat.

## Accessing IMU Data Directly

Most missions do not need to read the IMU directly — the motion system handles it. But if you need raw sensor values:

```python
from raccoon.hal import IMU

imu = IMU()

# Full read: returns (accel, gyro, magneto) as tuples of (x, y, z)
accel, gyro, magneto = imu.read()
# accel:   (ax, ay, az) in m/s²
# gyro:    (wx, wy, wz) in DEGREES/second  ← raw DMP output, not rad/s
# magneto: (mx, my, mz) in µT
#
# Note: imu.read() returns gyro in degrees/second because the MPL firmware
# stores calibrated gyro data in that unit (Q16 fixed-point, 1 dps = 2^16).
# No unit conversion is applied on the way out.

# Angular velocity only — converted to rad/s
wx, wy, wz = imu.get_angular_velocity()
# Returns (x, y, z) in rad/s; internally multiplies the raw deg/s value by π/180.

# Firmware-computed heading (radians, CCW-positive)
heading_rad = imu.get_heading()

# Gravity-compensated linear acceleration (m/s²)
lax, lay, laz = imu.get_linear_acceleration()

# Configure which body axis is used as the turn (yaw) axis
# Options: "world_z" (default), "body_x", "body_y", "body_z"
# Prefix with "-" to negate the sign: "-body_z"
imu.set_yaw_rate_axis_mode("world_z")

# Query the currently active axis mode
current_mode = imu.get_yaw_rate_axis_mode()  # returns a string, e.g. "world_z"

# Angular rate around the configured turn axis (rad/s)
yaw_rate = imu.get_yaw_rate()
```

The firmware-computed heading (`get_heading()`) is the value used by the motion system. It is the DMP quaternion integrated into a scalar heading, converted from firmware's clockwise-positive convention to `raccoon`'s CCW-positive convention.

### Turn Axis Modes

By default the system tracks yaw rotation using the `"world_z"` axis setting — which is correct when the robot is flat on a table. If your robot turns while tilted (e.g. a robot that tips up on ramps), you can configure the relevant body axis instead using `imu.set_yaw_rate_axis_mode()`:

| Mode | Description |
|------|-------------|
| `"world_z"` | Default. Uses the body-Z gyro component (identical to `"body_z"` in the current implementation — world-frame rotation is not yet applied). |
| `"body_x"` | Robot's X axis (forward/back roll — for robots rotating around their length axis). |
| `"body_y"` | Robot's Y axis (left/right roll — for robots rotating around their width axis). |
| `"body_z"` | Robot's Z axis raw body-frame yaw. Currently returns the same `g[2]` value as `"world_z"`. |

**Implementation note:** In the current firmware, `"world_z"` and `"body_z"` are functionally identical. Both return the raw body-frame gyro Z component (`g[2]`) multiplied by the axis sign. No quaternion-based rotation to a true world frame is applied for `"world_z"`. The distinction exists for future use when a full quaternion correction is implemented.

**Negating the axis:** prefix any mode with `"-"` to negate the reported yaw rate sign. This inverts the direction the system considers positive rotation:

```python
imu.set_yaw_rate_axis_mode("-body_z")  # Inverts the sign of body-Z yaw rate
current = imu.get_yaw_rate_axis_mode() # Returns "body_z" (prefix is applied internally)
```

## The `after_degrees()` Stop Condition

`after_degrees(deg)` is a stop condition that fires after the robot has rotated by a given angle. It measures rotation based on the **localization module's pose heading** — specifically `robot.localization.get_pose().heading`.

```python
# Turn right until 60 degrees have elapsed, with safety timeout
turn_right(speed=0.5).until(after_degrees(60) | after_seconds(3))

# Combined: drive forward, stop when the robot has drifted 15 degrees
drive_forward(speed=0.3).until(after_degrees(15) | after_cm(50))
```

**Important requirements:**
- `robot.localization` must not be `None`. If localization is not wired up, calling `after_degrees()` raises `RuntimeError: after_degrees requires robot.localization (world heading is read from localization.get_pose().heading)`.
- Because it reads from the localization pose (not a raw IMU register), heading resets performed by localization will affect its reference point.

**Implementation detail:** `after_degrees()` records the localization heading at start, then on each check computes the unsigned angular difference accounting for wrapping at ±180°:

```python
delta = abs(current - start_heading)
if delta > π:
    delta = 2π - delta
```

This means it measures total unsigned rotation, regardless of direction. It works for both left and right turns. Unlike an angle-based `turn_left(deg)`, which uses a full PID controller to reach a precise target, `after_degrees()` is a simpler "how far have we rotated" check. Use `turn_left(deg)` when you need precision; use `after_degrees(deg)` inside a `.until()` when you need a rotation threshold as part of more complex logic.

## `imu.calibrate()`

The Python binding exposes `imu.calibrate()` with the docstring "Calibrate the IMU sensor." In the current implementation, **this method is a no-op** — its entire body is commented out in `MPU9250.cpp`. Calling it does nothing and returns immediately.

Calibration in RaccoonOS is handled automatically by the DMP and the MPL library at the firmware level (see [Gyroscope Bias](#gyroscope-bias) above). There is no action needed or available from Python-level code.

## Velocity Estimation

The STM32 firmware continuously integrates gravity-compensated linear acceleration into a velocity estimate. This running velocity integral is accessible from Python via two methods:

```python
from raccoon.hal import IMU

imu = IMU()

# Read the firmware-integrated velocity (m/s)
vx, vy, vz = imu.get_integrated_velocity()
# Returns (vx, vy, vz) in m/s.
# This is the cumulative integral of gravity-compensated linear acceleration.
# Useful for dead-reckoning short distances when encoder data is unavailable.

# Reset the accumulator to zero
imu.reset_integrated_velocity()
# Sets the firmware-side velocity accumulator to (0, 0, 0).
# Call this before any segment where you want to measure displacement from scratch.
```

**Practical notes:**
- The integrated velocity drifts over time because it integrates accelerometer noise as well as true motion. It is most useful over short time windows (a few seconds).
- The firmware applies a drift-suppression epsilon (`kEpsAccelVel = 0.05 m/s`) — changes below this threshold are not propagated, which helps prevent runaway drift at rest.
- Call `reset_integrated_velocity()` before each measurement window so drift from prior motion does not accumulate into the new reading.

## Practical Notes

### Let the IMU Settle

The DMP needs a moment at startup to estimate gyroscope bias. The system calls `waitForReady()` at odometry initialization and waits up to 1 second for the IMU to produce valid data. Do not command motion immediately at the start of a program without letting this settle. The standard `wait_for_light()` gate serves this purpose implicitly — by the time the light fires, the IMU has been running long enough.

### Mounting Matters

The MPU-9250 is soldered to the Wombat PCB, so its orientation is fixed relative to the board. For heading estimation to be correct, the Wombat must be mounted flat — the Z axis must be pointing up. If the Wombat is mounted sideways or at an angle, the world-Z heading computation will be wrong. Use the `turn_axis` configuration to specify the correct body axis if your mounting is non-standard.

### Motors Disturb the Magnetometer

Motor currents and the ferromagnetic parts inside motors create a time-varying magnetic field near the sensor. During operation, this distorts the magnetometer reading. This is one reason the 9-axis Mahony filter (which uses the magnetometer) performs worse during dynamic testing than the 6-axis DMP: the magnetometer reference is contaminated when motors are running. The DMP's 6-axis approach — gyroscope and accelerometer only — is immune to this problem and is the correct choice for in-match navigation.

### Temperature and Warm-Up

MEMS gyroscopes exhibit temperature-dependent bias. The DMP's startup calibration measures bias at the current temperature. If the robot was stored in a cold environment and then placed on a warm table, the bias will shift during warm-up and the heading will drift slightly. For competition use, power on the robot several minutes before the match start to let the sensor reach thermal equilibrium.

### Noise and Vibration

The accelerometer is sensitive to vibration from motors and the surface. At high drive speeds, motor vibration appears as high-frequency noise in the accelerometer readings. This does not affect the DMP's heading output much (the gyroscope dominates during motion), but it will show up in `get_linear_acceleration()` readings. If you are reading accelerometer data directly for vibration detection or distance estimation, expect significant noise during motor operation.

### When to Recalibrate

- **Gyroscope bias**: Handled automatically by the DMP at every power-on and continuously during no-motion windows. Improved calibration data is automatically saved to flash and restored on the next boot. No manual action needed.
- **Accelerometer**: Recalibrate if you add significant weight to the Wombat, move the board to a different mounting angle, or observe that the gravity reading is noticeably wrong. In practice, the accelerometer calibration is stable across power cycles.
- **Magnetometer**: Recalibrate whenever the robot's mechanical configuration changes — different motors, different battery placement, added metal parts. This includes between competition seasons. Do not skip magnetometer calibration if you plan to use 9-axis heading estimation.
