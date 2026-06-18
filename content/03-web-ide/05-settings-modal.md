---
title: "Settings, Robot Config, and Map Editing"
author: "Tobias Madlberger"
date: 2026-06-18
draft: false
weight: 8
---

## Settings, Robot Config, and Map Editing

A common source of confusion: "where do I configure X?" Robot configuration is split across **three distinct UI surfaces**, each owning a different category of settings. Understanding the split is the key insight:

| Surface | How to open | Owns |
|---------|------------|------|
| **Settings Modal** | ⚙ gear icon in the global navbar | Flowchart orientation, auto-layout, step indexing, keyboard shortcuts |
| **Robot Config Panel** | Box icon in the right tool stripe | Sensor placement, rotation center, drivetrain kinematics |
| **Table panel — Edit map** | Pencil icon in the Table Visualization panel header | Map drawing (lines, walls, background image) |
| **Table panel — Edit start pose** | Flag icon in the Table Visualization panel header | Robot starting position and heading |

---

## Settings Modal

Open with the **⚙ gear icon** in the global navbar (visible only when a project is open). The modal has **two tabs**: **Project** and **Keybindings**.

You can also open the modal from the keyboard:
- `Ctrl+K` / `Cmd+K` jumps directly to the **Keybindings** tab.

### Project Tab

Controls flowchart-level presentation and the step index.

| Setting | Description |
|---------|-------------|
| **Orientation** | Flowchart direction: **Vertical** (↕, top-to-bottom, default) or **Horizontal** (↔, left-to-right). Affects how nodes and connections are laid out on the canvas. |
| **Auto Layout** | When enabled, the flowchart automatically re-arranges nodes when you add or connect steps. Disable this if you want to position nodes manually. |
| **Step Indexing** | Shows the current state of the local step index (status, step count, last indexed date). Buttons: **Refresh** (re-scan steps and update the index) and **Clear** (wipe the index). |

The step index is built and served by the **local IDE backend on your laptop** — it does not require a robot connection. After installing raccoon or adding custom steps, click **Refresh** to update the index.

#### Step index statuses

| Status | Meaning |
|--------|---------|
| `ready` | Index built and available. Shows step count and last-indexed timestamp. |
| `indexing` | Index is being rebuilt. The modal polls every 2 seconds and updates automatically when done. |
| `error` | Indexing failed. Error message is shown in red. |
| empty | Index has never been built. Click **Refresh** to populate. |

### Keybindings Tab

Assign keyboard shortcuts to frequently used steps. Once bound, pressing the shortcut while the flowchart has focus inserts the step at the current selection.

**Requirements:** Each binding must use at least one modifier key (`Ctrl`, `Alt`, or `Cmd`) or be a function key (`F1`–`F12`). Plain letter keys alone are not accepted.

The tab has three sub-tabs:

| Sub-tab | Contents |
|---------|----------|
| **Recent Steps** | Up to 10 most-recently used steps, ordered by usage count. Bindings are easiest to assign here. |
| **All Steps** | Complete list of indexed steps with a filter box. Filter matches on step name only. |
| **Current Bindings** | All active bindings: shortcut → step name. Delete individual bindings or use **Clear All** to reset. |

#### Setting a keybinding

1. Open **Settings → Keybindings**.
2. Find the step (in Recent Steps or All Steps).
3. Click the key icon on the right of the step row. The row enters recording mode (spinner).
4. Press the desired key combination. A preview of the detected shortcut is shown.
5. Click **Save** to confirm, or **Cancel** to abort.

Keybindings are persisted in `localStorage` on the browser. They survive page reloads but are device-local (not stored in the project file).

---

## Robot Config Panel

The Robot Config Panel is a **standalone right-side tool panel**, not part of the Settings Modal. Open it with the **box icon** (robot outline) at the top of the right tool stripe.

This panel is where you describe your robot's physical geometry so the simulation and path-planning features can render it accurately.

### Dimensions

Set the robot's **width** and **length** in centimetres. These values are stored in the project's device configuration and loaded into the table visualization to draw the robot to scale.

### Sensor Placement

If your robot has IR sensors, analog sensors, or other positional sensors, place them on the virtual robot diagram:

1. The panel shows a top-down canvas of your robot body (to scale).
2. Each sensor defined in `config/hardware.yml` appears in the sensor list on the side.
3. **Drag a sensor** from the list onto the robot canvas to position it.
4. The panel shows snap guides (center lines, edge lines) to help with alignment.
5. Set a **clearance value** (cm) if the sensor has a physical standoff distance.

Getting sensor positions wrong causes lineup and line-following steps to behave incorrectly during simulation and path planning.

### Rotation Center

The point the robot physically rotates around — for a differential-drive robot, this is the midpoint between the two driven wheels. It is shown as a crosshair on the robot canvas and can be dragged to the correct position.

Adjust this to match your robot's actual kinematics. Incorrect rotation center values cause simulated turns to produce wrong arcs.

### Drivetrain Kinematics

| Field | Description |
|-------|-------------|
| **Drive type** | `Differential` (two driven wheels) or `Mecanum` (four omni wheels) |
| **Track width** (m) | Distance between the left and right wheels |
| **Wheelbase** (m) | Distance between front and rear axles (Mecanum only) |
| **Wheel radius** (m) | Radius of the driven wheels |

These values mirror the `robot.physical` section of `raccoon.project.yml` and are persisted to the server when you edit them.

---

## Table Map Editing

Map editing lives inside the **Table Visualization** bottom panel, not in the Settings Modal. Open the Table panel with the map icon in the left tool stripe (bottom section).

### Table dimensions

The default table size matches the **Botball game table specification**: 93.08 × 41.70 inches, which is approximately **236.4 × 105.9 cm**. The table cannot be resized from the UI — all coordinate input uses these fixed dimensions.

### Switching to the map editor

The Table Visualization panel header has two action buttons:

| Button | Icon | Function |
|--------|------|---------|
| **Edit start pose** | Flag (🚩) | Toggle start-pose editing mode |
| **Edit map** | Pencil (✏) | Toggle the map editor (TableEditorView) |

Click the **pencil icon** to switch the bottom panel from visualization mode to editing mode. The panel title changes to "Table Editor".

### Map editor tools

Inside the editor:

| Tool | Description |
|------|-------------|
| **Draw** | Draw line or wall segments on the table canvas. Select line type (line or wall) and click-drag to draw. |
| **Select** | Click to select and reposition or delete existing segments. |
| **Measure** | Click two points to measure the distance between them. |

**Line types:**

| Kind | Use |
|------|-----|
| Line | Represents a line the robot will follow or line up on (e.g. black tape). Width is configurable in cm. |
| Wall | Represents a physical obstacle the robot cannot pass through. Used by A* pathfinding. |

Switch between `cm` and `inch` using the unit toggle. Zoom in and out for precision placement.

### Editing start pose

Click the **flag icon** (🚩) in the Table Visualization panel header to enter start-pose editing mode (without switching to map-editing mode). A bar appears above the visualization with three fields:

| Field | Description |
|-------|-------------|
| **X (cm)** | Starting X position, measured from the left edge of the table |
| **Y (cm)** | Starting Y position, measured from the bottom edge of the table |
| **θ (deg)** | Starting heading in degrees (0 = facing right, 90 = facing up) |

You can also **click directly on the table canvas** in start-pose mode to place the robot visually. The X/Y fields update to reflect the click position. Changes are saved to the project automatically (debounced 300 ms after the last edit).

---

## Cross-references

- [Step Library]({{< ref "04-step-library" >}}) — refreshing the step index (Settings → Project tab)
- [Tool Panels]({{< ref "06-floating-panels" >}}) — Table Visualization where map editing lives
- [Run Configurations]({{< ref "11-run-configurations" >}}) — the run-config dialog (separate from Settings)
