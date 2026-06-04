---
title: "Your First Robot Program"
author: "Tobias Madlberger"
date: 2026-03-28
draft: false
weight: 2
---

# Your First Robot Program

You've set up your robot, connected it, and `raccoon run` works. Now what? This page walks you through writing your first real program — step by step, one concept at a time. By the end, your robot will drive, move servos, react to sensors, and run a proper mission sequence.

> **Prerequisites:** You've completed the [Quick Start]({{< ref "00-quick-start" >}}) and can run `raccoon run` successfully. Your hardware is configured in `raccoon.project.yml`.

---

## The Programming Workflow

This is what you'll do over and over:

1. **Edit** your Python mission file on your laptop
2. **Run** `raccoon run` in the terminal
3. **Watch** the robot execute, read the terminal output
4. **Iterate** — tweak values, add steps, fix what went wrong

That's it. There's no separate compile step, no firmware flashing, no manual file copying. `raccoon run` handles syncing, code generation, and execution in one command.

> **Don't edit `defs.py` or `robot.py`** — these are generated from your YAML config every time you run. Your changes will be overwritten. Edit `raccoon.project.yml` (or the `config/*.yml` files) instead, then `raccoon run` regenerates them.

---

## Step 1: The Minimal Mission

Open your first mission file. If you created a project with `raccoon create project`, you already have `src/missions/m01_mission.py` (or similar). If not, create one:

```bash
raccoon create mission MyFirstMission
```

Replace the contents with:

```python
from raccoon import *
from src.hardware.defs import Defs


class M01MyFirstMission(Mission):
    def sequence(self) -> Sequential:
        return seq([
            drive_forward(10),
        ])
```

That's a complete mission. It drives the robot forward 10 cm, then stops.

Run it:

```bash
raccoon run
```

**What to expect:** The robot drives forward a short distance. The terminal shows timing info and step execution. If it doesn't move at all, check your motor config (ports, inversion) in the YAML.

---

## Step 2: Drive and Turn

Now let's make the robot do something more interesting — drive a square:

```python
class M01MyFirstMission(Mission):
    def sequence(self) -> Sequential:
        return seq([
            drive_forward(25),
            turn_right(90),
            drive_forward(25),
            turn_right(90),
            drive_forward(25),
            turn_right(90),
            drive_forward(25),
            turn_right(90),
        ])
```

**What to expect:** The robot drives a roughly square path and ends up near where it started. It won't be perfect — that's normal without calibration.

### Key drive steps

| Step | What it does |
|------|-------------|
| `drive_forward(cm)` | Drive forward by a distance |
| `drive_backward(cm)` | Drive backward by a distance |
| `turn_left(degrees)` | Turn left in place |
| `turn_right(degrees)` | Turn right in place |
| `strafe_left(cm)` | Slide left (mecanum only) |
| `strafe_right(cm)` | Slide right (mecanum only) |

All of these accept an optional `speed` parameter (0.0 to 1.0, default 1.0):

```python
drive_forward(25, speed=0.5)   # Half speed — more controlled
turn_right(90, speed=0.3)      # Slow turn — more accurate
```

---

## Step 3: Use a Servo

Servos are how your robot interacts with the world — arms, claws, pushers, lifters. Let's make one move.

### Define the servo in your YAML

In `raccoon.project.yml` (or `config/servos.yml`), add a servo definition:

```yaml
definitions:
  # ... your motors, sensors, etc.
  my_arm_servo:
    type: Servo
    port: 0          # Which servo port on the Wombat (0-3)
```

### Find the right angles

Before writing code, you need to find the servo angles for each position:

1. Open **BotUI → Sensors & Actors** on the robot's touchscreen
2. Move the servo slider to find each position you need
3. Write down the angles (e.g., "down = 20, up = 150")

### Use it as a plain servo

The simplest way — just tell it which angle to go to:

```python
class M01MyFirstMission(Mission):
    def sequence(self) -> Sequential:
        return seq([
            servo(Defs.my_arm_servo, 150),   # Arm up
            drive_forward(25),
            servo(Defs.my_arm_servo, 20),    # Arm down
            drive_backward(25),
            servo(Defs.my_arm_servo, 150),   # Arm back up
        ])
```

### Use named presets (recommended)

For servos you use a lot, define named positions. Update your YAML:

```yaml
definitions:
  arm:
    type: ServoPreset
    servo:
      port: 0
    positions:
      up: 150
      down: 20
      mid: 85
```

Now in your code, you get named methods:

```python
seq([
    Defs.arm.up(),          # Move to 150°
    drive_forward(25),
    Defs.arm.down(),        # Move to 20°
    drive_backward(25),
    Defs.arm.mid(),         # Move to 85°
])
```

This is much more readable and less error-prone than remembering angle numbers.

### Control servo speed

By default servos move at full speed. For gentle or controlled movements, pass a speed in degrees per second:

```python
Defs.arm.down(60)      # Move down at 60 deg/s (slow and controlled)
Defs.arm.up(300)       # Move up at 300 deg/s (fast but not instant)
```

---

## Step 4: React to Sensors

The robot has IR sensors that detect black lines on the game table, digital sensors for buttons and limit switches, and analog sensors for light and distance.

### IR sensors — drive until you see a line

The most common pattern: drive forward until an IR sensor detects a black line.

```python
seq([
    # Drive forward until the front-right sensor hits a black line
    drive_forward(speed=0.8).until(on_black(Defs.front_right_ir_sensor)),

    # Drive a bit more to center over the line
    drive_forward(2),
])
```

If you have a `SensorGroup` defined (recommended), it's even simpler:

```python
seq([
    Defs.front.drive_until_black(),   # Drive forward → stop on black
    drive_forward(2),                  # Nudge forward
])
```

> **IR sensors need calibration** to reliably tell black from white. Add `calibrate(distance_cm=50)` to your setup mission (covered in Step 6 below). Without it, the thresholds may be wrong for your surface.

### Digital sensors — wait for a button press

```python
seq([
    wait_for_button(),       # Wait for the Wombat's built-in button
    drive_forward(25),       # Then go
])
```

### Analog sensors — stop on a threshold

```python
# Drive forward until a distance sensor reads above 2000
drive_forward(speed=0.5).until(on_analog_above(Defs.distance_sensor, 2000))
```

---

## Step 5: Combine Actions with Parallel

So far everything runs one step after another. But often you need to do two things at the same time — like driving while moving a servo.

```python
seq([
    # Drive forward AND lower the arm at the same time
    parallel(
        drive_forward(30),
        Defs.arm.down(60),
    ),

    # Now do something with the arm down
    Defs.claw.closed(),
    Defs.arm.up(),
])
```

A more advanced pattern — trigger an action at a specific point during a drive:

```python
parallel(
    drive_forward(50),                        # Track 1: drive 50 cm
    seq([                                      # Track 2: arm control
        wait_until_distance(30),               #   wait until 30 cm traveled
        Defs.arm.down(),                       #   then lower the arm
    ]),
)
```

`parallel()` finishes when **all tracks** are done. The framework checks that you don't use the same hardware in two tracks — you can't drive forward and turn at the same time.

---

## Step 6: Put It All Together — A Real Mission

Here's a complete project with setup, main mission, and shutdown — the pattern every competition robot follows.

### Setup mission (`m00_setup_mission.py`)

Runs before the match starts. Calibrates and homes all servos:

```python
from raccoon import *
from src.hardware.defs import Defs


class M00SetupMission(Mission):
    def sequence(self) -> Sequential:
        return seq([
            # Home servos to known positions
            Defs.arm.up(),
            Defs.claw.closed(),

            # Calibrate distance + IR sensors
            # Place the robot on the board with room to drive 50 cm forward
            calibrate(distance_cm=50),
        ])
```

### Main mission (`m01_grab_object_mission.py`)

The actual task — drive to an object, pick it up, bring it back:

```python
from raccoon import *
from src.hardware.defs import Defs


class M01GrabObjectMission(Mission):
    def sequence(self) -> Sequential:
        return seq([
            # Drive to the object
            drive_forward(30),
            turn_right(45),
            drive_forward(20),

            # Pick it up
            Defs.arm.down(),
            Defs.claw.open(),
            drive_forward(5, speed=0.3),     # Approach slowly
            Defs.claw.closed(120),            # Close gently at 120 deg/s
            Defs.arm.up(),

            # Drive back
            drive_backward(5),
            turn_left(45),
            drive_backward(30),

            # Release
            Defs.arm.down(),
            Defs.claw.open(),
            Defs.arm.up(),
        ])
```

### Shutdown mission (`m99_shutdown_mission.py`)

Runs when the match timer expires. Stop everything safely:

```python
from raccoon import *
from src.hardware.defs import Defs


class M99ShutdownMission(Mission):
    def sequence(self) -> Sequential:
        return seq([
            Defs.arm.up(),
            Defs.claw.open(),
            fully_disable_servos(),
        ])
```

### Mission order in the YAML

In `raccoon.project.yml`:

```yaml
missions:
  - M00SetupMission: setup
  - M99ShutdownMission: shutdown
  - M01GrabObjectMission
```

The `setup` mission runs first (before the start signal). After the start signal, missions run in list order. When `shutdown_in` milliseconds expire, the current mission is cancelled and the `shutdown` mission runs.

---

## Step 7: The Development Loop

Now you know the basics. Here's how the real workflow goes:

### 1. Start simple, add complexity

Don't write your whole mission at once. Start with just the first few steps:

```python
return seq([
    drive_forward(30),
    turn_right(45),
])
```

Run it. Does it go the right distance? Is the angle right? Tweak the values, run again.

### 2. Add steps incrementally

Once the first part works, add the next steps:

```python
return seq([
    drive_forward(30),
    turn_right(45),
    drive_forward(20),        # NEW — added after verifying the above
    Defs.arm.down(),          # NEW
])
```

Run again. This way you always know which step is causing a problem.

### 3. Use print for debugging

The `run()` step lets you print values mid-mission:

```python
seq([
    drive_forward(20),
    run(lambda robot: print(f"IR sensor: {robot.defs.front_right_ir_sensor.read()}")),
    drive_forward(20),
])
```

Output appears in your terminal.

### 4. Use wait_for_button() as breakpoints

Pause execution at any point to inspect the robot's state:

```python
seq([
    drive_forward(20),
    wait_for_button(),         # Robot stops — press button to continue
    turn_right(90),
    wait_for_button(),         # Stops again
    drive_forward(20),
])
```

This is invaluable for debugging positioning.

---

## Common Patterns

### Drive to a line and align

```python
seq([
    Defs.front.drive_until_black(),       # Drive forward until you see a line
    Defs.front.lineup_on_black(),          # Square the robot on the line
])
```

### Follow a line for a distance

```python
Defs.front.follow_right_edge(cm=50)    # Follow right edge of the line for 50 cm
```

### Follow a line until another sensor triggers

```python
Defs.front.follow_right_edge(999).until(
    on_black(Defs.side_sensor)
)
```

### Wall align

Drive backward into a wall to reset your position/heading:

```python
seq([
    wall_align_backward(accel_threshold=0.3),   # Back into wall until impact
    drive_forward(2),                             # Pull away from wall
])
```

### Grab and release

```python
seq([
    Defs.arm.down(),
    Defs.claw.open(),
    drive_forward(3, speed=0.3),
    Defs.claw.closed(120),        # Slow close — controlled grip
    Defs.arm.up(120),             # Slow lift
])
```

---

## See a Complete Project

The code snippets on this page are intentionally minimal — each one teaches one thing. Once you understand the pieces, it helps to see them all working together in a real project.

**[raccoon-example](https://github.com/htl-stp-ecer/raccoon-example)** is a clean reference robot that demonstrates everything on this page in a single, readable codebase:

- `m00_setup_mission.py` — servo homing, `calibrate()`, `wait_for_button()`  
- `m01_navigate_to_object_mission.py` — `mark_heading_reference()`, `parallel()`, `.until()` with a sensor stop condition  
- `m02_collect_object_mission.py` — reusable custom step, `wall_align_backward()`  
- `m03_deliver_object_mission.py` — `strafe_follow_line_single()`, combined stop conditions  
- `steps/arm_steps.py` — `seq()` composition and `defer()` for runtime decisions  

It is built with the same patterns as competition robots, but written for clarity rather than speed. The competition robots ([drumbot](https://gitlab.com/fallgame2025/drumbot), [conebot](https://gitlab.com/fallgame2025/conebot), [packingbot](https://gitlab.com/fallgame2025/packingbot)) show what the platform looks like under real pressure — raccoon-example shows what the code *should* look like when you have time to write it properly.

```bash
git clone https://github.com/htl-stp-ecer/raccoon-example.git
```

---

## What to Learn Next

| Topic | When you need it |
|-------|-----------------|
| [Stop Conditions]({{< ref "04a-stop-conditions" >}}) | Combining sensor conditions with OR, AND, THEN |
| [Custom Steps]({{< ref "05-custom-steps" >}}) | Packaging reusable behaviors as step functions |
| [Calibration]({{< ref "10-calibration" >}}) | Making distances and turns accurate |
| [Sensors]({{< ref "06-sensors" >}}) | All sensor types and usage patterns |
| [Drive System]({{< ref "07-drive-system" >}}) | PID tuning, when the robot drifts or overshoots |
| [Odometry]({{< ref "08-odometry" >}}) | Tracking position on the field |
| [Servos]({{< ref "09-servos" >}}) | Advanced servo patterns, shake, slow servo |
| [IMU]({{< ref "14-imu" >}}) | Using the gyroscope for heading correction |

---

## Quick Reference Card

```python
# === DRIVING ===
drive_forward(cm)                   # Drive forward
drive_forward(cm, speed=0.5)        # Half speed
drive_backward(cm)                  # Drive backward
turn_left(degrees)                  # Turn in place
turn_right(degrees)                 # Turn in place

# === SERVOS ===
servo(Defs.my_servo, angle)         # Move to angle
Defs.arm.up()                       # Named preset (full speed)
Defs.arm.down(60)                   # Named preset (60 deg/s)

# === SENSORS ===
drive_forward(speed=0.8).until(on_black(Defs.front.right))
drive_forward(speed=0.5).until(on_analog_above(Defs.sensor, 2000))
Defs.front.drive_until_black()
Defs.front.lineup_on_black()
Defs.front.follow_right_edge(cm=50)

# === CONTROL FLOW ===
seq([step1, step2, step3])          # Run in order
parallel(track1, track2)            # Run at the same time
wait_for_seconds(1.0)              # Pause
wait_for_button()                   # Wait for button press
wait_until_distance(cm)            # Wait until driven distance
run(lambda robot: print("hi"))     # Run Python code

# === CALIBRATION ===
calibrate(distance_cm=50)           # Calibrate motors + sensors
auto_tune()                         # Auto-tune PID + motion profiles
```
