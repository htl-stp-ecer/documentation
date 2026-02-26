---
title: "Running Projects"
date: 2024-01-01
draft: false
weight: 6
---

# Running Projects

`raccoon run` is the command you use to execute your robot program. It handles syncing, code generation, and execution in one step.

---

## Running on the Connected Robot

From inside your project directory:

```bash
raccoon run
```

raccoon will:

1. Check if the configuration has changed and re-run `codegen` if needed
2. Sync all modified project files to the robot via SFTP
3. Execute `src/main.py` on the robot
4. Stream the program's output back to your terminal in real time

> **[PICTURE: Terminal showing raccoon run output with robot movement logs]**

You can press **Ctrl+C** to stop the program before it finishes.

---

## Running Locally (Without a Robot)

If you want to run the project on your laptop for testing (without a robot connected):

```bash
raccoon run --local
```

This runs `src/main.py` directly on your machine. Note that hardware calls (motors, sensors) will either be simulated or produce errors unless your code handles the missing hardware gracefully.

---

## What Happens on the Robot

When `raccoon run` executes your program, it runs `src/main.py`. That file creates a `Robot` instance and calls `.start()`, which:

1. Runs the **setup mission** (if defined)
2. Runs your **main missions** in order
3. Runs the **shutdown mission** (if defined)

Your program output (print statements, log messages) appears in your terminal as it happens.

---

## Typical Development Loop

```
Edit code on laptop → raccoon run → watch output → edit again → raccoon run → ...
```

Every `raccoon run` re-syncs your files, so you always run your latest code without any manual upload step.
