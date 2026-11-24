---
title: "Raccoon CLI"
author: "Tobias Madlberger, Mario Scholze"
date: 2026-11-24
draft: false
weight: 30
description: "The raccoon command line tool: connect to the robot, generate code, sync and run your project, inspect logs and keep versions in line."
---

# Raccoon CLI

`raccoon` is the command line tool you use on your laptop. It connects to the robot, generates code from your config, syncs your files and runs your missions on the Pi. Install it with `uv sync` inside a project; see [Create Your Project]({{< ref "/00-getting-started/03-create-a-project.md" >}}). It needs Python 3.13 or newer.

Projects are created with the setup script of the example project, not with the CLI. After that you use `raccoon` from inside the project.

## The developer loop

```mermaid
flowchart LR
    A([connect to Pi]) --> B([edit config and missions])
    B --> C([raccoon run])
    C --> D([codegen on laptop])
    D --> E([sync to Pi])
    E --> F([execute on Pi])
    F --> G([pull changes back])
    G --> H{happy?}
    H -- no --> B
    H -- yes --> I([commit])
    I --> B
```

Code generation and all validation happen on your laptop. The Pi only receives the final Python files, which keeps the loop fast even over a slow WiFi link.

## Commands at a glance

| Command | What it does | Page |
|---------|--------------|------|
| `raccoon connect <ip>` | Link to the robot and set up SSH keys | [connect]({{< ref "/03-raccoon-cli/01-connect.md" >}}) |
| `raccoon disconnect` | Drop the active connection | [disconnect]({{< ref "/03-raccoon-cli/02-disconnect.md" >}}) |
| `raccoon shell` | Open an SSH shell on the Pi | [shell]({{< ref "/03-raccoon-cli/03-shell.md" >}}) |
| `raccoon run` | Checkpoint, generate code, sync, execute, pull back | [run]({{< ref "/03-raccoon-cli/05-run.md" >}}) |
| `raccoon sync` | Push or pull files between laptop and robot | [sync]({{< ref "/03-raccoon-cli/08-sync.md" >}}) |
| `raccoon codegen` | Generate `defs.py`, `defs.pyi` and `robot.py` | [codegen]({{< ref "/03-raccoon-cli/04-codegen.md" >}}) |
| `raccoon mission` | Create, list, rename, remove and reorder missions | [missions]({{< ref "/03-raccoon-cli/14-missions.md" >}}) |
| `raccoon calibrate` | Ticks, autotune, servos and step response | [calibrate]({{< ref "/03-raccoon-cli/07-calibrate.md" >}}) |
| `raccoon logs` | Show, tail, download and clear robot logs | [logs]({{< ref "/03-raccoon-cli/15-logs.md" >}}) |
| `raccoon checkpoint` | Automatic safety snapshots of your project | [checkpoint]({{< ref "/03-raccoon-cli/13-checkpoint.md" >}}) |
| `raccoon validate` | Check config, missions and imports | [validate]({{< ref "/03-raccoon-cli/12-validate.md" >}}) |
| `raccoon format` | Format the code in `src/` with Black | [format]({{< ref "/03-raccoon-cli/19-format.md" >}}) |
| `raccoon doctor` | Health check of tools, connection and versions | [doctor]({{< ref "/03-raccoon-cli/11-doctor.md" >}}) |
| `raccoon update` | Bring laptop and robot to the same bundle | [update]({{< ref "/03-raccoon-cli/09-update.md" >}}) |
| `raccoon migrate` | Apply project format migrations | [migrate]({{< ref "/03-raccoon-cli/10-migrate.md" >}}) |
| `raccoon upload` | Full preflight, then push to the robot and confirm it starts | [upload]({{< ref "/03-raccoon-cli/06-upload.md" >}}) |
| `raccoon web` | Start the WebIDE | [web]({{< ref "/03-raccoon-cli/16-web.md" >}}) |

All commands support `-h` / `--help`. Run `raccoon <command> --help` for the complete list of options of any command.

## Auto-validation

Before `raccoon run`, raccoon runs `raccoon validate` against your project to catch config errors before anything is synced or executed. Other commands do not validate on their own. Run [`raccoon validate`]({{< ref "/03-raccoon-cli/12-validate.md" >}}) yourself, or use [`raccoon upload`]({{< ref "/03-raccoon-cli/06-upload.md" >}}), which validates as its first step.

To skip it for one call, use the global flag:

```bash
raccoon run --no-validate
```

## Reading order

New to the CLI? Read in this order:

1. [connect]({{< ref "/03-raccoon-cli/01-connect.md" >}}): SSH key setup and saved connections
2. [run]({{< ref "/03-raccoon-cli/05-run.md" >}}): the command you use all day
3. [Run Configurations]({{< ref "/01-programming-guide/01-basics/04-run-configurations.md" >}}): parameterize `dev` versus `competition` runs
4. [sync]({{< ref "/03-raccoon-cli/08-sync.md" >}}): what happens under the hood
5. [checkpoint]({{< ref "/03-raccoon-cli/13-checkpoint.md" >}}): the safety net before every run

For maintenance and problems, jump to [update]({{< ref "/03-raccoon-cli/09-update.md" >}}), [migrate]({{< ref "/03-raccoon-cli/10-migrate.md" >}}), [Troubleshooting and Recovery]({{< ref "/03-raccoon-cli/17-troubleshooting-and-recovery.md" >}}), [doctor]({{< ref "/03-raccoon-cli/11-doctor.md" >}}) and [raccoon-server]({{< ref "/03-raccoon-cli/18-raccoon-server.md" >}}) (the daemon on the Pi).

The transport contract check that `connect` and `doctor` report is explained in [Advanced → Transport]({{< ref "/06-advanced/03-transport.md" >}}).
