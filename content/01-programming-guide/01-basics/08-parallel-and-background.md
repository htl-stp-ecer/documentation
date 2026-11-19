---
title: "Sequences, Parallel and Background"
author: "Mario Scholze"
date: 2026-11-19
draft: false
weight: 80
description: "Run steps one after another with seq(), at the same time with parallel(), or in the background with background() and wait_for_background()."
---

# Sequences, Parallel and Background

## `seq`

`seq([...])` runs steps one after another. Each step must finish before the next one starts. A mission's `sequence()` returns one `seq`, and a `seq` can contain other `seq`s, `parallel`s and any other step.

```python
seq([
    drive_forward(25),     # first
    turn_right(90),        # after the drive has finished
    drive_forward(25),     # after the turn has finished
])
```

Two tools let the robot do several things at once, for example lower the arm while driving.

| | `parallel(...)` | `background(step)` |
|---|---|---|
| Starts | all branches together | the step, then the sequence continues at once |
| The sequence continues when | **all** branches are finished | immediately |
| Wait for the result | built in | `wait_for_background(...)` |
| Hardware conflict | error at startup | the background step is cancelled with a warning |

---

## `parallel`

`parallel(...)` takes any number of branches and runs them concurrently. It is finished when the last branch is finished. A branch can be a single step, a `seq([...])`, or a plain list of steps (which is wrapped in a `seq`).

```python
from raccoon import *

seq([
    parallel(
        drive_forward(cm=40),             # branch 1: drive
        seq([                             # branch 2: wait, then lower the arm
            wait_until_distance(7),
            servo(Defs.arm_servo, 90),
        ]),
    ),
    turn_right(degrees=90),               # starts when BOTH branches are done
])
```

Because each branch is its own sequence, the arm waits for 7 cm of driving and the drive does not wait for the arm.

Two branches must not use the same exclusive hardware resource, for example two steps that both drive the drivetrain. raccoon checks this before execution starts and raises an error before the robot moves. See [Resource Conflict Detection]({{< ref "/06-advanced/08-runtime-and-tooling/01-async-and-services.md" >}}).

Passing anything that is not a step, a `seq` or a list of steps raises a `TypeError`.

### A real example

From the PackingBot: driving forward while operating a grabber.

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

---

## `background`

`background(step)` starts a step and returns immediately, so the next step in the sequence starts without waiting.

```python
seq([
    background(slow_scan(), name="scan"),   # starts, does not block
    drive_forward(cm=30),                   # runs while the scan is running
    wait_for_background("scan"),            # now wait for the scan to finish
    turn_left(degrees=90),
])
```

- **`name`** is optional. It lets you wait for one specific background step later. Reusing a name while the earlier step still runs logs a warning.
- **Several background steps** can run at the same time as long as they do not use the same hardware resource.
- **Preemption:** if a later *foreground* step needs a resource that a background step is using, the background step is cancelled automatically and a warning is logged. The foreground step always wins.

### `wait_for_background`

```python
wait_for_background()          # wait for ALL running background steps
wait_for_background("scan")    # wait only for the one named "scan"
```

It returns immediately if the step has already finished or was preempted.

### Across missions

Named background tasks are **run-scoped, not mission-scoped**. A task started with `background(step, name="x")` at the end of one mission can be awaited with `wait_for_background("x")` at the start of the *next* mission. This is the standard idiom for overlapping arm motion with a mission transition — the arm keeps moving while the runner starts loading the next mission.

The following is adapted from the Ecer2026 ClawBot — M030 kicks off a tray-return background move, and M040 awaits it at its own beginning while already doing other work:

```python
# --- M030CollectDrumsMission ---
class M030CollectDrumsMission(Mission):
    def sequence(self) -> Sequential:
        return seq([
            # ... collect drums ...
            return_tray_to_tray_holder_phase1(),
            # Kick off phase 2 in the background — it will continue into M040
            background(
                return_tray_to_tray_holder_phase2(),
                name="return_tray",
            ),
        ])


# --- M040CollectBotguyMission ---
class M040CollectBotguyMission(Mission):
    def sequence(self) -> Sequential:
        return seq([
            drive_backward().until(on_white(Defs.front.left)),
            backward_line_follow().until(
                after_cm(30) + over_line(Defs.front.right) + after_cm(2)
            ),
            line_follow().until(on_black(Defs.front.right)),
            # Now wait for the tray return that was started in M030
            wait_for_background("return_tray"),
            # ... continue ...
        ])
```

The key insight: `background()` and `wait_for_background()` work across mission boundaries because background handles are keyed by name in the robot's run context, which persists for the entire match.

---

## Which one to use

- Use **`parallel`** when the work is clearly "these things together, then continue": drive while moving an arm.
- Use **`background`** when something should start now and may finish whenever, and you only need to wait for it at a later point, or never.
- If the two steps need the same hardware, they cannot run at the same time. Use `seq` instead.

---

## Related pages

- [Concept]({{< ref "/01-programming-guide/01-basics/01-concept.md" >}}): what a step is and how builders chain.
- [Missions]({{< ref "/01-programming-guide/01-basics/07-missions.md" >}}): how missions are built from steps.
- [Async Model and Services]({{< ref "/06-advanced/08-runtime-and-tooling/01-async-and-services.md" >}}): the async execution model and resource conflicts.
