c---
title: "Transport"
author: "Mario Scholze"
date: 2026-11-22
draft: false
weight: 20
description: "How the components of RaccoonOS exchange data: channels, messages, the shared-memory ring, reliable delivery and the contract hash."
---

# Transport

`raccoon-transport` is the layer through which everything on the robot exchanges data: the reader publishes sensor values, `raccoon-lib` sends motor commands, botui shows both, and `raccoon-cam` publishes detections. It is one small repository with four parts:

- the **channel table** (`channels.yml`), the list of every channel with its message type and the properties of its ring,
- the **message types** (written by hand in C++, with matching Python and Dart classes),
- the **C++ transport**, which holds all the logic: rings, retained and reliable channels, statistics. The **Python package** wraps it with pybind11 and the **Dart package** reaches it through a C bridge, and
- the **contract** that lets every component check at startup that it speaks the same wire format.

---

## Channel table

Only channels that are in `channels.yml` exist. A publish or subscribe on any other name is refused. Every entry has a name, a message type and the properties of its ring:

| Property | Meaning |
|----------|---------|
| `type` | The message type the channel carries, for example `scalar_i32_t`. A typed publish or subscribe on the wrong type is refused |
| `slots` | How many frames the ring holds (default 64) |
| `max_payload` | For a type without a fixed size (strings, JSON, images): the largest frame in bytes. A fixed-size type needs no limit, its size follows from the type |
| `retained` | A new subscriber first receives the latest frame, so a late-starting UI is not blank. Channels with a `state` segment are retained by default |
| `reliable` | At-least-once delivery, see below |

A channel name consists of the characters `0-9 a-z A-Z _ -`, segments are separated by `/`. The first segment is a root such as `hardware`, `camera`, `ui`, `system` or `messages`; the name has the form `<root>/<device>/<kind>/<property>`, where kind is `state` (a value the device reports) or `cmd` (a command to the device):

| Channel | Direction | Carries |
|---------|-----------|---------|
| `hardware/imu/state/gyro` | reader → everyone | Gyroscope reading |
| `hardware/motor/<n>/state/position` | reader → everyone | Motor position |
| `hardware/motor/<n>/cmd/power` | library → reader | Motor power command |
| `hardware/chassis/cmd/velocity` | library → reader | Body-frame velocity (vx, vy, wz), a stream |
| `hardware/chassis/cmd/stop` | library → reader | Stop the chassis |
| `hardware/latch/state/flags` | reader → everyone | Flags of the motor latch |
| `camera/state/detections` | camera → library | Detections from `raccoon-cam` |
| `ui/screen/render` | library → botui | Screen to show on the robot |
| `messages/error`, `messages/warn` | everyone → botui | Errors and warnings as a `message_t`: a title and a text. botui shows each as a dialog |

In every language a channel is named by its path, generated from the table: `channels.hardware.motor.cmd.power(port)` in Python and Dart, `channels::hardware::motor::cmd::power(port)` in C++. A channel with a `cmd` segment is a command channel; commands are never deduplicated, because repeating a command (for example "velocity 0") is meaningful. The full list of the channels the reader publishes and subscribes is in the `stm32-data-reader` README.

---

## Shared-memory ring

There is no broker and no network involved. Every channel is one file under `/dev/shm/raccoon-rings/`, named like the channel with `.` for `/` (`hardware.motor.0.cmd.power`). A ring is a header and a fixed number of slots, and the table decides how many and how big. The first process that opens a channel, reader or writer, creates the file; every later one attaches to it.

- **No daemon, no handshake.** Components can start, stop and crash independently. A subscriber may open a channel before its publisher exists and receives frames as soon as the publisher writes. A program that restarts attaches to the ring that is already there.
- **Every ring takes several writers.** A writer takes a slot with an atomic counter, so two processes never fill the same slot.
- **Event-driven, not polling.** Every publish wakes waiting subscribers with a Linux `futex`. A subscriber thread sleeps in one `futex_waitv` call over all of its channels (Linux 5.16 or newer, at most 128 channels) and uses no CPU while nothing is published. A publisher skips the wake call when nobody is waiting on that channel.
- **The publisher never blocks.** A subscriber that is too slow loses the oldest frames, it never holds the publisher back. For value channels like sensors this is what you want, because the newest frame is the one that counts.
- **A new subscriber starts after the latest frame.** On a retained channel it receives the latest frame once, then the frames that follow.
- **Copy-safe.** Each slot is protected by a sequence lock, so a subscriber never uses a half-written frame. Frames are copied in and out, which is fast for the small messages used here.
- **Layout check.** The ring file carries a magic number and a version, and a subscriber checks that the layout in the header fits the file. A ring from an incompatible build is not used.
- **Small.** A slot occupies the frame plus 16 bytes, rounded up to 64 bytes (a cache line of the Raspberry Pi). A 12-byte value takes one cache line.

The transport runs one spin thread per process that waits for frames on all subscribed channels and calls your handlers. BotUI's Dart side drains the frames that the C bridge has queued into its streams about 30 times per second, which matches the UI's redraw rate. A handler that throws is counted and reported, and the other handlers keep running.

If a ring file is deleted while components run, a subscriber that waits notices within about a second and attaches to the new file.

---

## Publishing and subscribing

A publish returns a result: `Ok`, `NotInTable` (the channel is not in the table), `TypeMismatch` (a different message type, or a size other than the fixed size of the type), `TooBig` (above the `max_payload` of the channel) or `Closed` (the transport was shut down). In Python a refused publish raises `PublishError`; its `result` says why.

```python
import raccoon_transport as rt
from raccoon_transport import channels
from raccoon_transport.types.raccoon import scalar_i32_t

transport = rt.get_transport()
transport.publish(channels.hardware.motor.cmd.power(0), scalar_i32_t(timestamp=0, value=50))
subscription = transport.subscribe(
    channels.hardware.motor.state.position(0),
    lambda channel, msg: print(msg.value),
    message_type=scalar_i32_t,
)
```

The one option of a publish is **deduplicate**: it drops a publish whose payload is identical to the previous one. It applies to value channels only.

### Reliable channels

A channel that is `reliable` in the table has at-least-once delivery. The publisher sends the frame again every 50 ms until a subscriber acknowledges it, at most 20 times (about one second), and reports a retransmit and a give-up to the log. This protects one-shot commands, such as a single motor command that is sent while the reader is not yet listening. A subscriber of a reliable channel acknowledges every frame and delivers each command once: it remembers the last 64 commands by timestamp and checksum, so a repeated frame is acknowledged but not delivered again. Streams such as `hardware/chassis/cmd/velocity` are not reliable, they recover with the next frame; the stop of the chassis is its own reliable channel.

---

## Contract

Everything on the robot — the Python library that runs your missions, the STM32 reader, the BotUI and the Pi server — exchanges data through **raccoon-transport**. If one of them was built against a different transport than the others, messages are dropped without any error. The **transport contract check** turns that silent failure into a clear message at start.

### The idea in four words

| Term | Meaning |
|------|---------|
| **Contract** | Everything components rely on when they exchange data: the layout of every message type, every channel name, the shared-memory ring layout |
| **Contract hash** | A 16-character fingerprint of the contract (for example `93ac36836810c9fe`). Same contract, same hash, in C++, Python and Dart |
| **Bundle file** | `/etc/raccoon-bundle.json` on the robot, written by the image or by `raccoon update`. It names the hash every component must have, and the version of every component |
| **Status file** | What one component reports about itself, in `/run/raccoon/<component>.json`: its own hash and version, and the result of its start check. Errors never travel over the transport, because it may be the thing that is broken |

The **bundle is the source of truth**: components never ask each other. Each one compares its own compiled-in hash and its own version with the bundle file when it starts, and refuses to start on a mismatch. The Pi server compares what every component reports in its status file with the bundle file **again every time** it answers `raccoon doctor` or a run request, so a changed bundle counts immediately and no component has to be restarted. Nothing is added to the publish/subscribe path.

### What is checked

```json
{
  "bundle": "2026.11.02",
  "contract_hash": "93ac36836810c9fe",
  "components": {
    "raccoon-transport": "v69",
    "raccoon-lib": "v155",
    "raccoon-cli": "v173",
    "stm32-data-reader": "v58",
    "botui": "v73"
  }
}
```

1. **Contract:** the component's compiled-in hash must equal `contract_hash`.
2. **Version:** the component's own version must equal its entry in `components` (`v173` and `173` are the same). The Pi server is `raccoon-cli` in this file.

| Result | When | What happens |
|--------|------|--------------|
| `ok` | hash and version match | normal start |
| `mismatch` | the hash differs | the component **refuses to start** |
| `version-mismatch` | the version differs | the component **refuses to start** |
| `bundle-fehler` | file missing, unreadable, or `contract_hash` / the component's entry missing or empty | the component **refuses to start**; the message names the reason |
| `dev-warnung` | the bundle field is `dev` (see below) | starts, warns |
| `skipped` | not running on a Raccoon device | nothing is checked |

A missing file is **never** silently skipped on the robot: if a script that writes the bundle breaks, the protection must not switch off unnoticed.

#### Laptop, simulation and `--local`

The check only applies on a Raccoon device, recognised by the directory `/etc/raccoon-image` that the image creates. On your laptop, in the simulator and with `raccoon run --local` nothing is checked and nothing blocks. The laptop is not part of the contract: it talks to the Pi over REST and WebSocket.

### What each component does

| Component | Checks | On `mismatch` / `version-mismatch` / `bundle-fehler` |
|-----------|--------|------------------------------------------------------|
| `stm32-data-reader` | at start | logs the reason to the journal, writes its status file, **exits with code 78**; systemd does not restart it (`RestartPreventExitStatus=78`) |
| `raccoon-lib` | at `import raccoon` | raises a `RuntimeError` with the message; it shows up in your run log |
| Pi server (`raccoon-server`) | at start and before every run | stays up and reports; **refuses runs** with HTTP 409 naming the components |
| BotUI | at start | popup "System mismatch" (acknowledge to continue); the status file is written. The Versions page shows the bundle file |
| CLI | `doctor`, `connect`, `run` | shows what the server reports; no check on the laptop |

Messages always name **both sides**: the component's own hash and version and the bundle's. The check says that they differ, not who is right.

### What you see

#### `raccoon doctor`

```
Transport contract
Bundle 2026.11.02 expects 93ac36836810c9fe (transport v69)
┏━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━┳━━━━━━━━━┳━━━━━━━━━━━━━━━━━━┓
┃ Component         ┃ Result   ┃ State   ┃ Contract         ┃
┡━━━━━━━━━━━━━━━━━━━╇━━━━━━━━━━╇━━━━━━━━━╇━━━━━━━━━━━━━━━━━━┩
│ botui             │ ok       │ running │ 93ac36836810c9fe │
│ raccoon-server    │ ok       │ running │ 93ac36836810c9fe │
│ stm32-data-reader │ mismatch │ not active │ 1111111111111111 │
└───────────────────┴──────────┴─────────┴──────────────────┘
```

*State* is `running` while the process that wrote the file is alive and `not active` otherwise. A reader that refused and exited stays visible — that is the point. Doctor exits with code 1 when the contract is broken.

#### `raccoon run`

If a component does not match, the Pi server answers the run request with a refusal and the CLI prints its text, for example:

```
Failed to start run on Pi: Transport contract check failed; refusing to start.
stm32-data-reader: transport contract mismatch: stm32-data-reader 58 uses contract
1111111111111111 (transport v68), bundle 2026.11.02 expects 93ac36836810c9fe
(transport v69); update or reflash so all components match
```

Calibration commands are refused the same way. A stale status file of a *run-scoped* process (`raccoon-lib` from an earlier run) never blocks, otherwise a run could not start again after you fixed the cause; a *service* that refused (reader, BotUI, server) keeps blocking for as long as its hash or version does not match the bundle.

#### `raccoon connect`

One red line when the Pi's contract is broken (`Runs will be refused; see raccoon doctor`) and a yellow line in dev mode.

### Fixing a mismatch

1. `raccoon doctor` — which component, which hash.
2. `raccoon update` — brings all components and the bundle file to one bundle and restarts the services.
3. If the robot is badly out of sync or `raccoon-server` is down: **flash the latest raccoon image**. There is no separate repair route.

Do not "fix" it by editing `/etc/raccoon-bundle.json`; it describes the bundle, it does not select one.

### Dev mode

To test your own transport build on the robot, set `contract_hash` in `/etc/raccoon-bundle.json` **by hand** to the literal `dev`.

- The components still start, run their check and write status files, but a difference is only a **warning**.
- There is no hash to compare against, so `raccoon doctor` instead warns when the *running* components report different hashes.
- It is visible everywhere: a line in `raccoon doctor`, a yellow warning line at every `raccoon run`, the bundle's values, including `dev`, on the BotUI's Versions page.
- Setting or removing `dev` takes effect at the next `raccoon run` or `raccoon doctor`; no component has to be restarted.
- You are responsible that every component was rebuilt against your transport (C++ links it statically).
- No workflow ever writes `dev`, and **no image is ever built from a bundle with `dev`**. The next normal `raccoon update` replaces it with the release bundle's hash.

You can also write `dev` into a **single component's entry** in `components` (for example `"stm32-data-reader": "dev"`). That omits only the version comparison for that component; the contract is still checked. `raccoon doctor`, `raccoon connect` and every `raccoon run` warn which components skip their version check (*Version check omitted for stm32-data-reader*), and the component logs the same. The BotUI's Versions page shows the entry as `dev`. A `dev` contract does not excuse a wrong version either — the two are independent. The dev bundle `bundles/dev.json` (`raccoon update --dev`) is unrelated: it has no transport field and is not checked.

### Status file reference

`/run/raccoon/<component>.json` (a tmpfs directory, emptied on reboot; each component writes only its own file, atomically):

| Field | Meaning |
|-------|---------|
| `component`, `component_version` | who, and which version |
| `own_hash`, `own_transport_version` | what the component was built with |
| `expected_hash`, `expected_transport_version`, `bundle` | what the bundle file says (`null` if it could not be read) |
| `component_check` | the component's own check (the version check): `name`, `result`, `reason`, `message`, `expected`; `null` if the component has none or the bundle could not be read |
| `result`, `reason`, `message` | the result from the table, a machine-readable reason (`file-missing`, `file-unreadable`, `field-missing`, `field-empty`, `version-field-missing`, `version-field-empty`, `version-omitted`) and the full text |
| `timestamp`, `pid`, `pid_starttime` | when, and which process (a reused PID does not count as the same process) |
| `persistent` | `true` for services that keep running |

The Pi server serves the aggregate at `GET /api/v1/contract` (see [raccoon-server]({{< ref "/03-raccoon-cli/18-raccoon-server.md" >}})).

### Exit code 78

A component that refuses to start exits with **78**. systemd units of long-running components set `RestartPreventExitStatus=78`; otherwise a refusing service would be restarted every few seconds and flood the journal.

### For transport developers

`scripts/contract.py` in `raccoon-transport` reads the **C++ message headers**, `raccoon_ring.h` and `channels.yml` and writes `contract/contract.json` plus generated constants for C++, Python and Dart. The hash is the first 16 hex characters of the SHA-256 of the canonical JSON.

| Goes into the hash | Does **not** |
|--------------------|--------------|
| every message type of `messages/include/raccoon/*_t.hpp`: name, fields **in order** (the wire order), field types | comments, whitespace, default values |
| every channel of `channels.yml` with its message type, slot count, slot size, `reliable` and `retained` flag, sorted by name | the documentation text and the order of the entries |
| the shared-memory ring magic and `RRB_VERSION` | the transport version number (display only) |

After changing a message struct, a channel or the ring layout, regenerate and commit (a channel in `channels.yml` also needs `python3 scripts/channels.py --write`, which generates the channel names for C++, Python and Dart):

```bash
python3 scripts/contract.py --write     # regenerate contract.json and the constants
python3 -m unittest scripts/test_contract.py python/tests/test_contract_check.py
```

CI runs `contract.py --check`. It fails when a generated file is stale or when the Python or Dart messages no longer match the C++ field order. Merging to `main` in `raccoon-transport` is a release.

---

## Where the code is

- Messages and protocol types: `messages/`
- Channel table: `channels.yml`, generator: `scripts/channels.py`
- C++ transport, ring, C bridge and tests: `cpp/`
- Python package (with the pybind11 binding): `python/`, Dart package: `dart/`
- Contract hash, check spec and test vectors: `contract/` and `scripts/contract.py`
