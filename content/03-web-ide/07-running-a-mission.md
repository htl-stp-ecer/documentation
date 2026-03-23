---
title: "Running a Mission"
author: "Tobias Madlberger"
date: 2026-03-22
draft: false
weight: 8
---

## Running a Mission

1. Select a mission in the left panel
2. Click the green **▶ Run** button in the toolbar
3. Output streams live in the Run Logs panel
4. Press the stop button (or Ctrl+C in the terminal) to stop

By default, runs execute in **Sim** (simulation) mode — the mission logic runs but motor commands are suppressed. Toggle **Sim** off to run on the real robot.

> **Note:** Running from the Web IDE does NOT create checkpoints or sync files the way `raccoon run` does. For competition runs, use `raccoon run` from the terminal.
