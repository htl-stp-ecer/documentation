---
title: "Projects List"
author: "Tobias Madlberger"
date: 2026-06-18
draft: false
weight: 9
---

## Overview

The Projects List page (`/projects`) shows every raccoon project found by the local IDE backend. It is your starting point for opening a project, creating a new one, deleting an old one, and — when you have two or more projects — comparing their paths for collision detection.

Navigate to the projects list from anywhere in the IDE by clicking the Raccoon logo in the top-left of the navbar. Once inside a project you can also use the **Back to Projects** button inside the Mission Panel (left tool panel).

---

## Project cards

Each project is shown as a card displaying:

- **Project name** — the `name:` field from `raccoon.project.yml`
- **UUID prefix** — the first 8 characters of the project UUID for quick identification
- **Pi address** — the IP and optional port of the connected Wombat, or a placeholder when no robot is configured

Click any card to open that project in the main editor (`/projects/:uuid`).

To **delete** a project click the trash icon in the top-right corner of its card. A confirmation dialog appears before anything is removed. Deletion removes the project entry from the IDE backend's known projects; it does not delete files from disk.

---

## Creating a new project

Click the **+** tile (labelled "Add Project") to open a name input field inline. Type a project name and press Enter or click **Create**. Press Escape to cancel without creating.

The IDE backend creates the project directory structure and `raccoon.project.yml`. You can then open the new project and configure it via the [Robot panel](../06-floating-panels/#robot-panel) and Settings.

---

## Local backend port

The Projects List page shows a **Backend Port** field in the header. This lets you point the Web IDE at a different local IDE backend port if you are running multiple instances or using a non-default port. Type a port number and press Enter. The selected port is persisted in `localStorage` as `localBackendPort`.

The default port is **4200** (set by `raccoon web --port 4200`). The Angular dev server (`npm start`) runs on port 4300 and proxies to the backend on 4200.

---

## Multi-project collision comparison

When you have two or more projects open, the **Compare** button (arrows icon) in the page header opens the **Collision Comparison** dialog. This tool loads the simulated paths of multiple projects onto a shared table map and detects points where robots would occupy the same space at the same time.

### What it does

- Loads the planned path (sequence of poses derived from mission step simulation data) for each selected project
- Renders all paths simultaneously on a shared canvas using a color-coded palette
- Detects time-overlapping spatial collisions between robot footprints
- Provides a timeline scrubber so you can step through the joint run second by second
- Lists every detected collision event with a "Jump to" button that sets the scrubber to that moment

### Opening the dialog

1. Navigate to the Projects List page
2. Click **Compare** in the header (disabled when fewer than two projects exist)
3. In the dialog, use the multi-select dropdown to choose which projects to compare (two or more)
4. Select which project's map to use as the background (the **Map from** selector)

### Reading the canvas

| Visual element | Meaning |
|---------------|---------|
| Colored path line | Planned path of one project; color matches the project's entry in the legend |
| Filled circle at path start | Start position |
| Open circle at path end | End position |
| Orange dot | Detected collision location |
| Red dot (larger) | Currently selected collision |
| Robot rectangle | Robot footprint at the current scrubber time |
| Direction arrow | Robot heading at that moment |

### Collision list

Below the canvas the dialog shows a list of detected collision events. Each entry displays the two projects involved and the time into the run. Click **Jump to** to set the preview scrubber to that exact time so you can inspect the robot positions on the canvas.

### Caveats

- Collision detection uses simulated path data, not live robot telemetry. If your actual robot deviates from its planned path the real collision behavior may differ.
- The simulation data must be available for each project. If a project has no simulation data (no missions with path steps) it will show a load error.
- Path timing is derived from the step-by-step simulation; missions with non-deterministic timing (e.g. sensor-triggered moves) will show the planned timing, not measured timing.
- The tool requires at least two projects to be selected before it can run.
