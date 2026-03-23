---
title: "Floating Panels"
author: "Tobias Madlberger"
date: 2026-03-22
draft: false
weight: 7
---

## Floating Panels

Three floating panels can be toggled on/off from the toolbar. They can be moved and repositioned on the canvas.

### Run Logs

Shows live output from the robot while a mission is running. Displays the same log stream as `raccoon run` in the terminal. Shows **IDLE** when no mission is running.

### Table Visualization

A live top-down view of the table showing the robot's current position and planned path. Updates in real-time during a run.

- **Edit Path** button opens path planning mode — place waypoints on the table and the IDE generates the corresponding steps automatically

### Timing Panel

Shows execution time for each step in the last run, both as a list and as a chart. Useful for identifying slow steps and optimising mission timing.
