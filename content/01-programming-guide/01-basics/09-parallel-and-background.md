---
title: "Parallel and Background"
author: "Mario Scholze"
date: 2026-11-15
draft: false
weight: 90
description: "Run steps at the same time with parallel(), or start a step and carry on with background() and wait_for_background()."
---

# Parallel and Background

Normally `seq([...])` runs one step after the other. Two tools let the robot do several things at once, for example lower the arm while driving.

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

Two branches must not use the same exclusive hardware resource, for example two steps that both drive the drivetrain. raccoon checks this before execution starts and raises an error before the robot moves. See [Resource Conflict Detection]({{< ref "/01-programming-guide/08-more-topics/09-advanced-topics.md" >}}).

Passing anything that is not a step, a `seq` or a list of steps raises a `TypeError`.

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

---

## Which one to use

- Use **`parallel`** when the work is clearly "these things together, then continue": drive while moving an arm.
- Use **`background`** when something should start now and may finish whenever, and you only need to wait for it at a later point, or never.
- If the two steps need the same hardware, they cannot run at the same time. Use `seq` instead.

---

## Related pages

- [Steps DSL]({{< ref "/01-programming-guide/01-basics/07-steps-dsl.md" >}}): `seq`, chaining and control flow.
- [Missions]({{< ref "/01-programming-guide/01-basics/06-missions.md" >}}): how missions are built from steps.
- [Advanced Topics]({{< ref "/01-programming-guide/08-more-topics/09-advanced-topics.md" >}}): the async execution model and resource conflicts.
