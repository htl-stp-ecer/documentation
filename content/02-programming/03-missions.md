---
title: "Missions"
date: 2026-03-21
draft: false
weight: 4
---

# Missions

A mission is a self-contained task your robot performs — "drive to the cone and pick it up", "follow the line to the basket", "go home". Missions are composed of steps arranged in sequences.

## Writing a Mission

Every mission extends the `Mission` base class and implements a `sequence()` method that returns a `Sequential` of steps:

```python
from libstp import *
from src.hardware.defs import Defs


class M01DriveToConeMission(Mission):
    def sequence(self) -> Sequential:
        return seq([
            drive_forward(25),
            turn_right(90),
            drive_forward(15),
            Defs.claw.open(),
        ])
```

That's it. The framework handles execution, timing, error handling, and hardware cleanup.

## Real-World Example: ConeBot

Here's the actual mission from the Ecer2026 ConeBot that drives to a cone on the game table:

```python
from libstp import *
from src.hardware.defs import Defs


class M01DriveToConeMission(Mission):
    def sequence(self) -> Sequential:
        return seq([
            # Start position: against the wall
            Defs.cone_arm_servo.up(),
            drive_backward(3),
            turn_right(55),

            # Align against the back wall
            wall_align_backward(accel_threshold=0.3),
            drive_forward(2),

            # Sweep to check for cone
            Defs.cone_arm_servo.down(),
            turn_left(25),
            turn_right(25),
            Defs.cone_arm_servo.up(),

            # Drive to the line and follow it
            Defs.front.drive_until_black(),
            forward_single_lineup(
                Defs.front.right,
                entry_threshold=0.9,
                exit_threshold=0.7,
                correction_side=CorrectionSide.RIGHT,
                forward_speed=1.0,
            ),

            # Drive along the line to the cone
            drive_forward(27),
            turn_right(90),
            Defs.front.drive_until_black(),
        ])
```

Notice how the mission reads almost like natural language: "raise arm, back up, turn, align against wall, find the line, follow it, drive to the cone."

## Composing Steps

### Sequential Execution

`seq([...])` runs steps one after another. Each step must finish before the next one starts:

```python
seq([
    drive_forward(25),     # Step 1: drive 25 cm
    turn_right(90),        # Step 2: turn 90 degrees (after step 1 finishes)
    drive_forward(25),     # Step 3: drive 25 cm (after step 2 finishes)
])
```

### Parallel Execution

`parallel(...)` runs multiple things at the same time. Each argument is an independent track:

```python
parallel(
    drive_forward(50),                          # Track 1: drive forward
    seq([                                        # Track 2: arm movement
        wait_until_distance(20),                 #   wait until 20cm traveled
        Defs.arm.down(),                         #   then lower the arm
    ]),
)
```

Parallel finishes when **all tracks** complete. You can pass individual steps, lists of steps (implicitly sequential), or explicit `seq([...])` blocks.

**Resource safety**: Parallel validates that no two tracks use the same hardware resource. You can't drive forward and turn at the same time, because both need the drive system. The framework will raise an error before execution if it detects a conflict.

### Real Parallel Example

From the PackingBot — driving forward while operating a grabber:

```python
parallel(
    # Track 1: Follow the line edge
    Defs.front.follow_right_edge(999).until(
        after_cm(125) & on_black(Defs.front.right)
    ),

    # Track 2: Grab POMs during the drive
    seq([
        wait_until_distance(35),      # Wait until we've traveled 35cm
        Defs.pom_grab.closed(),       # Close grabber
        Defs.pom_arm.up(),            # Lift arm
    ]),

    # Track 3: Put arm back down after passing edge
    seq([
        wait_until_distance(45),
        Defs.pom_arm.down(),
    ]),

    # Track 4: Pre-adjust grabber width
    Defs.pom_grab.slightly_open(),
)
```

Four things happening simultaneously: line following, grabbing objects at the right moment, repositioning the arm, and adjusting the grabber width.

## Stop Conditions

Many steps accept a `.until(condition)` clause that controls when the step finishes:

```python
drive_forward(speed=0.8).until(on_black(Defs.front.right))
drive_forward(speed=1.0).until(on_black(Defs.front.right) | after_cm(50))
drive_forward(speed=1.0).until(after_cm(10) > on_black(Defs.front.right))
```

Conditions can be combined with `|` (OR), `&` (AND), `>` (THEN), and grouped with parentheses for complex logic. See **[Stop Conditions]({{< ref "04a-stop-conditions" >}})** for the full reference.

## Control Flow

### Looping

```python
# Repeat a step 5 times
loop_for(drive_forward(10), iterations=5)

# Repeat forever (use inside do_while_active to stop it)
loop_forever(seq([
    drive_forward(10),
    turn_right(90),
]))
```

### Do While Active

Run a task that stops when a reference step finishes:

```python
do_while_active(
    reference_step=drive_forward(100),  # This controls the lifetime
    task=loop_forever(                   # This runs alongside and gets cancelled
        seq([
            Defs.arm.up(),
            wait_for_seconds(0.5),
            Defs.arm.down(),
            wait_for_seconds(0.5),
        ])
    ),
)
```

### Inline Code with `run()`

Execute arbitrary Python code as a step:

```python
seq([
    drive_forward(25),
    run(lambda robot: print("Reached the cone!")),
    Defs.claw.open(),
])
```

`run()` accepts sync or async callables:

```python
async def check_sensor(robot):
    value = robot.defs.front_right_ir.read()
    if value > 2000:
        print("On black line")

seq([
    run(check_sensor),
    drive_forward(10),
])
```

### Deferred Steps

Build a step at runtime based on robot state:

```python
def choose_direction(robot):
    if robot.defs.front_right_ir.read() > 2000:
        return turn_left(90)
    else:
        return turn_right(90)

seq([
    drive_forward(25),
    defer(choose_direction),   # Decides at runtime
    drive_forward(25),
])
```

## Setup Mission Pattern

The setup mission runs before the match starts. Common pattern:

```python
class M00SetupMission(Mission):
    def sequence(self) -> Sequential:
        return seq([
            # Home all servos to known positions
            motor_off(Defs.cone_container_motor),
            Defs.claw.closed(),
            Defs.arm.up(),

            # Run distance calibration
            calibrate(distance_cm=50),
        ])
```

## Mission Registration

Missions are registered in the Robot class. This is salso automatically generated for you. **Don't edit this!** To change it, edit the `raccoon.project.yaml` file:

```python
class Robot(GenericRobot):
    # ...
    setup_mission = M00SetupMission()         # Runs before start signal
    missions = [                               # Run in order after start
        M01DriveToConeMission(),
        M02CollectConeMission(),
        M03CollectBotguyMission(),
    ]
    shutdown_mission = M99ShutdownMission()    # Runs when timer expires
```

Missions execute in list order. If mission 1 finishes, mission 2 starts immediately. If the `shutdown_in` timer fires during any mission, that mission is cancelled and the shutdown mission runs.
