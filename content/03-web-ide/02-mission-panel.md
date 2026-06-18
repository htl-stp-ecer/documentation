---
title: "Mission Panel (Left)"
author: "Tobias Madlberger"
date: 2026-06-18
draft: false
weight: 3
---

## Mission Panel (Left)

The Mission Panel lists every mission in your project and lets you navigate between them. Toggle it open with the list icon at the top of the left tool stripe.

### Opening the panel

Click the **list** icon at the top of the left tool stripe. The panel slides open on the left side of the center editor. Click it again (or the minus button in the panel header) to collapse it.

### Mission list structure

Missions are displayed in execution order, partitioned into three groups:

| Group | Flag | Position in list |
|-------|------|-----------------|
| **Setup missions** | `is_setup: true` | Always at the top |
| **Regular missions** | neither flag | Middle, sorted by `order` number |
| **Shutdown missions** | `is_shutdown: true` | Always at the bottom |

Any mission can be marked as a setup or shutdown mission — there is no special reserved name. If you need a mission that runs before the match starts, mark it `is_setup: true` via `raccoon create mission --setup <Name>` or by editing `raccoon.project.yml`. Similarly, `is_shutdown: true` marks a mission to run after the match ends.

This is a boolean flag on each mission, not a magic order number. Multiple setup missions are allowed (sorted among themselves by `order`).

### Selecting a mission

Click a mission row to load it into the flowchart editor (and code view). The selected mission is highlighted.

### Adding a mission

Click **+ Add Mission** at the bottom of the panel, or use the plus button in the panel header. A dialog prompts for the new mission's name.

### Renaming and deleting a mission

Right-click any mission to open the context menu:

- **Rename** — opens a rename dialog where you type the new class name. The file is renamed on disk and all references are updated.
- **Delete** — removes the mission from the project. This is irreversible from the UI.

### Reordering missions

Missions can be reordered interactively in the panel. Setup missions are pinned to the top and shutdown missions to the bottom; only the middle group can be freely reordered. The `order` field in `raccoon.project.yml` is updated automatically.

You can also reorder from the CLI:

```bash
raccoon reorder missions
```

### Back to Projects

The **Back to Projects** link inside the Mission Panel navigates to `/projects` (the local projects list), exiting the current project view.
