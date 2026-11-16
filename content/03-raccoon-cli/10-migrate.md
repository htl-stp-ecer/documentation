---
title: "migrate"
author: "Tobias Madlberger, Mario Scholze"
date: 2026-11-16
draft: false
weight: 10
description: "Apply pending project format migrations."
---

# raccoon migrate

```bash
raccoon migrate
raccoon migrate --dry-run
raccoon migrate --target 1
```

Brings the layout of your project up to the format the installed raccoon expects. The project records its format as `format_version` in `raccoon.project.yml`. `migrate` applies every migration script with a higher number, in order.

## Not the same as `update`

`raccoon update` and `raccoon migrate` answer two separate questions. `update` brings the **programs** (laptop and robot packages) to the versions of one bundle, and [`raccoon doctor`]({{< ref "/03-raccoon-cli/11-doctor.md" >}}) shows whether they are current. `migrate` brings your **project folder** to the current file layout, and `raccoon migrate --dry-run` shows whether it is current. Up-to-date packages say nothing about the project format, and a migrated project says nothing about the installed packages. Check both before a competition.

## What it does

1. Reads `format_version` from `raccoon.project.yml` (0 if the key is missing).
2. Collects the migrations with a number above that version, up to the target.
3. Prints them as a table:

```
 Pending migrations
 Nr.  Description
 0002 Add uv to pyproject.toml
```

4. Applies them one at a time. After each success, `format_version` is written back immediately.

If a migration fails, the command stops with exit code 1. `format_version` already shows the last successful step, so after fixing the problem you re-run `raccoon migrate` and it continues there.

If nothing is pending, it prints `Already up to date` with the current and latest version.

## Options

| Option | Default | Description |
|--------|---------|-------------|
| `--dry-run` | off | Show the pending migrations and stop without changing anything |
| `-t, --target N` | latest | Apply migrations only up to number `N`, even if higher ones exist |

## Examples

```bash
# What would change?
raccoon migrate --dry-run

# Apply everything
raccoon migrate

# Step through one migration at a time
raccoon migrate --target 1
```

## Where migrations come from

Migrations are numbered scripts that ship inside raccoon (`raccoon_cli/migrations/`). Each has a `NUMBER`, a `DESCRIPTION` and a `run(project_root)` function. You cannot add your own.

`raccoon run` checks the project's `format_version` before it starts and tells you to run `migrate` when the project is behind. See [Troubleshooting and Recovery]({{< ref "/03-raccoon-cli/17-troubleshooting-and-recovery.md" >}}) if a migration fails halfway.
