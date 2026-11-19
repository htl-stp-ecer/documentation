---
title: "missions"
author: "Mario Scholze"
date: 2026-11-19
draft: false
weight: 14
description: "Create, list, rename, remove and reorder the missions of a project."
---

# raccoon mission

```bash
raccoon mission <create|list|rename|remove|reorder>
```

`raccoon mission` replaces the old `raccoon create mission`, `raccoon list`, `raccoon remove` and `raccoon reorder`. raccoon no longer creates projects: a project is a git repository made by the setup script, and the CLI is used inside the project's own environment. The same operations power the WebIDE, so both always agree.

A mission `M010DriveToPoleMission` lives in `src/missions/m010_drive_to_pole_mission.py`. The number is part of the order: `M000` is the setup mission, `M999` the shutdown mission, and everything in between runs in ascending number.

## create

```bash
raccoon mission create DriveToPole              # gets the next free number
raccoon mission create Drive Collect M500Wave   # several at once
raccoon mission create M010DriveToPole          # explicit number
```

The `Mxxx` prefix is **optional**. Without one, the mission gets the next multiple of 10 above the highest existing number (`M010`, `M020`, ... up to `M990`). After `M990` the command asks for an explicit prefix, for example `M995Name`. With a prefix you choose the position yourself.

A prefix must have exactly three digits (`M030`, not `M30`). `M000` and `M999` are reserved for setup and shutdown, and a number that is already used is refused. All names are checked before anything is created. A trailing `Mission` in the name is added to the class automatically.

## list

```bash
raccoon mission list
```

A table with number, class, file and type (setup, mission, shutdown).

## rename

```bash
raccoon mission rename M010 CollectPoles
raccoon mission rename M010DriveToPole CollectPoles
```

Keeps the mission's number. The file and class are renamed and references in `src/` are patched in one pass. The mission can be given by its **`Mxxx` prefix alone**, by its name with or without prefix and suffix; an ambiguous name is an error that lists the candidates.

## remove

```bash
raccoon mission remove M010
raccoon mission remove M010 --keep-file     # only take it out of the project config
```

## reorder

```bash
raccoon mission reorder                      # interactive
raccoon mission reorder M030 M010 M020       # explicit order
```

Renumbers `M000`, `M010`, `M020` ... and moves the files in two phases so nothing collides. Names can be the `Mxxx` prefix alone.

## Related pages

- [Missions]({{< ref "/01-programming-guide/01-basics/07-missions.md" >}})
- [Project structure]({{< ref "/01-programming-guide/01-basics/02-project-structure.md" >}})
