---
title: "run"
author: "Tobias Madlberger, Mario Scholze"
date: 2026-11-16
draft: false
weight: 5
---

# raccoon run

```bash
raccoon run
```

The command you will use most. On a connected Pi it syncs your project, runs code generation locally, executes the program on the robot, and pulls results back — all in one step.

## How it works

```mermaid
sequenceDiagram
    participant L as Laptop
    participant Pi as Wombat Pi

    L->>L: 1. validate project (raccoon validate)
    L->>L: 2. create git checkpoint (pre-run snapshot)
    L->>L: 3. codegen — generate defs.py, defs.pyi, robot.py
    L->>Pi: 4. push sync — rsync (Linux/macOS) or SFTP (Windows)
    Pi->>Pi: 5. execute src/main.py via raccoon-server
    Pi-->>L: stream stdout live
    L->>L: Ctrl-C or natural exit
    Pi-->>L: 6. pull sync — calibration data, recordings, logs
```

The **codegen happens on the laptop**, not on the Pi. This matters: YAML is never transferred. The Pi only receives ready-to-run Python. If anything is wrong with your YAML, you find out on the laptop before any file transfer happens.

## What it does

The exact sequence depends on whether you are connected to a Pi.

### Remote run (Pi connected — the normal case)

1. **Checkpoint** — creates a local git snapshot of your current files (silent if git is unavailable or the project has no changes)
2. **Codegen** — generates `defs.py`, `defs.pyi`, and `robot.py` from your YAML config **on the laptop**, not on the robot. The generated files land in `src/hardware/` before the next step
3. **Sync (push)** — uploads the project (including the freshly generated hardware files) to the Pi. On Linux and macOS this uses `rsync` over SSH; on Windows it uses SFTP via Paramiko because cwRsync is too unreliable to depend on
4. **Execute** — tells the Pi's `raccoon-server` daemon to run `src/main.py`, streaming output live to your terminal
5. **Sync (pull)** — after the program exits (or you press Ctrl+C), downloads any files written during the run (e.g. calibration data, recordings)

There is **no post-run checkpoint** — only the single pre-run snapshot at step 1.

### Local run

When you are not connected to a Pi, or when you pass `--local`, raccoon skips sync entirely and runs `src/main.py` on your laptop.

## Typical output

```
Checkpoint e4b6191 saved
Syncing 'MyRobot' (pushing to ConeBot)...
Sync complete!
  Uploaded Files:  16
  Bytes Total: 8978

Running 'MyRobot' on ConeBot...
Press Ctrl+C to stop

2026-06-18 12:03:42 | info | [Robot]: Starting robot
...robot output streams here...

^C
Cancelling...
Sync complete!
  Downloaded: 4
```

## Stopping a run

Press **Ctrl+C**. raccoon sends a shutdown signal to the robot, waits for it to stop cleanly (motors disabled), then pulls files back.

## Sync backend selection

The push sync backend is chosen automatically:

| Platform | Backend | Notes |
|----------|---------|-------|
| Linux / macOS | `rsync` over SSH | Efficient delta transfer |
| Windows | SFTP via Paramiko | cwRsync is excluded by design — its Cygwin path and SSH-key handling are too fragile |

The same selection logic applies whether sync is triggered by `raccoon run` or by `raccoon sync` directly.

## Options reference

| Flag | Default | Description |
|------|---------|-------------|
| `--dev` | off | Dev mode: uses button press instead of wait-for-light to start a mission |
| `--local`, `-l` | off | Force local execution — skip remote even if a Pi is connected |
| `--no-sync` | off | Skip the pre-run push sync (useful if you just synced manually) |
| `--no-calibrate` | off | Skip calibration steps; use stored calibration values |
| `--no-codegen` | off | Skip code generation entirely (used internally by the server when codegen was already run client-side) |
| `--no-checkpoints` | off | Skip time-checkpoint waiting (wait_for_checkpoint steps return immediately) |
| `--debug` | off | Enable debug mode: `breakpoint()` steps pause and wait for a button press instead of being a no-op |
| `--record-localization` | off | Record particle filter state to `.raccoon/runs/<timestamp>/localization.jsonl` for replay in the Web-IDE |
| `--no-record` | off | Force-disable localization recording. Recording is already off by default, so this only matters to override a run configuration |
| `--record-hz` | 20 Hz | Downsample rate for localization recording; only effective with `--record-localization` |
| `--record-sensors` / `--no-record-sensors` | on | Record the raw sensor channels to `.raccoon/runs/<run_id>/sensors.mcap` on the Pi for the duration of the run |
| `--no-profile` | off | Disable step profiling for this run (profiling is on by default) |
| `--raw` | off | Local runs: print the program's stdout directly instead of the live log viewer |

## Skipping individual missions with `--no-mXXX`

During development you often want to skip the slow missions and jump straight to testing a specific one. Use `--no-m<prefix>`, where the prefix is the number of the mission, i.e. the three digits after the `M` in its name (`--no-m030`, never `--no-m30`):

```bash
# Skip mission M010
raccoon run --no-m010

# Skip M010 and M030 at the same time
raccoon run --no-m010 --no-m030
```

The setup and shutdown missions cannot be skipped. Skipping is entirely a runtime skip: the files are still synced and compiled, so you can re-run without `--no-mXXX` at any time without a fresh sync.

## Run configurations

`raccoon run` supports named run configurations that bundle multiple flags together. See [Run Configurations]({{< ref "/01-programming-guide/01-basics/08-run-configurations.md" >}}) for full details.

The three built-in presets are always available:

```bash
raccoon run           # same as raccoon run default
raccoon run dev       # --dev --no-calibrate --no-checkpoints (fast iteration)
raccoon run simulated # WebIDE only: the CLI does not start the simulator
```

Pass the configuration name as the first positional argument:

```bash
raccoon run dev
raccoon run dev --no-m010   # combine config with extra flags
```

## Recording localization for replay

To capture the robot's particle filter state during a run so you can replay it in the Web-IDE:

```bash
raccoon run --record-localization
raccoon run --record-localization --record-hz 10   # lower rate = smaller file
```

The recording is saved to `.raccoon/runs/<timestamp>/localization.jsonl` relative to the project root. On a remote run the file is written on the Pi and pulled back during the post-run sync.

The runtime reads three environment variables set automatically by `raccoon run`:

| Variable | Purpose |
|----------|---------|
| `LIBSTP_RECORD_LOCALIZATION` | `1` to enable recording |
| `LIBSTP_RECORDING_PATH` | Relative path to the `.jsonl` output file |
| `LIBSTP_RECORDING_HZ` | Optional downsample rate |

## Transport contract: refusal and dev warning

Before the Pi starts your program, its server checks that every component on the robot matches the bundle ([Transport contract]({{< ref "/06-advanced/03-transport.md" >}})). If one does not, the run is **refused** and the server's message is printed, naming the component and both sides:

```
Failed to start run on Pi: Transport contract check failed; refusing to start.
stm32-data-reader: transport contract mismatch: ...
```

Fix it with `raccoon doctor` and `raccoon update` (or flash the latest image). In **dev mode** the run starts, and raccoon prints a yellow warning line first: *Transport contract check is in DEV mode: mismatches between components are not enforced.* A local run (`--local`, simulator) is never checked.

Inside your program the same check runs when `raccoon` is imported: on a mismatch the import fails with the message, and it appears at the top of your run log.

## Version mismatch warning

If the client and server versions differ, raccoon prints a warning before running:

```
Warning: version mismatch
  Client: 0.1.25  Server: 0.1.23
  Run raccoon update to keep both sides in sync.
```

Things usually still work across minor versions, but run `raccoon update` to eliminate the mismatch.

## Project format check

Before running, raccoon compares the project's `format_version` (in `raccoon.project.yml`) with two numbers:

- **The newest migration the CLI knows.** If your project is behind, raccoon prints a warning and runs anyway. Run [`raccoon migrate`]({{< ref "/03-raccoon-cli/10-migrate.md" >}}) to catch up.
- **The minimum the installed `raccoon-lib` requires** (`raccoon.MIN_FORMAT_VERSION`). If your project is older than that, the run is refused. Run `raccoon migrate` first.

## Running individual steps manually

```bash
raccoon codegen   # regenerate defs.py / robot.py only
raccoon sync      # push or pull files only
```

These are rarely needed — `raccoon run` covers both.

## Related pages

- [sync]({{< ref "/03-raccoon-cli/08-sync.md" >}}) — what the push/pull steps do in detail, including fingerprint verification
- [Run Configurations]({{< ref "/01-programming-guide/01-basics/08-run-configurations.md" >}}) — how to name `dev` vs `competition` mode configurations
- [checkpoint]({{< ref "/03-raccoon-cli/13-checkpoint.md" >}}) — the automatic pre-run snapshots
- [logs]({{< ref "/03-raccoon-cli/15-logs.md" >}}) — browsing output from previous runs
