---
title: "Sensors"
author: "Tobias Madlberger"
date: 2026-03-21
draft: false
weight: 7
---

# Sensors

`raccoon` supports four sensor types: **IR line sensors**, **digital sensors**, **analog sensors**, and a **camera** interface. All sensors are declared in `defs.py` and accessed throughout your mission code.

## IR Sensors (Line Detection)

IR sensors are the primary tool for line following and line detection. They measure surface reflectivity — black surfaces absorb light (high value), white surfaces reflect it (low value).

### Shielding from Ambient Light

An IR line sensor works by shining its own infrared LED at the table and measuring the bounce-back. The problem is that it can't tell *its* light apart from anyone else's. Overhead fluorescent tubes, halogen stage lamps, a sunbeam through a window, the IR emitters on a neighbouring robot — all of it leaks into the reading. A sensor that was rock-solid on your workshop bench can suddenly see "black" everywhere because the competition venue's ceiling lights are flooding it, or swing between readings every time someone walks past.

The fix is cheap and mechanical: put a physical shroud around each sensor so its field of view is limited to the patch of table directly underneath it. A small collar cut from black paper, black foam board, or even a few layers of electrical tape is usually enough. What matters is:

- **It extends past the front face of the sensor.** A few millimeters of overhang blocks light coming in at an angle, which is where most of the stray IR enters.
- **It sits close to the table.** Leave about 2–3 mm of clearance so the shroud doesn't scrape the surface, but no more than that — the bigger the gap, the more ambient light slips in from the side.
- **It's actually opaque to IR.** Matte black paper and foam board are fine. Some glossy black plastics look opaque to your eye but still pass infrared; if in doubt, double it up, or hold it up to a TV remote and see whether the remote still works through it.

Shield the sensors **before** you run `calibrate()`. The K-Means thresholds are only meaningful under the lighting conditions in which the samples were taken — if you calibrate an unshielded sensor in your workshop and then add a shroud at the venue (or vice versa), every threshold on the robot will be wrong and line following will fall apart.

> **Quick check:** After fitting the shrouds, watch a raw IR reading in BotUI while waving a flashlight around the robot — not shining it down through the shroud, but sweeping it past the sides and in front. A well-shielded sensor barely moves. An unshielded one jumps by hundreds or thousands of units, and that is exactly the noise you're going to be fighting at competition.

### Declaration

```python
from raccoon import IRSensor, SensorGroup

front_right_ir = IRSensor(port=0)
front_left_ir = IRSensor(port=1)

# Group sensors for convenience methods
front = SensorGroup(left=front_left_ir, right=front_right_ir)
rear = SensorGroup(right=rear_right_ir)   # Single sensor groups work too
```

### Calibration

IR sensors need calibration to distinguish black from white on your specific game table. During calibration, the robot drives across the surface while sampling sensors at 100 Hz. A K-Means clustering algorithm (k=2) automatically separates the readings into white and black clusters, producing per-sensor thresholds that are persisted across runs.

Run calibration as part of your setup mission:

```python
calibrate(distance_cm=50)    # Calibrates both distance and IR sensors
```

For a detailed explanation of how the calibration algorithm works, see [Calibration]({{< ref "10-calibration" >}}).

### Using IR Sensors in Steps

The most common way to use IR sensors is through **stop conditions** and **SensorGroup shortcuts**:

```python
# Stop conditions
drive_forward(speed=0.8).until(on_black(Defs.front.right))
drive_forward(speed=0.8).until(on_white(Defs.front.right))
drive_forward(speed=0.8).until(on_black(Defs.front.right, threshold=0.9))

# SensorGroup shortcuts (the easiest way)
Defs.front.drive_until_black()              # Drive forward → black
Defs.front.drive_over_line()                # Drive forward over a line
Defs.front.strafe_left_until_black()        # Strafe until black
Defs.front.strafe_right_until_black()       # Strafe until black
Defs.front.follow_right_edge(cm=50)         # Follow right edge of line
Defs.front.lineup_on_black()                # Square up on a line

# Using a specific sensor from the group
Defs.front.strafe_left_until_black(sensor=Defs.front.right)
```

### Line Following

Line following uses a PID controller to keep a sensor on the edge between black and white. For a detailed explanation of the algorithm, variants, and parameters, see [Line Following]({{< ref "algorithms/line-following" >}}).

### Lineup (Line Alignment)

Lineup aligns the robot square on a line using a geometric single-pass approach — no iterative correction loops, so it completes with almost no time lost. For a detailed explanation, see [Lineup]({{< ref "algorithms/lineup" >}}).

## Digital Sensors

Digital sensors return `True` (pressed) or `False` (released). Used for buttons, limit switches, and bump sensors.

### Declaration

```python
from raccoon import DigitalSensor

button = DigitalSensor(port=10)           # Wombat's built-in button
arm_down_limit = DigitalSensor(port=0)    # Limit switch
arm_up_limit = DigitalSensor(port=1)      # Limit switch
```

### Usage in Steps

```python
# Wait until pressed
wait_for_digital(Defs.arm_down_limit, pressed=True)

# Use as stop condition
drive_forward(speed=0.5).until(
    on_digital(Defs.arm_down_limit)
)

# Wait for the Wombat button
wait_for_button()
```

### Example: Motor with Limit Switch

Drive a motor until it hits a limit switch:

```python
def lower_arm():
    return seq([
        set_motor_velocity(Defs.arm_motor, -100),
        wait_for_digital(Defs.arm_down_limit),
        motor_passive_brake(Defs.arm_motor),
    ])
```

## Analog Sensors

Raw analog readings from the Wombat's analog ports. Values depend on the sensor type and wiring.

### Declaration

```python
from raccoon import AnalogSensor

light_sensor = AnalogSensor(port=2)
distance_sensor = AnalogSensor(port=3)
```

### Usage in Steps

```python
# Stop conditions
drive_forward(speed=0.5).until(on_analog_above(Defs.distance_sensor, 2000))
drive_forward(speed=0.5).until(on_analog_below(Defs.distance_sensor, 500))

# Read in custom code
run(lambda robot: print(f"Light: {robot.defs.light_sensor.read()}"))
```

## Camera Sensor

The camera interface provides access to the Raccoon camera system for object detection.

### Declaration

```python
from raccoon import CamSensor

cam = CamSensor()
```

Camera functionality depends on the `raccoon-cam` and `object-detector` services running on the robot. See the Raccoon platform documentation for camera setup.

## ET Sensor (Distance)

The ET (electro-topographic) sensor is a distance/range finder. It wraps an analog input but has a distinct type for clarity:

```python
from raccoon import ETSensor

distance = ETSensor(port=3)
```

Use it like an analog sensor — read raw values with `distance.read()` or use it with `on_analog_above()` / `on_analog_below()` conditions.

## Sensor Groups in Depth

`SensorGroup` is a convenience wrapper that pre-binds common step patterns to your sensors. It accepts `left` and/or `right` IR sensors:

```python
front = SensorGroup(left=front_left_ir, right=front_right_ir)
```

### Available SensorGroup Methods

| Method | What It Does |
|--------|-------------|
| `.drive_until_black()` | Drive forward until any sensor sees black |
| `.drive_over_line()` | Drive forward through a line to the other side |
| `.lineup_on_black()` | Align both sensors on a black line |
| `.follow_right_edge(cm)` | Follow the right edge of a line |
| `.follow_right_until_black()` | Follow line until right sensor sees black |
| `.strafe_left_until_black()` | Strafe left until a sensor sees black |
| `.strafe_right_until_black()` | Strafe right until a sensor sees black |
| `.strafe_left_until_black(sensor=...)` | Use a specific sensor |

All methods return step objects that work in `seq([...])` and `parallel(...)` just like any other step.

## Stall Detection

You can detect when a motor is stalling (trying to move but physically blocked):

```python
# Drive forward until the motor stalls (e.g., hit a wall)
drive_forward(speed=0.3).until(
    stall_detected(Defs.front_left_motor, threshold_tps=10, duration=0.25)
)
```

Parameters:
- `threshold_tps`: Speed below this (ticks per second) counts as stalling
- `duration`: Must stall for this many seconds to trigger
