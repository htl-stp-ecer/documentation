---
title: "The Service"
author: "Mario Scholze"
date: 2026-11-22
draft: false
weight: 70
description: "Running the camera service as a project or system service, how frames are handled, and the channels, commands and status."
---

# The Service

The `CamService` is one process that runs a backend and the processors and publishes the results. Your program talks to it through a `CamClient`, see [Client API]({{< ref "/01-programming-guide/06-camera/01-client-api.md" >}}). Neither side imports the other's heavy parts: your program never loads OpenCV.

## Running the service

```bash
python3 -m raccoon_cam.service
```

Without options it starts without a backend: a program selects one with `set_backend`, or you choose one in the UI (see [Backends]({{< ref "/01-programming-guide/06-camera/03-backends.md" >}}#selecting-a-backend)). You can set options as flags or as environment variables, which is easier in a unit file:

| Flag | Environment | Meaning |
|---|---|---|
| `--backend` | `RACCOON_CAM_BACKEND` | `module:Class` of the backend. Default: none. A backend chosen in the UI takes precedence |
| `--backend-cfg` | `RACCOON_CAM_BACKEND_CFG` | JSON with the backend's options |
| `--project-dir` | `RACCOON_CAM_PROJECT_DIR` | Added to `sys.path`, so processors and backends from your project can be imported |
| `--stream-fps` | `RACCOON_CAM_STREAM_FPS` | Rate of the frame stream for the UI. `0` is off, which is the default |
| `--jpeg-quality` | `RACCOON_CAM_JPEG_QUALITY` | JPEG quality of that stream. Default 60 |
| `--eager-opencv` / `--no-eager-opencv` | `RACCOON_CAM_EAGERLY_LOAD_OPENCV` | `1`, `true`, `yes` or `on`: import OpenCV when the service starts. Otherwise it is imported when the camera first starts. The unit sets it, see [below](#opencv-at-start) |
| none | `RACCOON_CAM_LOG_DIR` | Where the JSONL log goes, one subdirectory per run. Default: the logs directory systemd gives the service, `/var/log/raccoon-cam`. See [Logs and errors]({{< ref "/01-programming-guide/06-camera/08-logs.md" >}}) |
| none | `RACCOON_CAM_STATE_DIR` | Where `backend.json` is kept. Default: the state directory systemd gives the service, `/var/lib/raccoon-cam`. See [the backend chosen on the robot](#the-backend-chosen-on-the-robot) |
| none | `RACCOON_BUNDLE_FILE` | The bundle file of the robot, for the version check at start. Default `/etc/raccoon-bundle.json` |

If the backend cannot start, for example because OpenCV is missing, the service stays up and reports the error. A client can then select another backend.

When the service starts on a robot, it checks the transport and its own version against the bundle file. If they do not match the bundle, it refuses to start and exits with code 78, which the unit does not restart. On a laptop and in the simulator the check is skipped. The service does not feed the watchdog of the STM32: the unit sets `RACCOON_NO_HEARTBEATS=1`, so only your robot program does.

### OpenCV at start

Importing OpenCV takes several seconds on a Raspberry Pi 3 and stands the whole process still while it runs. The service cannot answer any command in that time. With `RACCOON_CAM_EAGERLY_LOAD_OPENCV=1` the import happens when the service starts, before it takes commands, so nobody is waiting yet. The unit sets it to `1`.

With `0`, or without the variable, OpenCV is imported when the camera first starts. That saves memory while no program uses the camera, but the first program that starts the camera waits for the import, and the UI gets no answer from the service during it. A backend that is configured in the service is loaded at start in the same way.

Opening the camera never blocks the service: `acquire` answers at once and the backend starts in its own thread. A start that fails shows up as `failed` in the status and as an error message, not as an error of the command.

### USB cameras stay awake

The post-install step installs a udev rule (`/etc/udev/rules.d/90-raccoon-cam-usb.rules`) that switches off USB power saving for cameras. A camera that the kernel has suspended after a pause needs several seconds to wake up. Many of them, for example the Logitech C270, leave the USB bus and come back, and their `/dev/video0` is missing in the meantime, so the first open fails again and again. The rule applies to USB devices of the class that UVC cameras report (device class `ef`, subclass `02`, protocol `01`) and keeps them powered while they are plugged in. It takes effect for cameras that are plugged in when the setup runs and for every camera that is plugged in later.

### As a project service

A project can run it like its own `vision` daemon, with an entry in the project's `services:` configuration. The format follows the `vision` service of `drum-bot`:

```yaml
cam:
  module: raccoon_cam.service
  restart: always
  restart_sec: 1
  env:
    RACCOON_CAM_BACKEND_CFG: '{"resolution": [160, 120], "fps": 15}'
```

The service runs in the project directory, so classes from `src/` import without `RACCOON_CAM_PROJECT_DIR`. This has not been run on a robot yet.

### As a system service

On the robot you do not set the service up. The RaccoonOS image installs `raccoon-cam`, its systemd unit and OpenCV from the distribution (`python3-opencv`). `raccoon update` keeps it that way: after an update, `raccoon-server`'s post-install hands over to the post-install of `raccoon-cam`, which does the following.

1. Installs the unit into `/etc/systemd/system/`. An existing unit is always replaced, so every robot runs the unit that belongs to the installed version.
2. Installs the system packages that the built-in backends need and that are missing, with one `apt-get install` call. Today that is `python3-opencv`.
3. Reloads systemd, enables the service and restarts it.

If `apt-get` fails (no network) or does not exist, it prints what to install by hand, still sets up the service, and `raccoon-server` shows a warning. This is not a command you run, and nothing else triggers it: only `raccoon update`, the image build and `deploy.py` (which installs a local build on a Pi for development) do. On a laptop none of this happens: `pip install raccoon-cam` never installs system packages.

What the unit sets:

| Setting | Why |
|---|---|
| `User=pi`, `Group=pi`, `SupplementaryGroups=video` | Same user as the STM32 data reader, whose ring files in `/dev/shm` the transport must open, and access to the camera device |
| `Restart=always`, `RestartSec=1` | The service comes back after a crash |
| `RestartPreventExitStatus=78` | A refusal by the version check is not restarted in a loop |
| `Nice=5` | A lower priority than the robot program, so image processing does not starve it |
| `LogsDirectory=raccoon-cam` | `/var/log/raccoon-cam`, for the [JSONL log of every run]({{< ref "/01-programming-guide/06-camera/08-logs.md" >}}) |
| `StateDirectory=raccoon-cam` | `/var/lib/raccoon-cam`, for `backend.json` |
| `RACCOON_NO_HEARTBEATS=1` | The service never feeds the watchdog |
| `RACCOON_CAM_EAGERLY_LOAD_OPENCV=1` | OpenCV is loaded at start, see [above](#opencv-at-start) |

Do not add `PrivateTmp`, `ProtectSystem` or `ProtectHome` to the unit: they hide the ring files in `/dev/shm` from the other processes.

The unit file is replaced on every update, so do not edit it. Change settings with a drop-in, which an update leaves alone:

```bash
sudo systemctl edit raccoon-cam
```

Add the settings under `[Service]` as `Environment=` lines, for example:

```ini
[Service]
Environment=RACCOON_CAM_BACKEND=raccoon_cam.backends.usb:UsbCameraBackend
Environment=RACCOON_CAM_BACKEND_CFG={"resolution":[160,120],"fps":15}
Environment=RACCOON_CAM_STREAM_FPS=10
```

A backend that is configured this way is the one the service falls back to when no program holds the camera.

## How frames are handled

The backend pushes frames from its own thread. A worker thread takes the newest one and runs the processors. Only the active processor runs on it. A frame that arrives while the worker is still busy replaces the waiting one and counts as dropped, so the service always works on a fresh image and never builds a queue. `status` shows the counts under `frames`.

## Channels

| Channel | Direction | Content |
|---|---|---|
| `camera/state/detections` | service to clients | `cam_detections_t`, retained. Detections of all processors and the backend together, with the `frame_id` of the frame they were computed from |
| `camera/state/frame` | service to UI | `cam_frame_t` with a JPEG and a `frame_id`. Only if the stream is on |
| `camera/cmd/request` | client to service | `string_t` with JSON: `request_id`, `command`, `data` |
| `camera/response` | service to clients | `string_t` with JSON: `request_id`, `ok`, `data` |
| `camera/state/status` | service to clients | `string_t` with JSON, retained, every 2 seconds and on changes |
| `camera/state/error` | service to clients | `string_t` with JSON `message` and `context`, retained |
| `messages/error` | service to UI | The same errors as a `message_t` with the title "Camera problem" |

`cam_blob_t` has no field for the source, so the label on the wire is `source/label`, for example `BrightSpot/bright`. The client splits it again, which is why processor names must not contain `/`. A detection from a backend carries the backend's name as source.

The frame and its detections are separate messages. The service numbers every frame it receives (`frame_id`, counting up from 1 while the service runs); the detections of a frame carry the number of that frame, and 0 when they belong to no frame (an AI camera delivers detections without frames). The UI draws the latest detections over the latest frame, which can be one frame behind when a processor is slower than the camera.

> The existing `drum-bot` vision daemon uses the same channel names with different commands. Do not run both at once.

### Commands

| Command | `data` | Result |
|---|---|---|
| `ping` | | `instance_id` |
| `status` | | The status |
| `hold` | `lease`, `ttl` | Takes a lease without opening the camera. A program that loads processors holds one, so the service frees them when it dies |
| `acquire` | `lease`, `ttl`, `retries`, `delay` | Takes a lease (or turns a held one into the one that opens) and opens the camera if it is closed |
| `renew` | `lease`, `ttl` | Extends a lease. Fails if the service does not know it |
| `release` | `lease` | Gives a lease back. The last one closes the camera |
| `set_backend` | `path`, `cfg` | `changed`, `dropped_processors` |
| `load_processor` | `path`, `name`, `cfg` | `changed`, `name`. Imports and configures the processor. The same name, class and options is left alone |
| `set_processor` | `name` | `changed`, `name`. Makes a loaded processor the active one. An error if it is not loaded |
| `change_processor` | `name` | The same as `set_processor`, for a running camera. It is answered when the next frame goes to the new processor |
| `remove_processor` | `name` | |
| `processor_command` | `name`, `command`, `data` | The processor's result |
| `backend_command` | `command`, `data` | The backend's result |
| `pause`, `resume` | | |
| `stream` | `fps`, `quality` | The settings now in effect |
| `list_backends` | | The built-in backends with their options |
| `describe` | `path` | One backend (`module:Class`) with its options |
| `validate_config` | `path`, `cfg` | The configuration as typed values, or an error that names the option |

Commands and answers are reliable: the transport repeats a command or an answer until the other side has acknowledged it, so a client sends a command once.

### Status

The status is a JSON object with these fields.

| Field | Meaning |
|---|---|
| `instance_id` | Changes when the service restarts |
| `active` | The camera is open (at least one lease) |
| `failed` | The backend gave up opening the camera: the reason, otherwise `null` |
| `status_seq` | Counts up with every status, so a client can ignore an older one that arrives late |
| `leases` | Number of leases held |
| `ready` | The backend delivered its first frame or detections |
| `paused` | Processors are paused |
| `backend` | `path`, `name`, `allow_processors`, `provides_detections` and the backend's own `status` |
| `processors` | Per loaded processor: `path`, `active`, `calls`, `failures`, `disabled`, `avg_ms`, `last_ms`, `last_error` |
| `processor` | The name of the active processor, or `null` |
| `frames` | `received`, `processed`, `dropped` |
| `streaming` | `fps`, `quality` |
| `selected` | The backend that runs or is declared: `path` and `cfg`, or `null` |
| `configured` | The backend chosen on the robot or in the unit: `path` and `cfg`, or `null` |

### The backend chosen on the robot

The UI saves its choice in `backend.json` in the service's state directory (`/var/lib/raccoon-cam`, `RACCOON_CAM_STATE_DIR` overrides it). The service reads it at start and notices a change by itself: if the camera is open, it restarts with the new backend and keeps its leases. A saved backend that cannot be loaded (the project was deleted, the options no longer fit) is logged as a warning and the service starts without one instead of failing. Deleting the file, or **Reset** in the UI, goes back to the unit's `RACCOON_CAM_BACKEND`.
