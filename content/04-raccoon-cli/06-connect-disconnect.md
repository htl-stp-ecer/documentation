---
title: "connect, disconnect & shell"
author: "Florian Schwanzer"
date: 2026-06-18
draft: false
weight: 7
---

# connect, disconnect & shell

These commands manage the connection between your laptop and the robot (Wombat/Pi).

## raccoon connect

```bash
raccoon connect [OPTIONS] ADDRESS
```

Connect to a Wombat via its IP address or hostname. Sets up SSH key authentication and saves the connection so every subsequent command works automatically.

| Option                   | Description                         | Default |
|--------------------------|-------------------------------------|---------|
| `-p, --port PORT_NUMBER` | Pi server port                      | `8421`  |
| `-u, --user USERNAME`    | SSH username                        | `pi`    |
| `--save / --no-save`     | Save connection to project config   | `--save` |

### Examples

```bash
# Connect to a Wombat with default credentials
raccoon connect 192.168.4.1

# Connect with a custom port and user
raccoon connect -u fox1 --port 8222 192.168.4.1

# Connect without saving (useful for one-off checks)
raccoon connect 192.168.4.1 --no-save
```

When a connection is saved, raccoon writes to two places:

- `config/connection.yml` (inside your project) — used when running commands from this project
- `~/.raccoon/config.yml` — records this Pi globally so `raccoon shell` and `raccoon doctor` can find it without a project

## raccoon disconnect

Removes the current active connection and clears the session state.

```bash
raccoon disconnect
```

This does **not** delete the saved address from `config/connection.yml` or `~/.raccoon/config.yml`. It only drops the in-memory session. To fully reset, also edit those files manually, or run `raccoon connect` to overwrite them with a new address.

## raccoon shell

```bash
raccoon shell
```

Opens a full interactive SSH session to the connected Pi by replacing the current process (`os.execvp`). Once inside, you have a normal shell on the Pi — useful for inspecting logs, checking running processes, or manually running commands.

### Address resolution

`raccoon shell` finds the Pi address in this priority order:

1. The active session (if you ran `raccoon connect` earlier in the same shell)
2. The `connection.pi_address` field in the current project's `raccoon.project.yml`
3. The first known Pi from `~/.raccoon/config.yml`

If no address is found, raccoon prints an error and exits.

### Example

```bash
# Connect first (once), then drop into a shell
raccoon connect 192.168.4.1
raccoon shell

# You are now on the Pi:
pi@raspberrypi:~ $ ps aux | grep raccoon
pi@raspberrypi:~ $ tail -f /var/log/raccoon/server.log
pi@raspberrypi:~ $ exit
```

> `raccoon shell` calls `ssh` from your PATH. Make sure `ssh` is installed (`raccoon doctor` will flag it if not).

