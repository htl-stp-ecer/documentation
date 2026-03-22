---
title: "Raccoon CLI"
author: "Florian Schwanzer"
date: 2026-03-19
draft: false
weight: 1
---

# Raccoon CLI

raccoon-cli is the command-line tool for managing robot projects. It handles everything from project scaffolding to running code on the robot.

## Command Overview

| Command | What it does |
|---------|-------------|
| `raccoon create project <name>` | Scaffold a new project |
| `raccoon create mission <name>` | Add a new mission to the current project |
| `raccoon connect <ip>` | Connect to a robot (sets up SSH auth, saves config) |
| `raccoon disconnect` | Remove the saved connection |
| `raccoon run` | Sync, generate code, and run the project on the robot |
| `raccoon sync` | Push/pull files between laptop and robot |
| `raccoon codegen` | Generate `defs.py` and `robot.py` from YAML config |
| `raccoon wizard` | Interactive hardware configuration wizard |
| `raccoon update` | Update raccoon on both laptop and robot |
| `raccoon status` | Show current connection and project info |
| `raccoon calibrate` | Run motor calibration routine |
| `raccoon web` | Start the Web IDE |
| `raccoon list projects` | List all raccoon projects |
| `raccoon list missions` | List missions in the current project |
| `raccoon remove project <name>` | Delete a project |
| `raccoon remove mission <name>` | Remove a mission from config |

All commands support `-h` / `--help` for usage details.

## Installation

See the [Quick Start]({{< ref "/00-quick-start" >}}) for install instructions.

**Requires Python 3.11+.**
