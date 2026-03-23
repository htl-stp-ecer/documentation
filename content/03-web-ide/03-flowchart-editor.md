---
title: "Flowchart Editor (Center)"
author: "Tobias Madlberger"
date: 2026-03-22
draft: false
weight: 4
---

## Flowchart Editor (Center)

The main workspace. Each mission is represented as a visual flowchart of connected step nodes.

![Flowchart editor with SetupMission](/images/web-ide/webide-flowchart.png)

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
