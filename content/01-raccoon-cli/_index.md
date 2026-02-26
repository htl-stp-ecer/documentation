---
title: "Raccoon CLI"
date: 2024-01-01
draft: false
weight: 2
---

# Raccoon CLI

raccoon-cli is the command-line tool you run on your **laptop** to manage robot projects, configure hardware, sync files to the robot, and run your programs remotely.

All commands follow the pattern `raccoon <command> [arguments]`.

## Sections

- [Installation]({{< ref "/01-raccoon-cli/00-installation" >}}) — set up raccoon on your laptop and on the robot
- [Managing Projects]({{< ref "/01-raccoon-cli/01-projects" >}}) — create, list, and remove projects and missions
- [Hardware Wizard]({{< ref "/01-raccoon-cli/02-hardware-wizard" >}}) — configure motors, sensors, and drivetrain
- [Code Generation]({{< ref "/01-raccoon-cli/03-code-generation" >}}) — generate hardware files from your configuration
- [Motor Calibration]({{< ref "/01-raccoon-cli/04-calibration" >}}) — tune motor PID parameters automatically
- [Running Projects]({{< ref "/01-raccoon-cli/05-running" >}}) — execute your program on the robot
- [Remote Development]({{< ref "/01-raccoon-cli/06-remote-development" >}}) — connect, sync files, and manage the connection

## Command Overview

| Command | What it does |
|---|---|
| `raccoon create project <name>` | Create a new robot project |
| `raccoon create mission <name>` | Add a mission to the current project |
| `raccoon list projects` | List all projects in the current directory |
| `raccoon list missions` | List missions in the current project |
| `raccoon remove mission <name>` | Remove a mission from the current project |
| `raccoon wizard` | Run the interactive hardware configuration wizard |
| `raccoon codegen` | Generate Python hardware files from the YAML config |
| `raccoon calibrate` | Calibrate motor PID and feedforward parameters |
| `raccoon run` | Sync and run the project on the robot |
| `raccoon connect <address>` | Connect to a robot at the given IP address |
| `raccoon sync` | Sync changed files to the connected robot |
| `raccoon sync --force` | Re-upload all files regardless of changes |
| `raccoon status` | Show the current connection status |
| `raccoon disconnect` | Disconnect from the robot |
| `raccoon web` | Open the Web IDE in your browser |
