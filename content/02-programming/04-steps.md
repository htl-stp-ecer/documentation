---
title: "Steps DSL"
date: 2026-03-21
draft: false
weight: 5
---

# Steps DSL

Steps are the building blocks of every mission. Each step is a single action: drive forward, turn, move a servo, wait for a sensor. You combine steps into sequences and parallel blocks to build complex behaviors.

All steps are accessed as **factory functions** — `drive_forward()`, not `DriveForward()`. They return builder objects that you can chain with `.until()`, `.speed()`, etc.

## Motion Steps

These control the robot's drivetrain. They plan velocity profiles (accelerate → cruise → decelerate) and execute at 100 Hz.

### Driving

```python
# Drive a fixed distance
drive_forward(25)          # 25 cm forward
drive_backward(10)         # 10 cm backward
strafe_left(15)            # 15 cm left (mecanum only)
strafe_right(20)           # 20 cm right (mecanum only)

# Drive with speed control
drive_forward(50, speed=0.5)   # Half speed

# Drive until a condition (no fixed distance)
drive_forward(speed=0.8).until(on_black(Defs.front.right))
drive_backward(speed=1.0).until(after_seconds(2))
```

**Parameters:**
- `cm` (optional): Distance to travel. If omitted, you must provide `.until()`.
- `speed` (default `1.0`): Speed multiplier (0.0–1.0) applied to `max_velocity` from your robot's `AxisConstraints`.

### Turning

```python
turn_left(90)              # Turn 90 degrees counter-clockwise
turn_right(45)             # Turn 45 degrees clockwise
turn_left(180, speed=0.5)  # Slow 180-degree turn

# Turn to an absolute heading (relative to heading reference)
turn_to_heading(0)         # Face the reference heading
turn_to_heading(-90)       # Face 90 degrees clockwise from reference
```

Turns use the IMU for heading control, not dead reckoning. They're accurate to about 1-2 degrees.

### Arc Movements

Drive in a curve:

```python
drive_arc(radius_cm=30, degrees=90)          # Generic arc
drive_arc_left(radius_cm=30, degrees=90)     # Arc curving left
drive_arc_right(radius_cm=30, degrees=90)    # Arc curving right
```

### Wall Alignment

Drive into a wall to square up the robot:

```python
wall_align_forward()                           # Drive forward into wall
wall_align_backward()                          # Drive backward into wall
wall_align_backward(accel_threshold=0.3)       # Custom sensitivity
wall_align_backward(speed=1.0, accel_threshold=0.5,
                    settle_duration=0.2, max_duration=5.0,
                    grace_period=0.3)                    # Full parameters
```

Wall alignment drives until the IMU detects a sudden deceleration (hitting the wall), then holds briefly to square up. The `accel_threshold` controls how hard the hit needs to be before it stops.

### Line Operations

#### Drive Until Line

```python
# Using SensorGroup shortcuts
Defs.front.drive_until_black()        # Forward until any front sensor sees black
Defs.front.drive_over_line()          # Forward through a black line to the other side
Defs.rear.strafe_right_until_black()  # Strafe right until rear sensor sees black
```

#### Line Following

Follow the edge of a black line:

```python
# Follow right edge of line for 50 cm
Defs.front.follow_right_edge(50)

# Follow with stop condition
Defs.front.follow_right_edge(999).until(
    after_cm(100) & on_black(Defs.front.right)
)

# Raw line follow functions (more control)
follow_line(left_sensor, right_sensor, cm=50, speed=1.0)
follow_line_single(sensor, cm=50, side=LineSide.RIGHT, speed=1.0)
strafe_follow_line_single(sensor, distance_cm=50, side=LineSide.LEFT)
```

#### Lineup (Line Alignment)

Align the robot precisely on a line using one or two sensors:

```python
# Dual-sensor lineup
Defs.front.lineup_on_black()          # Align both front sensors on black

# Directional lineups
forward_lineup_on_black(left_sensor, right_sensor)
backward_lineup_on_black(left_sensor, right_sensor)
strafe_left_lineup_on_black(left_sensor, right_sensor)

# Single-sensor lineup
forward_single_lineup(
    Defs.front.right,
    entry_threshold=0.9,       # Sensor value to start alignment
    exit_threshold=0.7,        # Sensor value to consider "on line"
    correction_side=CorrectionSide.RIGHT,
    forward_speed=0.5,
)
```

## Motor Steps

Direct motor control — bypass the drive system entirely:

```python
# Open-loop power control (-100 to 100 percent)
set_motor_power(Defs.cone_motor, 80)
set_motor_power(Defs.cone_motor, -50)   # Reverse

# Closed-loop velocity control
set_motor_velocity(Defs.cone_motor, 1000)   # BEMF units
set_motor_dps(Defs.cone_motor, 360.0)       # Degrees per second

# Position control
move_motor_to(Defs.cone_motor, position=500, velocity=1000)
move_motor_relative(Defs.cone_motor, delta=200, velocity=1000)
move_motor_to(Defs.cone_motor, 500, timeout=3.0)  # With timeout

# Stopping
motor_off(Defs.cone_motor)              # Coast (free-spin)
motor_passive_brake(Defs.cone_motor)    # Electrical braking
motor_brake(Defs.cone_motor)            # Active hold position
```

**When to use motor steps vs. drive steps**: Use `drive_forward()` and `turn_right()` for moving the robot. Use motor steps for non-drive motors (arms, conveyor belts, intake mechanisms).

## Servo Steps

```python
# Move to angle (blocks until servo arrives)
servo(Defs.claw_servo, 90)

# ServoPreset shortcuts (defined in defs.py)
Defs.claw.open()
Defs.claw.closed()
Defs.arm.up()
Defs.arm.down()
Defs.arm.above_pom(300)       # Move at 300 deg/s (slow servo step)

# Oscillate between two angles
shake_servo(Defs.claw_servo, duration=2.0, angle_a=30, angle_b=135)

# Slow controlled movement (speed in degrees per second)
slow_servo(Defs.claw_servo, angle=90, speed=60.0)

# Disable all servos
fully_disable_servos()
```

## Wait Steps

```python
# Wait for time
wait_for_seconds(1.5)

# Wait for button press (physical button on the Wombat)
wait_for_button()

# Wait for digital sensor
wait_for_digital(Defs.arm_down_limit, pressed=True)

# Wait for light (competition start signal)
wait_for_light(Defs.light_sensor)
wait_for_light(Defs.light_sensor, drop_fraction=0.15,
               confirm_count=3, warmup_seconds=1.0)

# Wait for distance traveled (inside parallel blocks)
wait_until_distance(35)       # Wait until robot has traveled 35 cm
```

`wait_for_light()` uses a Kalman filter to detect when a light source is turned on. It's designed for the Botball competition start light.

## Logic Steps

```python
# Execute Python code as a step
run(lambda robot: print("Hello from the robot!"))

# Deferred step construction (decide at runtime)
defer(lambda robot: drive_forward(10) if robot.defs.button.read() else turn_right(90))

# Run task while something else is happening
do_while_active(
    reference_step=drive_forward(100),
    task=loop_forever(seq([
        Defs.arm.up(),
        wait_for_seconds(0.5),
        Defs.arm.down(),
        wait_for_seconds(0.5),
    ])),
)

# Loops
loop_for(drive_forward(10), iterations=5)
loop_forever(seq([drive_forward(10), turn_right(90)]))
```

## Timing Steps

```python
# Time checkpoint: run a step, but cancel it if global time exceeds N seconds
do_until_checkpoint(checkpoint=60, step=seq([
    drive_forward(100),
    Defs.arm.down(),
]))

# Wait until global time reaches N seconds
wait_for_checkpoint(checkpoint_seconds=30)
```

Checkpoints use the global mission timer (starts when the start signal fires). Use them to synchronize with other robots or guarantee you're at a certain point by a certain time.

## Timeout Wrapper

Wrap any step with a time limit:

```python
timeout(
    step=drive_forward(speed=0.5).until(on_black(Defs.front.right)),
    seconds=5.0,
)
```

If the step doesn't complete within 5 seconds, it's cancelled and the mission moves on.

## Heading Reference

Mark and use heading references for absolute turning:

```python
seq([
    mark_heading_reference(),      # Save current heading as reference
    drive_forward(50),
    turn_to_heading(0),            # Return to marked heading
    drive_forward(50),
    turn_to_heading(-90),          # Face 90° clockwise from reference
])
```

## Calibration Set Switching

If you have multiple calibration sets (e.g., for different surface heights):

```python
seq([
    switch_calibration_set("default"),     # Use ground-level calibration
    Defs.front.drive_until_black(),
    switch_calibration_set("upper"),       # Switch to elevated surface
    Defs.front.follow_right_edge(50),
])
```

## Quick Reference

| Category | Steps |
|----------|-------|
| **Drive** | `drive_forward`, `drive_backward`, `strafe_left`, `strafe_right` |
| **Turn** | `turn_left`, `turn_right`, `turn_to_heading` |
| **Arc** | `drive_arc`, `drive_arc_left`, `drive_arc_right` |
| **Wall** | `wall_align_forward`, `wall_align_backward`, `wall_align_strafe_left`, `wall_align_strafe_right` |
| **Line** | `follow_line`, `follow_line_single`, `strafe_follow_line_single`, `directional_follow_line` |
| **Lineup** | `lineup`, `forward_lineup_on_black`, `backward_lineup_on_black`, `forward_single_lineup`, etc. |
| **Motor** | `set_motor_power`, `set_motor_velocity`, `set_motor_dps`, `move_motor_to`, `move_motor_relative`, `motor_off`, `motor_brake`, `motor_passive_brake` |
| **Servo** | `servo`, `shake_servo`, `slow_servo`, `fully_disable_servos` |
| **Wait** | `wait_for_seconds`, `wait_for_button`, `wait_for_digital`, `wait_for_light`, `wait_until_distance` |
| **Logic** | `run`, `defer`, `do_while_active`, `loop_for`, `loop_forever` |
| **Timing** | `do_until_checkpoint`, `wait_for_checkpoint`, `timeout` |
| **Calibration** | `calibrate`, `calibrate_distance`, `calibrate_sensors`, `switch_calibration_set` |
| **Composition** | `seq`, `parallel` |
