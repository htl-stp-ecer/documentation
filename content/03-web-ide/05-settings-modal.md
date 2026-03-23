---
title: "Settings Modal"
author: "Tobias Madlberger"
date: 2026-03-22
draft: false
weight: 6
---

## Settings Modal

Open with the ⚙ gear icon in the top-left of the toolbar. Has five tabs:

### Project Tab

![Settings - Project tab](/images/web-ide/webide-settings-project.png)

| Setting | Description |
|---------|-------------|
| **Orientation** | Flowchart direction: **Vertical** (top-to-bottom) or **Horizontal** (left-to-right) |
| **Auto Layout** | Automatically arrange nodes on the canvas |
| **Step Indexing** | Cache libstp steps from the connected device. Click **Re-index now** to refresh after updating raccoon. |

### Robot Tab

![Settings - Robot tab](/images/web-ide/webide-settings-robot.png)

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

A canvas editor for the competition table (200×100 cm by default).

- **Draw lines**: Select line type (Black line, White line, etc.) and draw directly on the canvas — these represent the lines your robot will follow or line up on
- **Load Map**: Upload a background image (photo of the actual table)
- **Units**: Switch between cm and mm
- Zoom controls for precision editing

The lines you draw here are used by the Table Visualization panel to show your robot's planned path relative to the table layout.

### Start Tab

![Settings - Start tab](/images/web-ide/webide-settings-start.png)

Sets the robot's starting position and orientation on the table.

| Field | Description |
|-------|-------------|
| **X (cm)** | Starting X position from left edge of table |
| **Y (cm)** | Starting Y position from bottom edge of table |
| **Rotation (deg)** | Starting heading in degrees |

You can also **click directly on the table canvas** to place the robot visually.

### Keybindings Tab

Assign keyboard shortcuts to frequently used steps. Requires a modifier key (Ctrl, Alt, Cmd) or a function key (F1–F12). Steps you've used recently appear under **Recent Steps** for quick binding.
