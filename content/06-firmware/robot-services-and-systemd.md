---
title: "Robot Services And systemd"
author: "OpenAI Codex"
date: 2026-05-28
draft: false
weight: 7
description: "What long-lived services actually run on the robot, why they exist, and how to inspect them."
---

# Robot Services And systemd

The robot is not just "your Python program." Several long-lived processes and systemd units exist underneath it, and understanding them is critical when debugging startup, sensors, camera, or background daemons.

This page documents the units that are actually shipped in this repo and the project-service mechanism layered on top of them.

Source of truth:

- [stm32_data_reader.service](/media/tobias/TobiasSSD/projects/Botball/raccoon/stm32-data-reader/systemd/stm32_data_reader.service)
- [lcm-loopback-multicast.service](/media/tobias/TobiasSSD/projects/Botball/raccoon/stm32-data-reader/systemd/lcm-loopback-multicast.service)
- [raccoon-cam.service](/media/tobias/TobiasSSD/projects/Botball/raccoon/raccoon-cam/raccoon-cam.service)
- [flutter-ui.service](/media/tobias/TobiasSSD/projects/Botball/raccoon/botui/systemd/flutter-ui.service)
- [project_services.py](/media/tobias/TobiasSSD/projects/Botball/raccoon/toolchain/raccoon_cli/project_services.py)

## The baseline service model

There are two kinds of services to think about:

- platform services shipped as part of the robot software stack
- project-owned services declared inside `raccoon.project.yml`

The first category keeps the robot platform alive. The second category lets a project deploy its own background daemons, such as vision helpers.

## `stm32_data_reader.service`

This is the Pi-side bridge process that talks to the STM32 and publishes/consumes runtime data.

Unit characteristics:

- runs as user `pi`
- working directory `/home/pi/stm32_data_reader`
- executable `/home/pi/stm32_data_reader/stm32_data_reader`
- restart policy `always`
- restart delay `5s`
- explicitly depends on `lcm-loopback-multicast.service`

Why it matters:

- if this unit is not healthy, motor, sensor, and firmware-facing runtime behavior is broken
- many "robot is alive but hardware is dead" failures reduce to this service

### Why `PrivateTmp=false` is explicitly set

This unit disables `PrivateTmp` on purpose.

The inline comment in the shipped unit explains why:

- iceoryx2 service discovery uses `/tmp/iceoryx2/`
- a private `/tmp` namespace would isolate this service from other subscribers
- that would break communication with Python runtime processes, UI bridges, and similar consumers

This is not an arbitrary unit tweak. It is part of the transport contract.

## `lcm-loopback-multicast.service`

This is a oneshot networking helper that makes multicast on loopback work for the local LCM-style transport setup.

It does two things:

- enables multicast on `lo`
- installs a route for `224.0.0.0/4` via `lo`

Why it matters:

- `stm32_data_reader.service` explicitly requires it
- local publish/subscribe behavior can fail in non-obvious ways if this loopback multicast setup is missing

If transport feels broken locally on the robot, do not just inspect application code. Check that this unit actually ran.

## `raccoon-cam.service`

This is the shipped USB camera service.

Unit characteristics:

- executable `/usr/local/bin/raccoon-cam`
- restart policy `on-failure`
- restart delay `3s`
- runs as user `pi`, group `video`
- logs to journald

Why it matters:

- camera-based features may fail even when the rest of the robot is healthy
- camera failure is not the same as `stm32_data_reader` failure

This service should be debugged as its own subsystem.

## `flutter-ui.service`

This is the BotUI / touchscreen frontend unit.

Unit characteristics:

- starts `flutter-pi`
- runs the built app from `/home/pi/stp-velox/`
- restart policy `always`
- writes to TTY instead of journald by default

Why it matters:

- a dead UI does not necessarily imply a dead robot runtime
- but UI packaging and deployment are their own operational surface

## Project-owned services

Projects can declare their own daemons in `raccoon.project.yml` under `services:`.

Example shape:

```yaml
services:
  vision:
    module: src.daemons.vision
    restart: always
    after_sync: restart_if_changed
    required_for_run: true
```

Important schema rules enforced by the current implementation:

- service names must match `[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}`
- each service must define exactly one of:
  - `module`
  - `command`
- `env` must be a mapping
- `watch` must be a string or list of strings

## How project services are deployed

For each declared service, the toolchain:

1. normalizes the config into a `ProjectService`
2. renders a systemd unit
3. computes a content digest
4. compares that digest against the previous deployment
5. decides whether to start, restart, or leave the service alone

The generated systemd unit:

- runs under the project path as `WorkingDirectory`
- defaults to `User=pi`
- sets `PYTHONUNBUFFERED=1`
- logs to journald
- uses a service name like:
  - `raccoon-project-<project-id>-<service>.service`

## `after_sync` behavior

The current implementation supports three behaviors:

- `restart`
  Always restart after sync
- `restart_if_changed`
  Restart only if the rendered unit or watched files changed
- `leave_running`
  Do not restart automatically after sync

If `watch` is omitted, the toolchain uses the whole project fingerprint. That is conservative: any synced project change can trigger a restart.

## `required_for_run`

This flag matters operationally.

- `required_for_run: true` means the service should be treated as part of the runnable project
- if such a service is unhealthy, the project is not really in a healthy run state

Do not treat a required service crash as "just a background daemon issue."

## CLI visibility into project services

The CLI has dedicated commands for inspecting project services on the robot:

```bash
raccoon logs services
raccoon logs services show <service-name>
```

The service list includes:

- active state
- sub-state
- main PID
- restart count
- activation timestamp
- whether the service is required for run

This is the intended first line of debugging before SSHing in and manually spelunking through systemd state.

## Practical debugging workflow

When a subsystem looks dead, narrow it by layer:

- motors / sensors dead: inspect `stm32_data_reader.service`
- local transport weird: inspect `lcm-loopback-multicast.service`
- camera unavailable: inspect `raccoon-cam.service`
- UI missing but runtime still alive: inspect `flutter-ui.service`
- project-specific daemon broken: inspect `raccoon logs services`

## Why this architecture exists

The engineering shape here is deliberate:

- hard realtime stays on the STM32
- the Pi-side bridge is always-on infrastructure
- optional subsystems such as camera and UI are independent units
- project daemons are first-class deployable services instead of ad-hoc shell hacks

That separation makes the platform debuggable. A robot can fail partially instead of failing as one giant opaque process.
