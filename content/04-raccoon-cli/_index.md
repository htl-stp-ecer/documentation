---
title: "Raccoon CLI"
author: "Florian Schwanzer"
date: 2026-06-18
draft: false
weight: 1
---

# Raccoon CLI

raccoon-cli is the command-line tool for managing robot projects. It handles everything from project scaffolding to running code on the robot.

## Command Overview

| Command | What it does |
|---------|-------------|
| `raccoon create project <name>` | Scaffold a new project (clones the example repo from GitHub) |
| `raccoon create mission <name>` | Add a new mission to the current project |
| `raccoon connect <ip>` | Connect to a robot (sets up SSH auth, saves config) |
| `raccoon disconnect` | Remove the saved connection |
| `raccoon shell` | Open an interactive SSH shell on the connected Pi |
| `raccoon run` | Sync, generate code locally, and execute the project on the robot |
| `raccoon sync` | Push/pull files between laptop and robot |
| `raccoon codegen` | Generate `defs.py`, `defs.pyi`, and `robot.py` from YAML config |
| `raccoon wizard` | Interactive hardware configuration wizard |
| `raccoon update` | Update raccoon packages on both laptop and robot |
| `raccoon doctor` | Show system health: connection, tools, and package versions |
| `raccoon calibrate` | Run motor calibration routine |
| `raccoon web` | Start the Web IDE |
| `raccoon list projects` | List all raccoon projects |
| `raccoon list missions` | List missions in the current project |
| `raccoon remove project <name>` | Delete a project |
| `raccoon remove mission <name>` | Remove a mission from config |
| `raccoon checkpoint` | Manage invisible git snapshots (list, show, restore, delete, clean) |
| `raccoon reorder missions` | Reorder and renumber missions interactively |
| `raccoon lcm` | LCM traffic inspection (spy, record, playback, list, delete, status) |
| `raccoon migrate` | Apply project schema migrations to update the project format |
| `raccoon validate` | Run project validation checks (config, missions, imports) |

All commands support `-h` / `--help` for usage details.

## Auto-validation

Before every command (except `create`, `connect`, `disconnect`, `update`, `doctor`, `migrate`, `validate`, and `web`), raccoon automatically runs `raccoon validate` against your project. This catches config errors early, before any sync or execution happens.

To bypass auto-validation for a single invocation, use the global `--no-validate` flag:

```bash
raccoon --no-validate run
raccoon --no-validate sync
```

This is useful when you intentionally have an incomplete config and want to force a run anyway.

## Deep Dives

- [Versioning And Upgrades]({{< ref "07-versioning-and-upgrades" >}})
- [Troubleshooting And Recovery]({{< ref "08-troubleshooting-and-recovery" >}})
- [sync]({{< ref "09-sync" >}})
- [logs]({{< ref "10-logs" >}})
- [doctor]({{< ref "11-doctor" >}})
- [checkpoint]({{< ref "12-checkpoint" >}})
- [Run Configurations]({{< ref "13-run-configurations" >}})
- [wizard]({{< ref "14-wizard" >}})
- [validate]({{< ref "15-validate" >}})
- [raccoon-server]({{< ref "16-raccoon-server" >}})
- [lcm]({{< ref "17-lcm" >}})
- [reorder missions]({{< ref "18-reorder" >}})
- [completion]({{< ref "19-completion" >}})

## Installation

See the [Quick Start]({{< ref "/00-quick-start" >}}) for install instructions.

**Requires Python 3.13+.**
