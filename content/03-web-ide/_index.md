---
title: "Web IDE"
date: 2024-01-01
draft: false
weight: 4
---

# Web IDE

The Web IDE is a browser-based environment for building robot missions visually using a flowchart editor. You access it from your laptop while connected to the robot.

---

## Opening the Web IDE

From the command line:

```bash
raccoon web
```

Or open your browser and navigate to:

```
http://<robot-ip>:8421
```

> **[PICTURE: Web IDE home screen showing local projects section and "Connect to Device" input]**

---

## Home Screen

The home screen has three sections:

### Local Projects

Shows the number of projects saved on your laptop. Click **"Open Local Projects"** to browse them.

### Connect to Device

Enter your robot's IP address and click **Connect** to access projects stored on the robot. Previously connected devices are listed below the input field, each showing:

- Device name and IP address
- Online/Offline status indicator (green or red dot)
- Battery voltage or percentage
- A delete button to remove it from the history

> **[PICTURE: Home screen with a connected device card showing green Online status and battery percentage]**

---

## Projects View

### Local Projects Page

Shows all projects stored on your laptop as a grid of cards. Each card shows the project name and a short ID. Click a card to open the project editor. Hover over a card to reveal a delete button.

### Device Projects Page

Shows projects stored on the connected robot. These are **read-only** when accessed from the device view — you cannot edit them directly. To edit, open them as local projects instead.

---

## Project Editor

The editor has three panels:

> **[PICTURE: Full editor view with the three panels labeled — Mission list on left, flowchart in center, step library on right]**

### Left Panel — Mission List

Lists all missions in the project in order:

- **Setup missions** (top, locked) — always run first
- **Main missions** (middle) — can be reordered by dragging
- **Shutdown missions** (bottom, locked) — always run last

Click a mission to open it in the flowchart. Right-click a main mission for a context menu with rename and delete options. Use the **+** button at the bottom of the list to add a new mission.

### Center Panel — Flowchart Editor

The main workspace where you visually design your mission as a flowchart of connected steps.

**Toolbar:**
- **Settings** (gear icon) — project-level settings
- **Undo / Redo** — step back or forward through changes
- **Save indicator** — shows whether there are unsaved changes
- **SIM / REAL toggle** — switch between simulation mode (runs without the robot) and real mode (runs on the robot)

**Canvas:**
- Drag steps from the right panel onto the canvas to add them
- Connect steps by drawing lines between nodes
- Click a step to view and edit its parameters

**Run Log:**
A collapsible panel at the bottom of the canvas shows the output of the last run — useful for seeing print statements and error messages without opening a terminal.

> **[PICTURE: Flowchart canvas with several connected steps and the run log open at the bottom]**

### Right Panel — Step Library

Lists all available step types, organized by category. Each category can be collapsed or expanded. Use the search bar at the top to filter by name.

To add a step to the canvas, drag it from the library to the desired position on the flowchart.

> **[PICTURE: Step library panel with categories expanded and a search term entered]**

---

## Navigation Bar

The top bar is visible on all pages and shows:

- **RACCOON** — click to go back to the home screen
- **Connected device** — hostname and IP address of the robot
- **Status indicator** — Loading / Online / Offline with a color dot
- **Battery** — current battery voltage or percentage
- **Language selector** — change the UI language
- **Dark mode toggle** — switch between dark and light theme

---

## Simulation Mode

Click the **SIM** button in the toolbar to run your mission in simulation mode. The mission executes without sending commands to real hardware — useful for testing logic without the robot nearby.

When **REAL** mode is active, clicking run sends commands to the connected robot.

> **[PICTURE: Toolbar with the SIM/REAL toggle button highlighted]**
