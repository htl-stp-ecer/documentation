---
title: "Optimize"
author: "Mario Scholze"
date: 2026-11-15
draft: false
weight: 60
description: "optimize([...]) merges and rewrites a list of motion steps with explicit passes: cut corners, absolute heading, one closed-loop move or a spline."
---

# Optimize

`optimize([...])` takes a list of motion steps and runs them as an optimized path. You choose the optimizations by chaining **passes**, one method per pass:

```python
from raccoon import *

optimize([
    drive_forward(50),
    turn_right(90),
    drive_forward(30),
]).cut_corners(5)
```

Here `cut_corners(5)` replaces the `drive, turn, drive` corner with a circular arc, so the robot does not stop at the corner.

`optimize()` is itself a step, so you use it inside a `seq` like any other. It is the explicit counterpart of [`smooth_path()`]({{< ref "/01-programming-guide/02-driving/05-smooth-path.md" >}}): `smooth_path` exposes optimizations as boolean flags, `optimize` as a chain of named passes.

---

## Always on

Two passes run first on every `optimize()`, because they never change what the robot does:

- **decompose:** splits legs such as "drive `after_cm` and then wait for a sensor".
- **merge:** collapses adjacent legs of the same type, for example two `drive_forward` in a row.

If you want neither, use plain `seq(...)` instead of `optimize(...)`.

---

## Chained passes

| Pass | What it does |
|------|--------------|
| `.cut_corners(radius_cm)` | Replaces `straight + turn + straight` corners with an arc and trims `radius_cm` from each straight leg |
| `.to_absolute()` | Converts a run of relative moves with a known end point into **one** closed-loop move to a pose |
| `.absolute_heading()` | Pins every straight leg to one integrated heading, see [Absolute Heading]({{< ref "/01-programming-guide/02-driving/04-absolute-heading.md" >}}) |
| `.splinify()` | Collapses the relative run into one spline. This pass is terminal: nothing can follow it |
| `.apply(pass)` | Appends your own compiler pass |

Passes are checked when the path is built. A pass that needs a different segment representation than the previous one produces, or any pass after a terminal pass, raises a `PathBuildError` before the robot moves.

---

## See what it did

`.explain()` dumps the path after every pass, so you can see exactly how your steps were rewritten:

```python
path = optimize([drive_forward(50), turn_right(90), drive_forward(30)]).cut_corners(5)
print(path.explain())
```

`explain()` only compiles the path and does not move the robot, so you can use it to check a path before you run it.

---

## Related pages

- [Smooth Path and Spline Motion]({{< ref "/01-programming-guide/02-driving/05-smooth-path.md" >}}): the flag-based interface, including `optimize=True` and `corner_cut_cm`.
- [Drive System]({{< ref "/01-programming-guide/02-driving/01-drive-system.md" >}}): the steps you put into the list.
