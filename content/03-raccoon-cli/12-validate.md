---
title: "validate"
author: "Tobias Madlberger, Mario Scholze"
date: 2026-11-24
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

`raccoon validate` runs these checks:

| Check | Severity | What it looks for |
|-------|----------|-------------------|
| Required config keys | ERROR | `name` and `uuid` must be present and non-empty in `raccoon.project.yml` |
| Config → files | ERROR | Every mission class name in `missions:` must have a matching file at `src/missions/<snake>_mission.py` |
| Files → config | WARNING | Every `m???_*_mission.py` file under `src/missions/` must be listed in `missions:` |
| `main.py` imports | ERROR / WARNING | Every `from .missions.<module> import <Class>` in `src/main.py` must resolve to a file that exists and a class that is in config |
| Python compile | ERROR | Every `.py` file under `src/` must be free of syntax errors (`py_compile`) |
| Mission length | WARNING | A mission has more steps in its `seq([...])` than `validation.max_mission_steps` allows, or the limit itself is set unreasonably high. See [Mission style checks](#mission-style-checks) |
| Repeated steps | WARNING | The same step or block of steps is written three or more times in a row. See [Mission style checks](#mission-style-checks) |
| Uncommented steps | WARNING | More than six steps in a row have no comment. See [Mission style checks](#mission-style-checks) |

**ERRORs** abort the command with exit code 1. **WARNINGs** are printed but do not fail.

The naming convention the checker enforces is:
- Class name `M030HelloMission` → file `src/missions/m030_hello_mission.py`
- File `src/missions/m030_hello_mission.py` → expected class `M030HelloMission`

## Mission style checks

Three checks look at how your missions are written. They only produce warnings and never fail the command. They read the list in the `return seq([...])` of each mission's `sequence()` in `src/missions/`; steps nested deeper, for example inside a `parallel(...)`, count as part of their parent step. A mission that builds its sequence in another way, such as `return build_everything()`, is skipped.

### Mission length

A mission with more steps than `validation.max_mission_steps` (default `25`) gets a warning:

```
⚠ src/missions/m040_collect_botguy_mission.py has 30 steps in its sequence (validation.max_mission_steps: 25)
  Split the mission into several missions or group steps into sub-sequences
```

Long missions are hard to read and to debug. Split them into several missions, or move a group of steps into a function that returns a `seq([...])`.

You can raise the limit, but a limit above three times the default (75) always produces a warning of its own. That warning cannot be switched off. A value that is not a positive integer is reported and the default is used.

### Repeated steps

When the same step, or the same block of steps, appears three or more times directly after each other, the check suggests a loop:

```
⚠ src/missions/m010_drive_mission.py:12 repeats the same step 3 times in a row
  Use a loop instead: loop_for(<step>, iterations=3)
```

```python
# three identical steps ...
drive_forward(10),
drive_forward(10),
drive_forward(10),

# ... become one
loop_for(drive_forward(10), iterations=3),
```

Steps are compared by what they call and with which arguments; comments and line breaks do not matter. The same step written twice, or in different places of the mission, is not reported. See [Looping]({{< ref "/01-programming-guide/01-basics/07-missions.md" >}}#looping) for `loop_for`.

### Uncommented steps

More than six steps in a row without a comment produce a warning that names the lines:

```
⚠ src/missions/m000_setup_mission.py:38-66 has 9 steps in a row without a comment
  Add a short comment above the steps that explains what this part of the mission does
```

A step counts as commented when a comment stands on the line directly above it or at the end of its first line. A comment covers only that one step, so write one for each part of the mission, not one at the top:

```python
return seq([
    # drive to the cones
    drive_forward().until(over_line(Defs.front.left)),
    grab_cone(heading=0),

    # bring them to the basket
    turn_to_heading_right(90),
    drive_forward().until(after_cm(40)),
])
```

### Options

The limit and the comment check are set in the `validation:` block of `raccoon.project.yml`:

```yaml
validation:
  max_mission_steps: 25         # warn when a mission has more steps
  check_mission_comments: true  # false turns off the "uncommented steps" check
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `validation.max_mission_steps` | `integer` | `25` | Maximum number of steps in a mission's `seq([...])`. A value above 75 produces a warning. |
| `validation.check_mission_comments` | `bool` | `true` | Turns the "uncommented steps" check on or off. |

Without a `validation:` block, or for keys you leave out, the defaults apply. The "repeated steps" check has no option.

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
