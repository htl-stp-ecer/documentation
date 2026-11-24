---
title: "format"
author: "Tobias Madlberger, Mario Scholze"
date: 2026-11-24
draft: false
weight: 19
description: "Format your mission code with Black, keeping the layout of seq([...]) and the blank lines between your steps."
---

# raccoon format

```bash
raccoon format [--check]
```

Formats the Python files in your project's `src/` folder so that everybody on the team writes missions the same way. It uses [Black](https://black.readthedocs.io/), adjusted so that the shape of a mission stays readable. The command runs on your laptop and does not need a connection to the robot. Formatting is switched on per project by creating a [`raccoon.formatting.yml`](#configuration-raccoonformattingyml); without that file `raccoon format` only prints a warning.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--check` | flag | off | Report the files that would change and write nothing. Exits with code 1 if any file would change, which makes it usable in CI. |

## Switching it on

`raccoon format` formats a project that has a `raccoon.formatting.yml` in its root. An empty file is enough; every option you leave out takes its default.

Without the file, `raccoon format` and `raccoon format --check` change nothing and print this warning, then exit with code 0:

```
⚠ No raccoon.formatting.yml in this project, so nothing was formatted.
  Create raccoon.formatting.yml (an empty file is enough) to turn formatting on.
```

## Which files are formatted

All `.py` files below `src/`, except the ones that match the `exclude` patterns. By default that is `src/hardware/**`, the folder with the files that [`raccoon codegen`]({{< ref "/03-raccoon-cli/04-codegen.md" >}}) generates. Files with a syntax error are reported and skipped, the other files are still formatted.

## The style

Black decides the layout, with three adjustments for mission code.

**`seq([` stays on one line.** Black alone would move the list onto its own line and indent every step one level deeper. Here the steps keep their indentation:

```python
return seq([
    drive_forward(),
    turn_left(90),
])
```

**Blank lines between steps stay.** Black removes blank lines inside brackets. `raccoon format` keeps them, so you can group steps visually. Several blank lines in a row become one. Blank lines directly after an opening bracket or before a closing one are removed.

**`seq` and `parallel` list one step per line.** However short the steps are, each one gets its own line:

```python
parallel(
    stop_camera(),
    fully_disable_servos(),
    motor_off(Defs.pusher),
)
```

Everything else follows Black: lines are at most 88 characters, strings use double quotes, and a call that fits on one line is joined into one line. To keep any other call spread over several lines, end its argument list with a comma. Black then puts one argument on each line.

### Example

Before:

```python
class M020CollectConesMission(Mission):
    def sequence(self) -> Sequential:
        return seq([
            # drive to the cones
            drive_forward().until(
                over_line(Defs.front.left)
                + after_cm(7)
            ),
            wait_for_background(
                name="prep_arm"
            ),


            # grab and lift
            grab_cone(heading=0),
            parallel(
                stop_camera(), fully_disable_servos(), motor_off(Defs.pusher)
            ),
        ])
```

After:

```python
class M020CollectConesMission(Mission):
    def sequence(self) -> Sequential:
        return seq([
            # drive to the cones
            drive_forward().until(over_line(Defs.front.left) + after_cm(7)),
            wait_for_background(name="prep_arm"),

            # grab and lift
            grab_cone(heading=0),
            parallel(
                stop_camera(),
                fully_disable_servos(),
                motor_off(Defs.pusher),
            ),
        ])
```

## Output

```
reformatted src/missions/m020_collect_cones_mission.py
✓ 1 changed, 11 unchanged
```

With `--check` the first line reads `would reformat ...` and the command exits with code 1 when at least one file would change. Errors in single files are listed with the file name and counted in the summary; they also make the command exit with code 1.

## Configuration: `raccoon.formatting.yml`

`raccoon.formatting.yml` lives in the project root, next to `raccoon.project.yml`. The project is only formatted when the file exists. Every option you leave out takes its default. The file below lists all options with their defaults:

```yaml
auto_format: false                # true: raccoon run formats src/ before it starts
line_length: 88                   # maximum line length
skip_string_normalization: false  # true: keep 'single' and "double" quotes as written
skip_magic_trailing_comma: false  # true: a trailing comma no longer forces one argument per line
hug_brackets: true                # true: seq([ ... ]) keeps its steps at the same indentation
keep_blank_lines: true            # true: blank lines inside brackets are kept (several become one)
explode_calls:                    # calls whose arguments are always one per line
  - seq
  - parallel
exclude:                          # fnmatch patterns, relative to the project root
  - src/hardware/**
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `auto_format` | `bool` | `false` | Formats the project before [`raccoon run`]({{< ref "/03-raccoon-cli/05-run.md" >}}) starts. `raccoon format` itself always formats when you run it. |
| `line_length` | `integer` | `88` | Maximum line length, at least 20. |
| `skip_string_normalization` | `bool` | `false` | Keeps quotes as you wrote them instead of converting to double quotes. |
| `skip_magic_trailing_comma` | `bool` | `false` | Ignores trailing commas, so calls that fit on one line are joined even if they end with a comma. |
| `hug_brackets` | `bool` | `true` | Keeps `seq([` and `])` on the line of the call. With `false`, the list moves to its own indented lines. |
| `keep_blank_lines` | `bool` | `true` | Keeps blank lines inside brackets. With `false`, Black removes them. |
| `explode_calls` | list of strings | `seq`, `parallel` | Names of calls whose arguments are written one per line, however short. Matches plain calls (`parallel(...)`) and method calls (`steps.parallel(...)`). An empty list turns the rule off. |
| `exclude` | list of strings | `src/hardware/**` | [fnmatch](https://docs.python.org/3/library/fnmatch.html) patterns for files to skip, written relative to the project root with `/` as separator. Setting `exclude` replaces the default list, so include `src/hardware/**` again if you still want it excluded. |

Unknown options and values of the wrong type are reported as an error, so a typo such as `line_lenght` does not go unnoticed.

## Formatting before every run

With `auto_format: true`, `raccoon run` formats the project before it validates and runs it. Every file it changes is listed in the output. A file with a syntax error is skipped with a warning, and [validation]({{< ref "/03-raccoon-cli/12-validate.md" >}}) then reports the error. A broken `raccoon.formatting.yml` only produces a warning, and the run continues without formatting.

The global `--no-validate` flag does not affect `auto_format`. Set `auto_format: false` to stop formatting before runs.
