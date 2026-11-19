---
title: "codegen"
author: "Tobias Madlberger, Mario Scholze"
date: 2026-11-19
draft: false
weight: 4
description: "Generate defs.py, defs.pyi and robot.py from raccoon.project.yml."
---

# raccoon codegen

```bash
raccoon codegen
raccoon codegen --only defs
raccoon codegen --no-format
```

Generates the Python files in `src/hardware/` from `raccoon.project.yml` and the `config/*.yml` files. It runs on your laptop and needs no connection to the robot. [`raccoon run`]({{< ref "/03-raccoon-cli/05-run.md" >}}) and [`raccoon upload`]({{< ref "/03-raccoon-cli/06-upload.md" >}}) call it for you; you run it yourself to refresh IDE completion after editing the YAML.

What the generated files contain and why you never edit them is explained in [Code Generator]({{< ref "/01-programming-guide/01-basics/05-code-generator.md" >}}).

## What it does

1. Finds the project and loads its config.
2. Validates the project, unless `--no-validate` is set. A failed validation stops the command before anything is written. See [validate]({{< ref "/03-raccoon-cli/12-validate.md" >}}).
3. Resolves the table map (`.ftmap`) if `robot.physical.table_map` points to one. Only the v2 format is accepted. A missing or old-format file is an error.
4. Generates the files and formats them with `black`.
5. Prints a table of the generated files.

Your project folder is added to the Python path, so your own types (for example a custom sensor class under `src/hardware/`) can be used in the config.

## Options

| Option | Default | Description |
|--------|---------|-------------|
| `--only NAME` | all | Generate only this file: `defs` or `robot`. Can be given several times |
| `--no-format` | off | Skip the `black` formatting |
| `-o, --output-dir DIR` | `src/hardware/` | Write the files to another folder. A relative path is relative to the folder you run the command in |
| `--no-validate` | off | Skip the validation before generating |

## Examples

```bash
# Everything, after editing config/hardware.yml
raccoon codegen

# Only defs.py and defs.pyi
raccoon codegen --only defs

# Both files, without formatting (faster, harder to read)
raccoon codegen --only defs --only robot --no-format

# Look at the output without touching src/hardware/
raccoon codegen -o /tmp/hardware-preview
```

## Errors

The command exits with code 1 and a message if

- you are not inside a project,
- `raccoon.project.yml` is not a mapping,
- validation fails (use `--no-validate` only if you know why),
- the table map file is missing or in the old format.

Unexpected errors are logged with a stack trace.
