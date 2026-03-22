---
title: "run"
author: "Tobias Madlberger"
date: 2026-03-22
draft: false
weight: 4
---

# raccoon run

```bash
raccoon run
```

The command you'll use most. Syncs your project to the robot, generates hardware code, runs the program, and pulls results back — all in one step.

## What it does

1. **Checkpoint** — saves a local git snapshot of your current files (requires git)
2. **Sync (push)** — uploads your project files to the robot via rsync
3. **Codegen** — runs on the robot: generates `defs.py`, `defs.pyi`, and `robot.py` from your YAML config
4. **Run** — executes `src/main.py` on the robot, streaming output live to your terminal
5. **Checkpoint** — saves another snapshot after the run
6. **Sync (pull)** — downloads any updated files back (e.g. calibration data written during the run)

## Typical output

```
INFO     Authentication (publickey) successful!
Checkpoint e4b6191 saved
Syncing 'MyRobot' (pushing to ConeBot)...
Sync complete!
  Uploaded Files:  16
  Bytes Total: 8978

Running 'MyRobot' on ConeBot...
Press Ctrl+C to stop

INFO     ✓ Generated defs.py
INFO     ✓ Generated robot.py
INFO     Running src.main...

2026-03-22 12:03:42 | info | [Robot]: Starting robot
...robot output streams here...

^C
Cancelling...
Sync complete!
  Downloaded: 4
```

## Stopping a run

Press **Ctrl+C**. raccoon sends a shutdown signal to the robot, waits for it to stop cleanly (motors disabled), then pulls files back.

## Running individual steps manually

```bash
raccoon codegen   # regenerate defs.py / robot.py only
raccoon sync      # push or pull files only
```

These are rarely needed — `raccoon run` covers both.

## Version mismatch warning

If the client and server versions differ, raccoon prints a warning before running:

```
Warning: version mismatch
  Client: 0.1.25  Server: 0.1.23
  Run raccoon update to update the Pi.
```

Things usually still work across minor versions, but run `raccoon update` to keep both sides in sync.
