---
title: "logs"
author: "OpenAI Codex"
date: 2026-06-18
draft: false
weight: 11
description: "How raccoon logs actually works: local vs remote runs, filtering, following, sources, clearing, and project services."
---

# raccoon logs

`raccoon logs` is the log browser for both project run logs and project service journald output.

Source of truth:

- [logs.py](/media/tobias/TobiasSSD/projects/Botball/raccoon/toolchain/raccoon_cli/commands/logs.py)

## Two operating modes

By default, `raccoon logs` is remote:

- it talks to the connected Pi
- it fetches run metadata and entries through the server API

Local mode is explicit:

```bash
raccoon logs --local
```

You can also point it at a specific local log directory:

```bash
raccoon logs --local --dir /path/to/.raccoon/logs
```

## Default action: list runs

```bash
raccoon logs
```

lists detected log runs.

Each run summary includes:

- run index
- start time
- duration
- line count
- source files
- per-level counts

Run `#1` is the most recent run.

## Rotated logs

By default, local mode prefers the current `libstp.log`.

Use:

```bash
raccoon logs --all
```

to include rotated log files as well.

## Show one run

```bash
raccoon logs show 1
```

displays the most recent run.

Useful filters:

```bash
raccoon logs show 1 --level error
raccoon logs show 1 --source localization
raccoon logs show 1 --grep "timeout|retry"
```

You can combine them.

By default, output goes through a pager. Disable that with:

```bash
raccoon logs show 1 --no-pager
```

## Tail recent lines

```bash
raccoon logs tail
```

shows the latest lines from the most recent run.

Useful options:

```bash
raccoon logs tail -n 50
raccoon logs tail --level warn
```

## Follow mode

Follow mode is local-only:

```bash
raccoon logs --local tail -f
```

Why:

- local follow watches the actual `libstp.log` file
- remote mode currently fetches snapshots, not a streaming tail

If you ask for `-f` without local mode, the CLI rejects it intentionally.

## Show sources in a run

```bash
raccoon logs sources 1
```

This breaks a run down by source file and level counts.

Use it when a run has many mixed subsystems and you want to know where the noise is coming from first.

## Clear logs

Remote:

```bash
raccoon logs clear
```

Local:

```bash
raccoon logs --local clear
```

Local clear deletes:

- discovered log files
- `step_timing.db` if present

Skip confirmation with:

```bash
raccoon logs clear --yes
```

## Project services

Project services are a separate sub-area of `logs`.

List services on the robot:

```bash
raccoon logs services
```

Show one service's journald output:

```bash
raccoon logs services show vision
```

The service table includes:

- active state
- sub-state
- main PID
- restart count
- activation timestamp
- whether the service is marked `required_for_run`

## Service logs are remote-only

`raccoon logs services` only works against the robot because these are systemd units running on the Pi.

If you try it in local mode, the CLI refuses.

## What counts as a “run”

Run detection is not just "one file per run." The logs module parses entries, groups them into runs, and assigns indices so you can refer to them consistently with `show`, `tail`, and `sources`.

That is why `raccoon logs show 1` means "most recent detected run," not "read the first file in a directory."

## Filters

These filters are supported across run inspection commands:

- `--level`
- `--source`
- `--grep`

`--source` matches by substring, not exact source-file equality.

`--grep` uses regex matching.

## Practical workflows

### See whether the last run died cleanly

```bash
raccoon logs tail -n 50
```

### Find only hard failures

```bash
raccoon logs show 1 --level error --no-pager
```

### Narrow a noisy run to one subsystem

```bash
raccoon logs sources 1
raccoon logs show 1 --source motion
```

### Watch a local log file live on the robot

```bash
raccoon logs --local tail -f
```

### Inspect a crash-looping project daemon

```bash
raccoon logs services
raccoon logs services show <name>
```

## Important distinctions

- run logs are not the same as service journals
- remote mode is API-backed
- follow mode is local-only
- `--all` affects rotated run-log discovery, not service journals

Knowing which one you actually need avoids a lot of dead-end debugging.
