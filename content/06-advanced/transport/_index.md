---
title: "Transport"
author: "Mario Scholze"
date: 2026-11-15
draft: false
weight: 20
description: "How the components of RaccoonOS exchange data: channels, messages, the shared-memory ring, reliable delivery and the contract hash."
---

# Transport

`raccoon-transport` is the layer through which everything on the robot exchanges data: the reader publishes sensor values, `raccoon-lib` sends motor commands, botui shows both, and `raccoon-cam` publishes detections. It exists for C++, Python and Dart and is one small repository with four parts:

- the **message types** (written by hand in C++, with matching Python and Dart classes),
- the **C++ transport library** with retain and reliable delivery,
- a **Python package** and a **Dart package**, and
- the **contract** that lets every component check at startup that it speaks the same wire format.

---

## Shared-memory ring

There is no broker and no network involved. Every channel is one file under `/dev/shm/` named `raccoon_ring_<channel>`. The one component that publishes on a channel maps the file and writes frames into a ring of fixed-size slots. Subscribers map the same file and poll the sequence counter.

- **No daemon, no handshake.** Components can start, stop and crash independently. When a publisher comes back it writes a fresh frame and subscribers resync.
- **Single producer per channel.** For example, the reader is the only publisher of the sensor channels.
- **Polling, not events.** Subscribers poll about every millisecond. At typical rates this costs well under one percent of a Pi core.
- **Copy-safe.** Each slot is protected by a sequence lock, so a subscriber never uses a half-written frame.

Never delete the files in `/dev/shm` while components run: a subscriber keeps the old file mapped and will not see a newly created one.

---

## Channels

Channels follow the pattern `raccoon/<device>/<property>`. Examples:

| Channel | Direction | Carries |
|---------|-----------|---------|
| `raccoon/gyro/value` | reader → everyone | Gyroscope reading |
| `raccoon/motor/<n>/position` | reader → everyone | Motor position |
| `raccoon/motor/<n>/power_cmd` | library → reader | Motor power command |
| `raccoon/chassis/velocity_cmd` | library → reader | Body-frame velocity (vx, vy, wz) |
| `raccoon/cam/detections` | camera → library | Detections from `raccoon-cam` |
| `raccoon/screen_render` | library → botui | Screen to show on the robot |

Commands end in `_cmd`. Protocol channels used internally for acknowledgements and retained values start with `__raccoon/`. The full list of channels the reader publishes and subscribes is in the `stm32-data-reader` README; the source of truth is `cpp/include/raccoon/Channels.h` in `raccoon-transport`.

---

## Publish options

| Option | What it does |
|--------|--------------|
| plain publish | Writes the frame. Fast, no guarantees beyond the ring |
| **retain** | A new subscriber immediately receives the latest value, so a late-starting UI is not blank |
| **reliable** | At-least-once delivery. The publisher re-sends until the subscriber acknowledges, which protects one-shot commands such as a single motor command sent while the reader is not yet listening |

The wire format of a reliable channel is unchanged, so subscribers that do not care about reliability keep working.

---

## Contract

All components must agree on the layout of every message, every channel name and the ring layout. That agreement is summarized in a 16-character **contract hash**, which is computed from the C++ sources and generated into C++, Python and Dart. At startup each component compares its own hash with the one in the bundle file `/etc/raccoon-bundle.json` and refuses to run on a mismatch. The details are on the [Transport Contract]({{< ref "/06-advanced/transport/01-contract.md" >}}) page, and how CI enforces it is in [Transport contract in CI]({{< ref "/07-build-and-contribute/releases/02-transport-contract-in-ci.md" >}}).

---

## Where the code is

- Messages and protocol types: `messages/`
- C++ library, channels, ring and tests: `cpp/`
- Python package: `python/`, Dart package: `dart/`
- Contract hash, check spec and test vectors: `contract/` and `scripts/contract.py`

After changing a message struct, a channel or the ring layout, run `python3 scripts/contract.py --write` and commit the result. CI runs `--check`, which fails if a generated file is stale or Python or Dart drifted from C++.
