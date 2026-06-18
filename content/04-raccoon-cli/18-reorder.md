---
title: "reorder missions"
author: "Raccoon Docs Team"
date: 2026-06-18
draft: false
weight: 19
---

# raccoon reorder missions

```bash
raccoon reorder missions [ORDER...]
```

Changes the execution order of missions in your project and automatically renumbers all mission files, class names, and imports to match the new order. Use it when you want to rearrange missions without manually editing YAML and renaming files by hand.

## Why this is necessary

Mission files use a naming convention where the numeric prefix encodes execution order: `m010_drive_mission.py` → `M010DriveMission`. This prefix appears in three places simultaneously — the filename, the class name inside the file, and the import in `src/main.py`. Manually reordering missions means updating all three consistently across potentially many files. `raccoon reorder missions` does this atomically with a two-phase rename to avoid conflicts when two missions swap numbers.

> Before reordering, commit or create a checkpoint. The operation modifies multiple files and is easier to verify if you can diff the result.

## Why renumbering matters

Mission files follow a strict naming convention: `m010_drive_forward_mission.py` contains the class `M010DriveForwardMission`. The numeric prefix determines execution order. When missions are reordered, their prefix numbers must be updated consistently across:

- The file name (`src/missions/m???_<name>_mission.py`)
- The class declaration inside the file (`class M???<Name>Mission`)
- The import in `src/main.py` (`from .missions.m???_<name>_mission import M???<Name>Mission`)
- The `missions:` list in `raccoon.project.yml`

`raccoon reorder missions` performs all four updates atomically. The renumbering scheme is:
- **Setup mission** (role `setup`) → always `M000`
- **Shutdown mission** (role `shutdown`) → always `M999`
- **Regular missions** → `M010`, `M020`, `M030`, … (10-step spacing)

## Synopsis

```bash
raccoon reorder missions              # interactive TUI
raccoon reorder missions 1 3 2        # non-interactive, by 1-based index
raccoon reorder missions M010Drive M000Setup M020Return  # by class name
```

---

## Interactive TUI (no arguments)

Running without arguments opens a terminal UI:

```
  up/down move  .  SPACE grab/drop  .  ENTER save  .  ESC cancel

   1.  M000SetupMission      [pinned]
  > 2.  M010DriveForwardMission
   3.  M020ReturnMission
   4.  M030ScoreMission
   5.  M999ShutdownMission   [pinned]
```

### Controls

| Key | Action |
|-----|--------|
| Up / Down arrows | Move the cursor |
| **Space** | Grab the selected mission (it moves with the cursor); press Space again to drop |
| **Enter** | Save the current order and exit |
| **Escape** or **Ctrl-C** | Cancel without saving |

### Pinned missions

Missions with role `setup` and `shutdown` in `raccoon.project.yml` are **pinned** at the top and bottom of the list and cannot be moved. They are shown with `[pinned]` and are skipped when you grab/drop.

A mission is pinned when its entry in `raccoon.project.yml` is a dict with the role value:

```yaml
missions:
  - {M000SetupMission: setup}       # pinned at top
  - M010DriveForwardMission
  - M020ReturnMission
  - {M999ShutdownMission: shutdown}  # pinned at bottom
```

Only regular missions between setup and shutdown can be reordered.

---

## Non-interactive — by index

```bash
raccoon reorder missions 2 3 1
```

Specify the new order as a space-separated list of **1-based integer positions** of the current order. All positions must be included exactly once (it must be a complete permutation).

Example: if you have missions `[A, B, C]` and run `raccoon reorder missions 2 3 1`, the result is `[B, C, A]`.

Pinned setup/shutdown missions are **included** in the index count. Pass their positions as part of the permutation (they will not actually be renumbered from M000/M999).

---

## Non-interactive — by class name

```bash
raccoon reorder missions M010Drive M000Setup M020Return
```

Specify mission class names in the desired order. Names are matched flexibly:

- Case-insensitive
- The `Mission` suffix is optional: `DriveForward` matches `M010DriveForwardMission`
- The `M<nnn>` numeric prefix is optional: `DriveForward` matches `M010DriveForwardMission`
- Partial prefix matching: `Drive` matches `M010DriveForwardMission` if unambiguous

All missions must be included. If a name is ambiguous or missing, the command exits with an error.

---

## What happens after you confirm

1. **Rename plan built** — for each mission, the new class name and file name are computed.
2. **Phase 1: temp rename** — all files that need renaming are moved to a temporary name first (prevents conflicts when two missions swap numbers, e.g. M010 ↔ M020).
3. **Phase 2: final rename** — temp files are moved to their final names; class declarations inside each file are updated.
4. **`src/main.py` patched** — all import statements referencing renamed classes are updated.
5. **`raccoon.project.yml` updated** — the `missions:` list is rewritten with the new class names and roles preserved.

The command prints each rename as it happens:

```
  m010_drive_forward_mission.py → m020_drive_forward_mission.py
  m020_return_mission.py → m010_return_mission.py

✓ Mission order updated and renumbered.
```

---

## Example: reordering 3 regular missions

Before reorder, `raccoon.project.yml`:

```yaml
missions:
  - {M000SetupMission: setup}
  - M010DriveForwardMission
  - M020ReturnMission
  - M030ScoreMission
  - {M999ShutdownMission: shutdown}
```

Run:

```bash
raccoon reorder missions 1 4 3 2 5
# (keep setup, move Score to 2nd, Return to 3rd, DriveForward to 4th, keep shutdown)
```

After reorder, `raccoon.project.yml`:

```yaml
missions:
  - {M000SetupMission: setup}
  - M010ScoreMission
  - M020ReturnMission
  - M030DriveForwardMission
  - {M999ShutdownMission: shutdown}
```

Files renamed:
- `m010_drive_forward_mission.py` → `m030_drive_forward_mission.py`
- `m020_return_mission.py` → `m020_return_mission.py` (unchanged — same slot)
- `m030_score_mission.py` → `m010_score_mission.py`

---

## Notes and gotchas

- **Git recommended** — the rename operation modifies multiple files. Commit or stash before running so you can revert if something goes wrong.
- **One mission only** — if the project has only one (regular) mission, the command renumbers it to `M010` and exits without opening the TUI.
- **Only pinned entries** — if all missions are pinned (setup + shutdown only), the command exits with "Nothing to reorder".
- **The rename is local** — this command only modifies files on your laptop. Run `raccoon sync` or `raccoon run` afterwards to push the changes to the Pi.
