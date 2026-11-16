---
title: "validate"
author: "Tobias Madlberger, Mario Scholze"
date: 2026-06-18
draft: false
weight: 12
---

# raccoon validate

```bash
raccoon validate [--no-python-compile]
```

Checks that your project's configuration and source files are internally consistent. Use it to catch drift between `raccoon.project.yml`, mission files, and `src/main.py` before running on the robot.

## When validation runs

`raccoon validate` runs automatically before `raccoon run`. `raccoon upload` validates as its first step, and `raccoon codegen` runs its own validation. Other commands, including `sync`, do not validate. Call `raccoon validate` yourself when you want to check consistency without triggering a run.

## Why it exists

As a project grows — missions are added, renamed, moved, or deleted — it is easy for `raccoon.project.yml` and the file system to drift out of sync. A mission listed in config but missing on disk will cause a runtime failure; a mission file on disk that is not listed in config will silently never run. `raccoon validate` catches these mismatches ahead of time, in your terminal, before you waste time syncing and running.

## Synopsis

```bash
raccoon validate                     # full validation including Python compile
raccoon validate --no-python-compile # skip bytecode compile (faster)
raccoon validate --no-defs-check     # skip the Defs.<name> check
raccoon validate --no-codegen-check  # skip the in-memory code generation check
```

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--no-python-compile` | flag | off | Skip Python syntax check. All other checks still run. Useful when your environment does not match the robot's Python version. |
| `--no-defs-check` | flag | off | Skip checking `Defs.<name>` accesses in your source files against the hardware defined in the config. |
| `--no-codegen-check` | flag | off | Skip the in-memory code generation check. |

## What it checks

`raccoon validate` runs five categories of checks:

| Check | Severity | What it looks for |
|-------|----------|-------------------|
| Required config keys | ERROR | `name` and `uuid` must be present and non-empty in `raccoon.project.yml` |
| Config → files | ERROR | Every mission class name in `missions:` must have a matching file at `src/missions/<snake>_mission.py` |
| Files → config | WARNING | Every `m???_*_mission.py` file under `src/missions/` must be listed in `missions:` |
| `main.py` imports | ERROR / WARNING | Every `from .missions.<module> import <Class>` in `src/main.py` must resolve to a file that exists and a class that is in config |
| Python compile | ERROR | Every `.py` file under `src/` must be free of syntax errors (`py_compile`) |

**ERRORs** abort the command with exit code 1. **WARNINGs** are printed but do not fail.

The naming convention the checker enforces is:
- Class name `M030HelloMission` → file `src/missions/m030_hello_mission.py`
- File `src/missions/m030_hello_mission.py` → expected class `M030HelloMission`

## Output examples

### Clean project

```
✓ Project is consistent — no issues found.
```

### Project with issues

```
⚠ 'src/missions/m040_obstacle_mission.py' exists but 'M040ObstacleMission' is not in config
  Add 'M040ObstacleMission' to raccoon.project.yml or delete the file

✗ Mission 'M050ReturnMission' is in config but 'm050_return_mission.py' does not exist
  Create the file or remove 'M050ReturnMission' from raccoon.project.yml

1 error(s) found. Fix them before proceeding.
```

## Automatic pre-command validation

The CLI automatically runs a validation pass before `raccoon run`.

If the project has validation errors, the auto-validation prints the issues and aborts with exit code 1 **before** the run starts. This prevents you from running a broken project.

### Bypassing auto-validation

To skip the automatic pre-command validation for a single invocation, use the global `--no-validate` flag **before** the subcommand:

```bash
raccoon --no-validate run          # run without validating first
```

`--no-validate` is a flag on the top-level `raccoon` command, not on the subcommand. It must appear before the subcommand name.

This is useful when:
- You are mid-refactor and know the project is temporarily inconsistent.
- You want to run codegen to see what it produces before cleaning up missions.
- The Python compile check flags a version-specific syntax that works on the Pi but not locally.

## Common issues and fixes

| Message | Cause | Fix |
|---------|-------|-----|
| `Missing required project key: 'uuid'` | `uuid:` is blank or absent in `raccoon.project.yml` | Add a UUID: `python3 -c "import uuid; print(uuid.uuid4())"` and paste it |
| `Mission 'M030Foo' is in config but 'm030_foo_mission.py' does not exist` | Mission was deleted from disk but not removed from `missions:` | Remove the entry from `raccoon.project.yml`, or recreate the file with `raccoon create mission` |
| `'src/missions/m030_foo_mission.py' exists but 'M030FooMission' is not in config` | File created manually or left over after a rename | Add the class to `missions:` in `raccoon.project.yml`, or delete the file |
| `main.py imports '...' but '...' does not exist` | Import in `main.py` references a deleted or renamed mission | Update or remove the import in `src/main.py` |
| `Syntax error in src/missions/m030_foo_mission.py` | Python syntax error in the named file | Open the file and fix the syntax error shown in the message |
