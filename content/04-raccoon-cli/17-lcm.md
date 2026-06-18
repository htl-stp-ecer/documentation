---
title: "lcm"
author: "Raccoon Docs Team"
date: 2026-06-18
draft: false
weight: 18
---

# raccoon lcm

```bash
raccoon lcm <subcommand> [options]
```

LCM (Lightweight Communications and Marshalling) is the publish-subscribe message bus that raccoon uses internally to pass sensor readings, motor commands, and odometry data between processes on the Pi at runtime. The `raccoon lcm` command group lets you observe, record, and replay that traffic from your laptop — without modifying your robot code.

All `raccoon lcm` subcommands require an active connection to a Pi. Run `raccoon connect` first.

## Subcommands at a glance

| Subcommand | Description |
|-----------|-------------|
| `spy` | Watch LCM messages in real time, optionally recording to a file simultaneously |
| `record` | Record LCM traffic to a `.jsonl` file on the Pi (no live display) |
| `playback` | Replay a recorded session on the Pi |
| `list` | List available recordings stored on the Pi |
| `delete` | Delete a recording from the Pi |
| `status` | Show current spy/playback state and LCM capabilities |

---

## raccoon lcm spy

```bash
raccoon lcm spy [--channel PATTERN]... [--record FILENAME] [--format FORMAT]
```

Streams LCM messages to your terminal in real time. Shows channel name, message type, timestamp, and decoded payload for each message.

### Options

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `-c, --channel` | string (repeatable) | all channels | Filter by channel name or glob pattern. Can be specified multiple times. Examples: `SENSOR_*`, `MOTOR_CMD` |
| `-r, --record` | string | — | Record to this filename on the Pi at the same time as displaying. Combines live-view and save in one step. |
| `-f, --format` | `table` / `json` / `compact` | `table` | Output format for the live stream. |

### Examples

```bash
# Watch all channels
raccoon lcm spy

# Filter to sensor channels only
raccoon lcm spy --channel "SENSOR_*"

# Watch two specific channels
raccoon lcm spy --channel "MOTOR_CMD" --channel "SENSOR_DATA"

# Spy and record simultaneously
raccoon lcm spy --record my_session

# Compact output for high-volume channels
raccoon lcm spy --format compact
```

### Output formats

- **table** (default): rich formatted table, one row per message, columns for channel, type, timestamp, and key payload fields.
- **json**: newline-delimited JSON objects, one per message. Suitable for piping to `jq`.
- **compact**: single-line human-readable format with minimal whitespace.

Press **Ctrl-C** to stop. When stopped, the spy prints a summary:

```
LCM Spy stopped
  Messages captured: 412
  Channels seen: MOTOR_CMD, ODOMETRY, SENSOR_IR_LEFT, SENSOR_IR_RIGHT
  Saved to: my_session.jsonl        ← only if --record was used
```

---

## raccoon lcm record

```bash
raccoon lcm record FILENAME [--channel PATTERN]... [--duration SECONDS]
```

Records LCM traffic to a `.jsonl` file on the Pi **without** displaying anything. Use this when you want a clean recording with no console overhead, or when recording over SSH where bandwidth is limited.

Recordings are stored on the Pi; use `raccoon lcm list` to see them.

### Options

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `FILENAME` | positional | required | Base name for the recording (`.jsonl` is added automatically if omitted) |
| `-c, --channel` | string (repeatable) | all channels | Filter channels to record. Supports glob wildcards. |
| `-d, --duration` | integer (seconds) | `0` (unlimited) | Stop automatically after this many seconds. `0` records until Ctrl-C. |

### Examples

```bash
# Record everything until Ctrl-C
raccoon lcm record my_run

# Record sensor traffic for 30 seconds
raccoon lcm record sensor_test --channel "SENSOR_*" --duration 30

# Record a specific channel
raccoon lcm record motor_data --channel "MOTOR_CMD"
```

---

## raccoon lcm playback

```bash
raccoon lcm playback FILENAME [--speed MULTIPLIER] [--loop] [--channel PATTERN]...
```

Replays a previously recorded `.jsonl` file on the Pi by republishing the stored messages back onto the LCM bus at the recorded timestamps. Other processes on the Pi (your mission code, the data reader, the Web-IDE) see the replayed messages as if they were live.

**Important:** During playback, raccoon automatically stops the `stm32_data_reader` systemd service to prevent real sensor data from interfering with the replay. The service is restarted when playback ends.

### Options

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `FILENAME` | positional | required | Recording filename (with or without `.jsonl` extension) |
| `-s, --speed` | float | `1.0` | Playback speed multiplier. `2.0` = double speed, `0.5` = half speed. |
| `-l, --loop` | flag | off | Restart from the beginning when the recording ends. |
| `-c, --channel` | string (repeatable) | all channels | Only replay messages from matching channels. |

### Examples

```bash
# Normal playback
raccoon lcm playback my_run.jsonl

# Double speed playback
raccoon lcm playback my_run.jsonl --speed 2.0

# Loop continuously (useful for demo mode)
raccoon lcm playback demo.jsonl --loop

# Replay only odometry messages
raccoon lcm playback my_run.jsonl --channel "ODOMETRY"
```

### Progress display

While playing back, the terminal shows a progress indicator:

```
Playback started: my_run.jsonl
  Speed: 1.0x

  Progress: 256/412 (62%)
```

Press **Ctrl-C** to stop early.

---

## raccoon lcm list

```bash
raccoon lcm list
```

Lists all `.jsonl` recordings stored on the connected Pi. Shows filename, message count, file size, and creation time.

```
              LCM Recordings
┌─────────────────────────────┬──────────┬──────────┬─────────────────────┐
│ Filename                    │ Messages │     Size │ Created             │
├─────────────────────────────┼──────────┼──────────┼─────────────────────┤
│ my_run.jsonl                │      412 │ 284.3 KB │ 2026-06-18 10:22:14 │
│ sensor_test.jsonl           │       88 │  14.1 KB │ 2026-06-17 15:04:51 │
└─────────────────────────────┴──────────┴──────────┴─────────────────────┘
```

---

## raccoon lcm delete

```bash
raccoon lcm delete FILENAME [--yes]
```

Deletes a recording from the Pi. Asks for confirmation unless `--yes` is passed.

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `FILENAME` | positional | required | Recording to delete (with or without `.jsonl`) |
| `-y, --yes` | flag | off | Skip the confirmation prompt |

```bash
raccoon lcm delete my_run
raccoon lcm delete my_run.jsonl --yes   # skip prompt
```

---

## raccoon lcm status

```bash
raccoon lcm status
```

Shows three panels:

1. **LCM Capabilities** — whether LCM is available on the Pi, whether message decoding is available (requires `raccoon-transport` package), and which message types are known.
2. **LCM Spy** — current spy status (running/idle), messages captured, channels seen, and recording file (if any).
3. **LCM Playback** — current playback status, filename, progress, speed, and loop setting.

```
╭── LCM Capabilities ─────────────────────────────────╮
│ LCM Available: yes                                   │
│ Decoding: yes                                        │
│ Known Types: MOTOR_CMD, ODOMETRY, SENSOR_IR          │
│ Recordings Dir: /home/pi/.raccoon/lcm_recordings     │
╰──────────────────────────────────────────────────────╯
╭── LCM Spy ───────────────────────────────────────────╮
│ Status: idle                                         │
│ Messages: 0                                          │
│ Channels: none                                       │
│ Recording: none                                      │
╰──────────────────────────────────────────────────────╯
╭── LCM Playback ──────────────────────────────────────╮
│ Status: idle                                         │
│ File: none                                           │
│ Progress: 0/0                                        │
│ Speed: 1.0x                                          │
│ Loop: False                                          │
╰──────────────────────────────────────────────────────╯
```

---

## Recording format

Recordings are stored as newline-delimited JSON (`.jsonl`) on the Pi. Each line is a JSON object:

```json
{"channel": "MOTOR_CMD", "timestamp": 1718700134.512, "type": "MOTOR_CMD", "data": {"port": 0, "speed": 0.5}}
{"channel": "ODOMETRY", "timestamp": 1718700134.516, "type": "ODOMETRY", "data": {"x": 0.12, "y": 0.05, "theta": 0.03}}
```

The `.jsonl` format is human-readable and can be processed with standard tools:

```bash
# Count messages per channel
ssh pi@192.168.4.1 'cat ~/.raccoon/lcm_recordings/my_run.jsonl' | jq -r '.channel' | sort | uniq -c
```

## Common use cases

**Debugging a sensor reading that only occurs during a run:**

```bash
raccoon lcm spy --channel "SENSOR_*" --record debug_run
# trigger the behaviour on the robot
# Ctrl-C
raccoon lcm list   # find the recording
# Inspect with jq or replay
```

**Replaying a run to diagnose a path-planning issue:**

```bash
raccoon lcm record path_test --duration 60
# run the robot
raccoon lcm playback path_test --speed 0.5  # slow motion
```

**Continuous demo loop:**

```bash
raccoon lcm playback competition_run --loop
```
