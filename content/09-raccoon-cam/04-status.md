---
title: "Status"
author: "marios271"
date: 2026-11-14
draft: false
weight: 40
description: "What is verified in raccoon-cam, what has not been tried on a robot, and the decisions that are still open."
---

# Status

The package lives in the `raccoon-cam` repository. It is a standalone Python package. It depends on `numpy` and on `raccoon-transport` version 0.1.59 or later, which has the hand-written `cam_*` messages. Version 0.1.33, which is installed in the virtual environment of `drum-bot`, has the old LCM-generated Python messages that need the wire patch from `drum-bot`, so it does not work with `raccoon-cam`. It needs OpenCV from the system for the USB backend and for the frame stream, and `raccoon-lib` for the robot transport.

## What is verified

All of this runs in the test suite against an in-memory bus and a fake OpenCV.

| Part | Covered by tests |
|---|---|
| Interfaces and selection | `CamProcessor`, `CamBackend`, `set_backend`, `set_processor`, the required backend flags |
| `UsbCameraBackend` | Delivery of numbered frames, open retries and giving up after the configured attempts, reopening after failed reads, stop, configuration errors |
| `ProcessorHost` | Failure isolation, disabling, replacement, commands, refusing processors for backends without frames |
| Service and client | Leases (open on start, immediate close on stop, expiry after a crash, heartbeat), `on_fail`, the falsy `FailedCamera`, results with their source, ready and timeouts, restarts of the program and of the service, exclusive start, switching backends, pause, errors, dropping frames, the frame stream, the wire format |

## What has not been tried

- **A real camera.** The USB backend has not run against a real device on a Raspberry Pi.
- **The robot transport.** `TransportBus` wraps `raccoon.get_transport()` the way `drum-bot` uses it, but it has not run on a robot.
- **Running as a service.** The `services:` entry and the unit file are written from the `drum-bot` example and the unit tests of `raccoon-cli`, and have not been started.
- **Memory and CPU on the Raspberry Pi 3.** Nothing is measured yet. The Pi has 1 GB of RAM and the system already uses 300 to 400 MB.
- **The UI.** What BotUI does with the frames and detections is not checked.

## What does not exist

- **Steps** such as waiting for a detection.
- **A processor included in the package.** There is no colour detector and no example. The pink and blue drum detection from `drum-bot` is not moved over.
- **The AI camera backend.** The interface leaves room for it. What the camera delivers is not known yet.
- **A bundle entry** that installs and starts the service.

`libstp-cam` in `raccoon-lib` is an earlier client that nothing uses. It can be removed now that this client exists.

## Open decisions

1. **The frame stream is off by default.** `drum-bot` always publishes frames for the UI. Encoding JPEGs costs CPU on the Pi, so the service only does it after `stream(fps)` or `--stream-fps`. If BotUI expects frames without asking, this needs a default.
2. **`extra` and the wire format.** `cam_blob_t` cannot carry `Detection.extra`, and the source travels as a label prefix. New fields in the message would remove both limits.
3. **When the service runs.** Always on from the bundle, or started on request.
4. **Where the Steps live,** in this package or in `raccoon-lib`, depending on whether the web IDE picks up steps from outside the library.
5. **Python only for now.** Heavy image processing in C++ is not part of the design yet. If measurements on the robot show that Python is the bottleneck, the backend interface leaves room for a C++ implementation.
