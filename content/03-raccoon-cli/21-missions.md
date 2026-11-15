---
title: "missions"
author: "Tobias Madlberger"
date: 2026-11-02
draft: false
weight: 22
description: "Create, list, rename, remove and reorder the missions of a project."
aliases:
  - /04-raccoon-cli/05-list/
  - /04-raccoon-cli/18-reorder/
  - /04-raccoon-cli/21-missions/
---

# raccoon missions

```bash
raccoon missions <create|list|rename|remove|reorder>
```

`raccoon missions` replaces the old `raccoon create mission`, `raccoon list`, `raccoon remove` and `raccoon reorder`. raccoon no longer creates projects: a project is a git repository made by the setup script, and the CLI is used inside the project's own environment. The same operations power the WebIDE, so both always agree.

A mission `M010DriveToPoleMission` lives in `src/missions/m010_drive_to_pole_mission.py`. The number is part of the order: `M000` is the setup mission, `M999` the shutdown mission, and everything in between runs in ascending number.

## create

```bash
raccoon missions create M010DriveToPole
```

The `Mxxx` prefix is **always required**, so you decide the position. `M000` and `M999` are reserved, and a number that is already used is refused.

## list

```bash
raccoon missions list
```

A table with number, class, file and type (setup, mission, shutdown).

## rename

```bash
raccoon missions rename M010 CollectPoles
raccoon missions rename M010DriveToPole CollectPoles
```

Keeps the mission's number. The file and class are renamed and references in `src/` are patched in one pass. The mission can be given by its **`Mxxx` prefix alone**, by its name with or without prefix and suffix; an ambiguous name is an error that lists the candidates.

## remove

```bash
raccoon missions remove M010
raccoon missions remove M010 --keep-file     # only take it out of the project config
```

## reorder

```bash
raccoon missions reorder                      # interactive
raccoon missions reorder M030 M010 M020       # explicit order
```

Renumbers `M000`, `M010`, `M020` ... and moves the files in two phases so nothing collides. Names can be the `Mxxx` prefix alone.

## Related pages

- [Missions]({{< ref "/01-programming-guide/01-basics/06-missions.md" >}})
- [Project structure]({{< ref "/01-programming-guide/01-basics/01-project-structure.md" >}})
