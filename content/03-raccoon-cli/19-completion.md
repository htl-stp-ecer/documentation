---
title: "completion"
author: "Raccoon Docs Team"
date: 2026-06-18
draft: false
weight: 20
---

# raccoon completion

```bash
raccoon completion install [--shell SHELL]
raccoon completion show [--shell SHELL]
```

Installs shell tab-completion for the `raccoon` command. Once installed, pressing **Tab** completes subcommand names, flag names, and in some cases flag values.

## Supported shells

| Shell | Detected automatically | Installation method |
|-------|----------------------|---------------------|
| bash | via `$SHELL` env var | Writes `~/.raccoon-complete.bash` and sources it from `~/.bashrc` |
| zsh | via `$SHELL` env var | Writes `~/.raccoon-complete.zsh` and sources it from `~/.zshrc` |
| fish | via `$SHELL` env var | Writes `~/.config/fish/completions/raccoon.fish` (auto-loaded by fish) |
| PowerShell | Windows default | Writes `~/.raccoon-complete.ps1` and sources it from the PowerShell profile |

## Install tab-completion

```bash
raccoon completion install
```

Auto-detects your current shell and installs the completion script. After installation, either restart your terminal or source your shell config:

```bash
# bash
source ~/.bashrc

# zsh
source ~/.zshrc

# fish — restarts automatically; no action needed
# PowerShell — restart PowerShell
```

To install for a specific shell, use `--shell`:

```bash
raccoon completion install --shell bash
raccoon completion install --shell zsh
raccoon completion install --shell fish
raccoon completion install --shell powershell
```

### What `install` writes

For **bash** and **zsh**, the install command:

1. Generates the completion script and saves it to `~/.raccoon-complete.<shell>`.
2. Appends a `source` line to your RC file (`~/.bashrc` or `~/.zshrc`) if it is not already there:
   ```bash
   # Raccoon CLI completion
   source "/home/you/.raccoon-complete.bash"
   ```

For **fish**, the script is saved to `~/.config/fish/completions/raccoon.fish`. Fish loads all files in this directory automatically — no RC modification needed.

For **PowerShell**, the script is saved to `~/.raccoon-complete.ps1` and a `. "<path>"` line is added to `$PROFILE`.

## Print the completion script (without installing)

```bash
raccoon completion show
raccoon completion show --shell zsh
```

Prints the raw completion script to stdout. Use this if you want to inspect it before installing, or to integrate it manually into your shell config:

```bash
# Manually add to your .bashrc
raccoon completion show --shell bash >> ~/.bashrc
source ~/.bashrc
```

## First-run prompt

On the very first `raccoon` invocation (any command), if completion has not yet been set up, raccoon offers to install it automatically:

```
Shell completion available!
Detected shell: bash

Would you like to enable tab-completion for raccoon? [Y/n]:
```

- Answer **Y** to install immediately.
- Answer **N** to skip. The offer will not be repeated.
- If you skip, install manually later with `raccoon completion install`.

The state of this offer is tracked in `~/.raccoon/cli_state.yml`:

```yaml
completion_offered: true
```

Once this key is set to `true` (either because you were offered or because completion is already installed), the prompt never appears again.

## Checking if completion is installed

Check whether the completion file exists for your shell:

```bash
# bash
ls ~/.raccoon-complete.bash

# zsh
ls ~/.raccoon-complete.zsh

# fish
ls ~/.config/fish/completions/raccoon.fish
```

Or view the current state:

```bash
cat ~/.raccoon/cli_state.yml
```

## Reinstalling after updating raccoon

After upgrading the raccoon package, the completion script may be out of date (new commands or flags may not be recognised). Reinstall it:

```bash
raccoon completion install
```

The script file is overwritten in place. The RC file is not modified again (the `source` line is already there).

## Using completion

Once installed, Tab-completion works for:

- Subcommand names: `raccoon <Tab>` lists all commands.
- Nested subcommands: `raccoon lcm <Tab>` lists `spy`, `record`, `playback`, `list`, `delete`, `status`.
- Flags: `raccoon run --<Tab>` lists all flags for `run`.

Example:

```bash
$ raccoon lc<Tab>
lcm

$ raccoon lcm <Tab>
delete   list   playback   record   spy   status

$ raccoon lcm spy --<Tab>
--channel  --format  --record
```
