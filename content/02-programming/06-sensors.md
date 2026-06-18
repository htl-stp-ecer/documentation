---
title: "Sensors"
author: "Tobias Madlberger"
date: 2026-06-18
draft: false
weight: 10
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

IR sensors need calibration to distinguish black from white on your specific game table. During calibration, the robot drives across the surface while sampling sensors. A K-Means clustering algorithm (k=2) automatically separates the readings into white and black clusters, producing per-sensor thresholds that are persisted across runs.

> **Sampling rate note:** The calibration loop sleeps 10 ms between samples for each sensor. With two sensors the effective rate is 50 Hz per sensor; with four sensors it drops to 25 Hz per sensor. For typical 5-second calibration runs this is still more than enough data for reliable K-Means clustering.

Run calibration as part of your setup mission:

```python
calibrate(distance_cm=30)    # Calibrates both distance and IR sensors (default 30 cm)
```

The default `distance_cm` is `30.0`. Override it if your game table requires a longer crossing, but 30 cm is adequate for most line placements.

For a detailed explanation of how the calibration algorithm works, see [Calibration]({{< ref "10-calibration" >}}).

### Probabilistic Threshold Model

Each IR sensor exposes a `probabilityOfBlack()` method (and the equivalent `probabilityOfWhite()`) that returns a float between 0.0 and 1.0. This is the confidence that the surface underneath is black, derived from how far the raw reading falls from the calibrated white and black cluster centres.

Stop conditions use this probability:

```python
# Default threshold=0.7: fire when confidence of black >= 70%
drive_forward(speed=0.8).until(on_black(Defs.front.right))

# Stricter: only fire at 90% confidence (sensor almost fully over a black area)
drive_forward(speed=0.8).until(on_black(Defs.front.right, threshold=0.9))

# Looser: fire as soon as there's any hint of black (edge detection)
drive_forward(speed=0.8).until(on_black(Defs.front.right, threshold=0.5))
```

A higher threshold requires the sensor to be more fully over black before triggering — useful for avoiding false positives from gradual colour transitions at line edges. A lower threshold triggers earlier, which is useful for detecting the very beginning of a line.

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

### Drive to Analog Target

`drive_to_analog_target()` drives the robot until an analog sensor reaches its calibrated reference value, then stops. This is the idiomatic way to use an ET or distance sensor to stop at a repeatable distance.

**Step 1: Calibrate the sensor position during setup**

```python
from raccoon.step.calibration import calibrate_analog_sensor

# During setup: operator positions the robot at the target location,
# then the step samples the sensor and stores the reference value.
calibrate_analog_sensor(Defs.et_sensor)                    # stores as "default"
calibrate_analog_sensor(Defs.et_sensor, set_name="near")   # named position
calibrate_analog_sensor(Defs.et_sensor, set_name="far")    # another named position
```

Parameters for `calibrate_analog_sensor()`:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `sensor` | `AnalogSensor` | required | The sensor to calibrate |
| `set_name` | `str` | `"default"` | Label for this calibration point |
| `sample_duration` | `float` | `3.0` | Seconds to sample for (longer = more stable) |

**Step 2: Use the calibrated value in the mission**

```python
from raccoon.step.motion import drive_to_analog_target

# Drive toward the calibrated target (direction chosen automatically)
drive_to_analog_target(Defs.et_sensor)

# Slow approach to a named position with 30 cm safety backstop
drive_to_analog_target(Defs.et_sensor, speed=0.2, set_name="near", timeout_cm=30)
```

Parameters for `drive_to_analog_target()`:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `sensor` | `AnalogSensor` | required | The sensor to monitor |
| `speed` | `float` | `0.3` | Drive speed 0.0–1.0 |
| `set_name` | `str` | `"default"` | Which calibration point to target |
| `timeout_cm` | `float \| None` | `None` | Max distance before giving up |

The direction (forward or backward) is chosen automatically at runtime by comparing the current reading to the stored target. Use a slow speed (`0.2`–`0.3`) for precise positioning; the default 0.3 is a safe starting point.

## Camera Sensor

The camera interface provides access to the Raccoon camera system for object detection. The camera module lives in the `raccoon.cam` subpackage — **not** the top-level `raccoon` package.

### Declaration

```python
from raccoon.cam import CamSensor    # correct import path

cam = CamSensor()
```

Camera functionality depends on the `raccoon-cam` and `object-detector` services running on the robot. The constructor starts a background receive thread that keeps an internal cache of the latest detection frame. All query methods below are thread-safe.

### Detection Queries

All query methods take a `label` string — the name of the class the object detector was trained to detect (e.g. `"orange"`, `"ball"`, `"cube"`). They operate on the **first** detected blob matching that label in the current frame.

| Method | Return Type | Description |
|--------|------------|-------------|
| `cam.isDetected(label)` | `bool` | `True` if at least one blob with `label` is in the current frame |
| `cam.getBlobX(label)` | `float` | X position of the blob centre, normalised 0.0–1.0 (0 = left edge) |
| `cam.getBlobY(label)` | `float` | Y position of the blob centre, normalised 0.0–1.0 (0 = top edge) |
| `cam.getBlobWidth(label)` | `float` | Width of the blob, normalised 0.0–1.0 |
| `cam.getBlobHeight(label)` | `float` | Height of the blob, normalised 0.0–1.0 |
| `cam.getBlobArea(label)` | `int` | Area of the blob in pixels |
| `cam.getConfidence(label)` | `float` | Detection confidence, 0.0–1.0 |
| `cam.getDetectedLabels()` | `list[str]` | All labels present in the current detection frame |
| `cam.getFrameWidth()` | `int` | Camera frame width in pixels |
| `cam.getFrameHeight()` | `int` | Camera frame height in pixels |

`getBlobX`, `getBlobY`, `getBlobWidth`, `getBlobHeight`, and `getConfidence` return `0.0` if no blob with that label is detected. Always check `isDetected()` first.

### Example: Object-Triggered Motion

```python
from raccoon.cam import CamSensor
from raccoon import run, seq, drive_forward

cam = CamSensor()

def approach_orange_ball():
    return seq([
        # Wait until the ball is visible
        run(lambda robot: print("waiting for ball...")),
        drive_forward(speed=0.4).until(
            lambda: cam.isDetected("orange")
        ),
        run(lambda robot: print(
            f"Ball at ({cam.getBlobX('orange'):.2f}, {cam.getBlobY('orange'):.2f}), "
            f"confidence={cam.getConfidence('orange'):.2f}"
        )),
    ])
```

### Example: Inspect All Current Detections

```python
from raccoon.cam import CamSensor

cam = CamSensor()

def print_detections():
    labels = cam.getDetectedLabels()
    if not labels:
        print("Nothing detected")
    for label in labels:
        print(
            f"{label}: x={cam.getBlobX(label):.2f}, "
            f"y={cam.getBlobY(label):.2f}, "
            f"area={cam.getBlobArea(label)} px, "
            f"confidence={cam.getConfidence(label):.2f}"
        )
```

## ET Sensor (Distance)

The ET (electro-topographic) sensor is a distance/range finder. It wraps an analog input but has a distinct type for clarity:

```python
from raccoon import ETSensor

distance = ETSensor(port=3)
```

Use it like an analog sensor — read raw values with `distance.read()` (or the equivalent alias `distance.raw()`) or use it with `on_analog_above()` / `on_analog_below()` conditions. Use `calibrate_analog_sensor()` + `drive_to_analog_target()` when you need to stop at a repeatable calibrated distance (see the Analog Sensors section above).

## Sensor Groups in Depth

`SensorGroup` is a convenience wrapper that pre-binds common step patterns to your sensors. It accepts `left` and/or `right` IR sensors and stores default threshold, speed, and PID gain values so you don't have to repeat them on every call.

### Constructor Parameters

```python
from raccoon import SensorGroup

front = SensorGroup(
    left=front_left_ir,      # IRSensor or None
    right=front_right_ir,    # IRSensor or None
    threshold=0.7,           # default detection confidence, 0.0–1.0
    speed=1.0,               # default motion speed, 0.0–1.0
    follow_speed=0.8,        # speed used for line-following methods
    follow_kp=0.5,           # proportional gain for line-follow PID
    follow_ki=0.02,          # integral gain for line-follow PID
    follow_kd=0.0,           # derivative gain for line-follow PID
)
```

All parameters except `left` / `right` are optional and can be tuned once at the group level rather than passing them on every method call.

| Parameter | Default | Effect |
|-----------|---------|--------|
| `threshold` | `0.7` | Default `probabilityOfBlack` / `probabilityOfWhite` threshold for all methods |
| `speed` | `1.0` | Default drive speed fraction for non-follow methods |
| `follow_speed` | `0.8` | Speed for `follow_right_edge()` and `follow_right_until_black()` |
| `follow_kp` | `0.5` | Line-follow PID proportional gain |
| `follow_ki` | `0.02` | Line-follow PID integral gain |
| `follow_kd` | `0.0` | Line-follow PID derivative gain |

### Available SensorGroup Methods

Every method returns a step builder that works inside `seq([...])` and `parallel(...)` just like any other step. All accept optional `speed` and `threshold` overrides to use values different from the group defaults.

| Method | Description |
|--------|-------------|
| `.drive_until_black(speed, threshold)` | Drive forward until any sensor sees black |
| `.drive_until_white(speed, threshold)` | Drive forward until any sensor sees white |
| `.drive_over_line(speed, threshold)` | Drive forward through black then white (crosses one line) |
| `.drive_backward_until_black(sensor, speed, threshold)` | Drive backward until the specified sensor (default: right) sees black |
| `.lineup_on_black(threshold)` | Align both sensors on a black line (forward lineup) |
| `.lineup_on_white(threshold)` | Align both sensors on a white area (forward lineup) |
| `.backward_lineup_on_black()` | Align both sensors on a black line (backward lineup) |
| `.backward_lineup_on_white()` | Align both sensors on a white area (backward lineup) |
| `.strafe_left_until_black(sensor, speed, threshold)` | Strafe left until the specified sensor (default: left) sees black |
| `.strafe_right_until_black(sensor, speed, threshold)` | Strafe right until the specified sensor (default: right) sees black |
| `.strafe_right_until_white(sensor, speed, threshold)` | Strafe right until the specified sensor sees white |
| `.follow_right_edge(cm, speed)` | Follow the right edge of a line for the given distance |
| `.follow_right_until_black(speed)` | Follow line on right sensor until the **left** sensor sees black |

> **`follow_right_until_black()` stop condition:** Despite the method name mentioning the right sensor for following, the stop condition monitors the **left** sensor at threshold 1.0. This is intentional — it is designed to follow along a line until the robot arrives at an intersection where the left sensor detects a perpendicular line.

### Per-Call Overrides

Default values can be overridden per call:

```python
front = SensorGroup(left=front_left_ir, right=front_right_ir, threshold=0.7)

# Use the group default threshold
front.lineup_on_black()

# Override threshold for this call only
front.lineup_on_black(threshold=0.5)

# Override speed for this call only
front.strafe_left_until_black(speed=0.3, threshold=0.3)

# Specify which sensor to use
front.strafe_left_until_black(sensor=front.right)
```

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
