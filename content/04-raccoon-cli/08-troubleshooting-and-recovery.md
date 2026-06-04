---
title: "Troubleshooting And Recovery"
author: "OpenAI Codex"
date: 2026-05-28
draft: false
weight: 8
description: "Source-verified recovery playbooks for raccoon connect, sync, run, update, logs, services, and migrations."
---

# Troubleshooting And Recovery

This page documents the practical failure paths that the current `raccoon-cli` actually supports recovering from.

It is intentionally operational. The question here is not "what does the happy path look like?" The question is "what do you do when the robot, server, project, or versions are already in a bad state?"

Source of truth:

- [update.py](/media/tobias/TobiasSSD/projects/Botball/raccoon/toolchain/raccoon_cli/commands/update.py)
- [status.py](/media/tobias/TobiasSSD/projects/Botball/raccoon/toolchain/raccoon_cli/commands/status.py)
- [logs.py](/media/tobias/TobiasSSD/projects/Botball/raccoon/toolchain/raccoon_cli/commands/logs.py)
- [migrate.py](/media/tobias/TobiasSSD/projects/Botball/raccoon/toolchain/raccoon_cli/commands/migrate.py)
- [project_services.py](/media/tobias/TobiasSSD/projects/Botball/raccoon/toolchain/raccoon_cli/project_services.py)

## First-response checklist

When something feels broken, start here:

```bash
raccoon status
raccoon update --check
raccoon migrate --dry-run
```

That separates most failures into three buckets:

- connection / Pi reachability
- package version drift
- project schema drift

## `raccoon status` says not connected

Symptoms:

- no Pi connection panel
- remote project status missing
- Pi package versions unavailable

What `status` actually does:

- tries to auto-connect from the current project connection config first
- otherwise tries the first known Pi
- if that fails, it falls back to "not connected"

Recovery:

```bash
raccoon connect <pi-address>
raccoon status
```

If you are not inside a project, `status` can still show known Pis and package data, but it cannot resolve project-specific remote state.

## The Pi is reachable, but `raccoon-server` is down

This is an important distinction.

`raccoon update` has an explicit fallback path for this case:

- it first tries the normal server-backed connection
- if that fails, it tries direct SSH-only mode

The CLI even prints this state explicitly:

- `Connected via SSH only — raccoon-server is down.`

Practical workflow:

```bash
raccoon update --pi-only
```

Why this matters:

- the robot may still be recoverable without a working HTTP API
- package updates can repair a broken server install

If both normal connection and direct SSH fail, you are no longer in a CLI-level recovery path. At that point it is a network, credentials, or robot-OS problem.

## `raccoon update` shows packages “ahead of bundle”

This is not automatically an error.

Current behavior:

- packages newer than the target bundle are shown as ahead
- they are skipped by default
- they are only downgraded if you use `--force`

Typical responses:

```bash
raccoon update
```

Use that when you want to keep newer components and only bring older ones forward.

```bash
raccoon update --force
```

Use that when you want to force the machine back onto the exact bundle versions.

```bash
raccoon update --dev
```

Use that when you intentionally want to follow the dev manifest instead of the stable one.

## A bundle version exists, but PyPI does not have that wheel yet

This is a real failure mode and the CLI has a dedicated escape hatch:

```bash
raccoon update --allow-missing-pypi-version-fallback
```

What it means:

- the bundle asked for a version
- PyPI did not have that exact release
- the CLI may fall back to the latest available PyPI version instead

Use this deliberately. It trades strict bundle reproducibility for "get this machine working again."

## `raccoon run` warns about project format or refuses to run

There are two different cases.

### Case 1: your project is behind available migrations

This is usually a warning, not a hard stop.

Recovery:

```bash
raccoon migrate
```

Preview first if you want:

```bash
raccoon migrate --dry-run
```

### Case 2: your project is below `raccoon.MIN_FORMAT_VERSION`

This is a hard compatibility stop. The runtime library is saying "this project schema is too old for this installation."

Recovery:

```bash
raccoon migrate
```

If migration itself fails, treat that as a project-layout repair problem, not a runtime problem.

## `raccoon migrate` fails mid-run

Current behavior:

- migrations are loaded in numeric order
- after each successful migration, `format_version` is written back into `raccoon.project.yml`
- on failure, the command exits immediately

Consequences:

- your project may be partially migrated
- the recorded `format_version` reflects the last migration that completed successfully, not the one that failed

Practical recovery:

1. Read the failing migration message carefully.
2. Inspect the files that migration touches.
3. Fix the concrete schema/content problem.
4. Re-run `raccoon migrate`.

Do not blindly hand-edit `format_version` upward just to silence the tool. That only hides the mismatch.

## `raccoon logs` has no useful output

You need to distinguish local and remote logs.

Default behavior:

- `raccoon logs` fetches logs from the connected Pi

Local behavior:

```bash
raccoon logs --local
```

or:

```bash
raccoon logs --local --dir /path/to/.raccoon/logs
```

If local log discovery fails, the CLI expects either:

- a `.raccoon/logs/` directory under the current project
- or an explicit `--dir`

## `raccoon logs services` fails or shows nothing

This command is remote-only because project services are systemd units on the Pi.

If you run it with `--local`, the CLI intentionally refuses.

Useful commands:

```bash
raccoon logs services
raccoon logs services show <service-name>
```

What the service list shows:

- active state
- sub-state
- main PID
- restart count
- activation timestamp
- whether the service is marked `required_for_run`

If no services appear at all, that usually means your project has no `services:` section in `raccoon.project.yml`.

## A project service keeps restarting

This is usually not a CLI problem. It is a systemd-supervised process problem.

What the current service deployment model does:

- renders a unit file under `/etc/systemd/system/`
- sets `WorkingDirectory` to the project path
- restarts according to the configured `restart` policy
- logs to journald

Recovery flow:

```bash
raccoon logs services
raccoon logs services show <service-name>
```

Look for:

- import errors
- bad module path
- missing environment variables
- wrong `command` or `module`
- service crash loops after sync

If a service is marked `required_for_run: true`, treat its failure as a run blocker, not as background noise.

## `raccoon update` cannot inspect the Pi at all

Current behavior:

- no known Pi: Pi version checks are skipped
- no SSH access: Pi updates are skipped

Practical interpretations:

- `raccoon update --laptop-only` is still meaningful
- `raccoon status` may still help you repair connection state

If you know the robot is reachable but the CLI has no saved connection:

```bash
raccoon connect <pi-address>
```

Then retry:

```bash
raccoon update --pi-only
```

## Project is on the Pi, but `status` says remote project not found

`status` matches remote projects by the local project's UUID.

That means this can fail because of:

- the project was never synced
- the project was synced under a different UUID
- you duplicated a project and forgot to give it a fresh UUID

Recovery:

```bash
raccoon sync
```

If the wrong project appears to be associated with the same UUID, fix the UUID collision first. Syncing more will not solve a namespace collision.

## Service or run output contains warnings and errors at the end

`raccoon run` intentionally summarizes collected warning/error lines from program output. Do not ignore that summary panel. It is often the fastest route to the real fault.

Typical next step:

```bash
raccoon logs
```

or, if it is a project daemon:

```bash
raccoon logs services show <service-name>
```

## Recommended repair order

When several things are broken at once, do them in this order:

1. Fix connection and SSH reachability.
2. Check package drift with `raccoon update --check`.
3. Repair package installs with `raccoon update`.
4. Repair project schema drift with `raccoon migrate`.
5. Re-run with logs visible.
6. Only then debug mission code or service code.

That order prevents you from debugging user code on top of a broken platform state.
