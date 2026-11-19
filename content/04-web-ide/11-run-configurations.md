---
title: "Run Configurations"
author: "Raccoon Docs Team, Mario Scholze"
date: 2026-11-19
draft: false
weight: 14
description: "The Run Configurations dialog of the WebIDE: select, edit, duplicate and remove configurations."
---

# Run Configurations

The WebIDE and the `raccoon run` command share the same run configurations, stored in `raccoon.project.yml`. What a configuration is, the builtin presets, all fields and the YAML format are explained in [Run Configurations]({{< ref "/01-programming-guide/01-basics/04-run-configurations.md" >}}). This page covers the dialog.

You select a configuration in the navbar dropdown before pressing Run, see [Running a Mission]({{< ref "/04-web-ide/07-running-a-mission.md" >}}). The `simulated` preset is selected when you first open a project, and it is the only place where it runs the simulator.

## Opening the dialog

1. Click the run-configuration chip in the navbar. It shows the current name and a down-arrow.
2. Choose **Edit Configurations…** at the bottom of the dropdown.

The dialog shows all configurations in the left pane and the settings of the selected one in the right pane.

## Left pane: the list

- Each entry shows its name. Builtin presets carry a `builtin` badge.
- **+** adds a new blank configuration.
- **Duplicate** copies the selected one with the suffix `-copy`.
- **Remove** deletes the selected one. For a builtin this adds its name to `hidden_run_configurations:`, so neither the CLI nor the IDE shows it until you add a new entry with the same name.
- **Reset to builtin** appears when you have overridden a builtin and restores the original preset.

## Right pane: the editor

- **Name:** editable. Renaming a builtin creates a new user entry.
- **Description:** shown as a tooltip in the dropdown.
- **Target:** `auto`, `local`, `remote` or `simulated`.
- Checkboxes for `dev`, `no_calibrate`, `no_checkpoints`, `no_codegen`, `no_sync` and `record_localization`.
- **Record Hz:** a number field, shown when `record_localization` is on.
- **Extra args:** space-separated command line arguments.
- **Environment variables:** `KEY=VALUE`, one per line.

A live **YAML preview** shows the snippet that would be written for the selected configuration. Builtins you have not changed show a note that nothing is saved. Copy the snippet to reuse a configuration in another project.

## Saving

Click **Save**. The dialog removes the configurations you deleted (and writes the tombstones for removed builtins), saves all your own configurations, reloads the list and closes. The change is in `raccoon.project.yml` and available to `raccoon run` right away.

## Related pages

- [Running a Mission]({{< ref "/04-web-ide/07-running-a-mission.md" >}})
- [Localization Replay]({{< ref "/04-web-ide/12-localization-replay.md" >}}): `record_localization: true` enables recording
