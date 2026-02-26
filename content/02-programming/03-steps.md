---
title: "Step Framework"
date: 2024-01-01
draft: false
weight: 4
---

# Step Framework

The Step Framework lets you build complex mission sequences from composable building blocks. Instead of writing everything as one long `sequence` method, you describe your mission as a tree of **steps** that can run in sequence or in parallel.

---

## Why Use Steps?

The main reasons to use steps:

- **Parallel execution** — run two things at the same time (e.g., drive and monitor a sensor simultaneously)
- **Reusability** — define a step once and use it in multiple missions
- **Readability** — complex missions become a readable list of named actions

---

## Sequential Steps

`Sequential` runs a list of steps one after another:

```python
from libstp.step import Sequential
from libstp.step.motion import Drive, Turn

mission = Sequential([
    Drive(500),      # drive 500 mm forward
    Turn(90),        # turn right 90 degrees
    Drive(300),      # drive 300 mm forward
])

mission.run()
```

Each step waits for the previous one to finish before starting.

---

## Parallel Steps

`Parallel` runs multiple steps at the same time and waits until **all** of them finish:

```python
from libstp.step import Sequential, Parallel, Wait
from libstp.step.motion import Drive, Turn

mission = Sequential([
    Drive(500),
    Parallel([
        Turn(90),       # turn while...
        Wait(2.0),      # ...also waiting 2 seconds (whichever finishes last)
    ]),
    Drive(200),
])
```

---

## Built-in Steps

| Step | Description |
|---|---|
| `Drive(distance_mm)` | Drive forward (or backward with negative value) |
| `Turn(angle_deg)` | Rotate in place (positive = right) |
| `Strafe(distance_mm)` | Move sideways — mecanum only |
| `Wait(seconds)` | Pause for the given duration |

> **[TODO: Confirm the complete list of built-in steps from libstp — check src/step/ in the raccoon-lib project]**

---

## Writing Custom Steps

You can create your own reusable steps in `src/steps/`:

```python
from libstp.step import Step

class PickUpBall(Step):
    def run(self, robot):
        robot.servo(port=0).set_position(0)    # open claw
        robot.motion.drive(distance_mm=100)    # drive onto ball
        robot.servo(port=0).set_position(90)   # close claw
```

Then use it in a mission:

```python
from libstp.step import Sequential
from libstp.step.motion import Drive
from steps.pick_up_ball import PickUpBall

mission = Sequential([
    Drive(200),
    PickUpBall(),
    Drive(-100),
])
```

---

## Using Steps Inside a Mission

You can call steps from inside a mission's `sequence` method:

```python
from libstp.mission import Mission
from libstp.step import Sequential
from libstp.step.motion import Drive, Turn

class CollectMission(Mission):
    def sequence(self):
        plan = Sequential([
            Drive(500),
            Turn(90),
            Drive(300),
        ])
        plan.run()
```

Or mix steps with direct motion calls — whatever is clearest for the task.
