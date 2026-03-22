---
title: "Web IDE"
author: "Tobias Madlberger"
date: 2026-03-22
draft: false
weight: 1
---

# Web IDE

The Web IDE is a browser-based visual environment for building missions, configuring your robot's physical layout, and running/debugging programs. It runs locally on your laptop and connects to your robot over the network.

## Starting the Web IDE

From inside your project folder:

```bash
raccoon web
```

This starts a local server and opens the Web IDE automatically in your browser. The URL will look like:

```
http://localhost:4200/WebIDE/projects/<your-project-uuid>
```

---

## Interface Overview

![Web IDE tour](/images/web-ide/webide-tour.gif)

The Web IDE has a **three-panel layout**:

| Panel | Location | Purpose |
|-------|----------|---------|
| **Mission Panel** | Left | List of all missions, add/remove missions |
| **Flowchart Editor** | Center | Visual flowchart builder for the selected mission |
| **Step Library** | Right | Searchable list of all available steps, drag into flowchart |

The **top bar** shows the connected device name, IP address, and a live connection indicator (green = online, red = offline).

---

## Mission Panel (Left)

Lists every mission in your project. Each mission shows its execution order number and name. The `SetupMission` is always present (order `-1`) and runs before the match starts.

- Click a mission to open it in the flowchart editor
- Click **+ Add Mission** at the bottom to create a new mission
- Drag missions to reorder them (order determines execution sequence during the match)

---

## Flowchart Editor (Center)

The main workspace. Each mission is represented as a visual flowchart of connected step nodes.

![Flowchart editor with SetupMission](/images/web-ide/webide-flowchart.png)
> *TODO: add screenshot — SetupMission showing Start → calibrate → wait_for_button*

**Nodes** represent steps (e.g. `calibrate`, `drive_forward`, `wait_for_button`). Each node shows its step name and any editable arguments inline.

**Connections** show the execution order — arrows flow from top to bottom (vertical layout) or left to right (horizontal layout).

### Editing

- **Add a step**: Drag from the Step Library (right panel) onto the canvas
- **Connect steps**: Drag from the output dot of one node to the input dot of another
- **Edit arguments**: Click on an argument field directly on the node
- **Delete**: Select a node and press Delete
- **Undo / Redo**: Buttons in the toolbar, or Ctrl+Z / Ctrl+Y

### Toolbar

| Button | Function |
|--------|---------|
| ⚙ (gear) | Open Settings modal |
| ↩ ↪ | Undo / Redo |
| 🕐 | Toggle Timing panel (step execution durations) |
| 🗺 | Toggle Table Visualization panel (robot path on table) |
| 📋 | Toggle Run Logs panel |
| **Sim** | Toggle simulation mode for runs |
| ▶ (green) | Run the current mission |
| ⚙ (green) | Device settings |

---

## Step Library (Right)

A searchable panel listing all steps available from libstp. Steps are grouped by category (motion, sensors, calibration, etc.).

- **Filter** by typing in the search box at the top
- **Drag** any step onto the flowchart canvas to add it to the mission

> **Note:** The step library requires the device to be online. When offline, it shows "No cached steps yet." Connect to the robot first, then use **Re-index now** in Settings → Project to populate the library.

---

## Settings Modal

Open with the ⚙ gear icon in the top-left of the toolbar. Has five tabs:

### Project Tab

![Settings - Project tab](/images/web-ide/webide-settings-project.png)
> *TODO: add screenshot*

| Setting | Description |
|---------|-------------|
| **Orientation** | Flowchart direction: **Vertical** (top-to-bottom) or **Horizontal** (left-to-right) |
| **Auto Layout** | Automatically arrange nodes on the canvas |
| **Step Indexing** | Cache libstp steps from the connected device. Click **Re-index now** to refresh after updating raccoon. |

### Robot Tab

![Settings - Robot tab](/images/web-ide/webide-settings-robot.png)
> *TODO: add screenshot*

This is the most important tab for correct robot behaviour. Configure it before running any missions that use sensors or precise movement.

#### Sensors

If your robot has IR sensors, analog sensors, or other positional sensors defined in `config/hardware.yml`, you must place them on the virtual robot diagram here.

1. Select a sensor from the list on the left
2. The right side shows a top-down view of your robot (dimensions in cm)
3. Drag the sensor icon to match its physical position on the real robot
4. Set any clearance values if required

Getting this wrong will cause lineup and line-following steps to behave incorrectly.

#### Rotation Center

The point your robot physically rotates around — for a differential drive robot, this is the midpoint between the two driven wheels.

The default is `7.5 × 7.5 cm` (center of a 15×15 cm robot). Adjust to match your robot's actual rotation center.

Getting this wrong will cause `turn_left()` / `turn_right()` to produce incorrect arcs.

#### Drivetrain

| Field | Description |
|-------|-------------|
| **Type** | `Differential` or `Mecanum` |
| **Track width** | Distance between left and right wheels (cm) |
| **Wheel radius** | Radius of the driven wheels (cm) |

These mirror the values in `config/robot.yml` and are kept in sync.

### Map Tab

![Settings - Map tab](/images/web-ide/webide-settings-map.png)
> *TODO: add screenshot*

A canvas editor for the competition table (200×100 cm by default).

- **Draw lines**: Select line type (Black line, White line, etc.) and draw directly on the canvas — these represent the lines your robot will follow or line up on
- **Load Map**: Upload a background image (photo of the actual table)
- **Units**: Switch between cm and mm
- Zoom controls for precision editing

The lines you draw here are used by the Table Visualization panel to show your robot's planned path relative to the table layout.

### Start Tab

![Settings - Start tab](/images/web-ide/webide-settings-start.png)
> *TODO: add screenshot*

Sets the robot's starting position and orientation on the table.

| Field | Description |
|-------|-------------|
| **X (cm)** | Starting X position from left edge of table |
| **Y (cm)** | Starting Y position from bottom edge of table |
| **Rotation (deg)** | Starting heading in degrees |

You can also **click directly on the table canvas** to place the robot visually.

### Keybindings Tab

Assign keyboard shortcuts to frequently used steps. Requires a modifier key (Ctrl, Alt, Cmd) or a function key (F1–F12). Steps you've used recently appear under **Recent Steps** for quick binding.

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

---

## Running a Mission

1. Select a mission in the left panel
2. Click the green **▶ Run** button in the toolbar
3. Output streams live in the Run Logs panel
4. Press the stop button (or Ctrl+C in the terminal) to stop

By default, runs execute in **Sim** (simulation) mode — the mission logic runs but motor commands are suppressed. Toggle **Sim** off to run on the real robot.

> **Note:** Running from the Web IDE does NOT create checkpoints or sync files the way `raccoon run` does. For competition runs, use `raccoon run` from the terminal.

---

## Projects List

Click **Back to Projects** in the top-left to return to the projects list view, which shows all raccoon projects found on your laptop.
