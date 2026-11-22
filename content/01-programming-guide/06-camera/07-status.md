---
title: "Status"
author: "Mario Scholze"
date: 2026-11-19
draft: false
weight: 70
description: "What is verified in raccoon-cam, what has not been tried on a robot, and the decisions that are still open."
---

# Status

The package lives in the `raccoon-cam` repository. It is a standalone Python package. It depends on `numpy` and on `raccoon-transport`, which provides the `cam_*` messages and the channels of the camera. It needs OpenCV from the system for the USB backend and for the frame stream, and `raccoon-lib` for the robot transport.

## What is verified

All of this runs in the test suite against an in-memory bus and a fake OpenCV. In addition, a Logitech C270 on a Raspberry Pi 3 has run through the service with the USB backend (320x240, MJPG): a processor from the project on the frames, the robot transport, the service as a systemd unit, the frame stream to the UI, and the camera picture widget in a program's UI screen.

| Part | Covered by tests |
|---|---|
| Interfaces and selection | `CamProcessor`, `CamBackend`, `set_backend`, `load_processor`, `set_processor`, the required backend flags |
| Loading, setting and swapping processors | One active processor out of the loaded ones, `change_processor` without loading, loading at the call and refusing a processor the service rejects, a lease without an open camera that frees the loaded processors, refusing what is wrong where it is declared, refusing a processor that is not loaded (in the client and in the service), dropping the old processor's detections at a swap, the set processor surviving a restart of the service, `validate_camera` and the check in `start_camera` |
| `UsbCameraBackend` | Delivery of numbered frames, open retries and giving up after the configured attempts, reopening after failed reads, stop, configuration errors |
| `ReplayBackend` | Playing a video, a folder and a single image, looping, finishing, scaling, the playback rate, failing at once for a bad source, running through the service with a processor |
| Robot setup (the post-install step) | Root check, unit install and keeping an edited unit, the udev rule that keeps USB cameras awake (also when the service is left alone, and without udev), one apt call for all missing packages, nothing to install when all is present, a failing or missing apt, `--no-service` |
| Backend dependencies | A missing dependency fails the start with an install hint, and is not checked before the backend is used |
| `ProcessorHost` | Failure isolation, disabling, replacement, commands, the active processor, refusing processors for backends without frames |
| Service and client | Leases (open on start, immediate close on stop, expiry after a crash, heartbeat, extended after a stalled service), `on_fail`, the falsy `FailedCamera`, results with their source, ready and the start timeout per backend, retries and delay from the backend, restarts of the program and of the service, exclusive start, switching backends, the backend saved on the robot, pause, errors, dropping frames, the frame stream, the wire format, the journal and the log of each run |

## What has not been tried

- **Other cameras.** Only one camera model is tried, with its resolution and codec. Other USB cameras and the other backend options are not tried on a robot.
- **Switching processors on a running robot.** `change_processor` is tested with an in-memory bus. How long a swap takes with a real model on the Raspberry Pi is not measured.
- **Memory and CPU on the Raspberry Pi 3.** Nothing is measured yet. The Pi has 1 GB of RAM and the system already uses 300 to 400 MB.
- **The UI.** The frame stream and the camera picture widget run on a robot. How the picture, the size and fit options and the drawn detections look on the display is not checked.

## What does not exist

- **Steps** such as waiting for a detection.
- **A processor included in the package.** There is no colour detector and no example. The pink and blue drum detection from `drum-bot` is not moved over.
- **The AI camera backend.** The interface leaves room for it. What the camera delivers is not known yet.
- **A release of `raccoon-cam`.** The image and `raccoon update` can install it once a release with the wheel exists. The bundle entry and the image build are written, but have not run.

`libstp-cam` in `raccoon-lib`, an earlier client that nothing used, is removed. The pull request is open in `raccoon-lib`.

## Open decisions

1. **The frame stream is off by default.** `drum-bot` always publishes frames for the UI. Encoding JPEGs costs CPU on the Pi, so the service only does it after `stream(fps)` or `--stream-fps`. If BotUI expects frames without asking, this needs a default.
2. **`extra` and the wire format.** `cam_blob_t` cannot carry `Detection.extra`, and the source travels as a label prefix. New fields in the message would remove both limits.
3. **When the service runs.** Always on from the bundle, or started on request.
4. **Where the Steps live,** in this package or in `raccoon-lib`, depending on whether the web IDE picks up steps from outside the library.
5. **Python only for now.** Heavy image processing in C++ is not part of the design yet. If measurements on the robot show that Python is the bottleneck, the backend interface leaves room for a C++ implementation.
