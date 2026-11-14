---
title: "Service and client"
author: "marios271"
date: 2026-11-14
draft: false
weight: 35
description: "Run the camera service, use the CamClient from your program, and the channels, commands and status behind them."
---

# Service and client

The `CamService` is one process that runs a backend and the processors and publishes the results. Your program talks to it through a `CamClient`. Neither side imports the other's heavy parts: your program never loads OpenCV.

## Running the service

```bash
python3 -m raccoon_cam.service
```

Without options it runs the USB camera backend. You can set options as flags or as environment variables, which is easier in a unit file:

| Flag | Environment | Meaning |
|---|---|---|
| `--backend` | `RACCOON_CAM_BACKEND` | `module:Class` of the backend. Default: the USB camera |
| `--backend-cfg` | `RACCOON_CAM_BACKEND_CFG` | JSON with the backend's options |
| `--project-dir` | `RACCOON_CAM_PROJECT_DIR` | Added to `sys.path`, so processors and backends from your project can be imported |
| `--stream-fps` | `RACCOON_CAM_STREAM_FPS` | Rate of the frame stream for the UI. `0` is off, which is the default |
| `--jpeg-quality` | `RACCOON_CAM_JPEG_QUALITY` | JPEG quality of that stream. Default 60 |

If the backend cannot start, for example because OpenCV is missing, the service stays up and reports the error. A client can then select another backend.

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

`packaging/raccoon-cam.service` in the `raccoon-cam` repository is a unit file template with `Restart=always` and a lower priority than the robot program (`Nice=5`). No bundle installs it yet.

## The client in your program

```python
from raccoon_cam import set_backend, set_processor, start_camera, stop_camera, UsbCameraBackend

set_backend(UsbCameraBackend, {"resolution": (160, 120)})
set_processor("src.vision.bright_spot:BrightSpot", cfg={"threshold": 230})

cam = start_camera()        # opens the camera and returns it. There is no separate getter

cam.is_detected("BrightSpot", "bright")
spot = cam.latest("BrightSpot", "bright")   # a Detection, or None

stop_camera()               # closes the camera right away
```

`start_camera()` creates a default client and returns it. `stop_camera()` gives the camera back. You can also create your own `CamClient(bus=None)`. Without a bus it uses the robot transport from `raccoon-lib`.

### Retries and failure

`start_camera(retries=10, delay=1.0, timeout=None, exclusive=True)` tries to open the camera `retries` times, `delay` seconds apart (`retries=None` tries forever). The numbers go to the backend. The USB backend counts failed opens until the first one succeeds. Once the camera has opened, it reconnects forever, so a loose cable during a run does not end the program.

`start_camera()` waits until the camera delivers its first data. A camera that works is returned. If it cannot be opened, you get a `FailedCamera` instead. It is falsy, so you can check it:

```python
cam = start_camera()
if not cam:
    ...                     # no camera
```

A `FailedCamera` is not `None`, on purpose: any other use of it raises the `CamStartError` with the reason, so a program that ignores the failure stops at the first use of the camera and not with an obscure `AttributeError`. `cam.error` holds the error.

To handle the failure in one line, chain `on_fail`:

```python
cam = start_camera(retries=3, delay=0.5).on_fail(handler)
```

If the camera works, `on_fail` returns it and the handler does not run. If not, it calls `handler(error)` and returns what the handler returns. The handler can swap in another camera:

```python
cam = start_camera().on_fail(lambda err: FakeCamClient())
```

A handler that returns nothing makes `cam` `None`. A handler that calls `sys.exit` stops the program. `CamStartTimeout`, a `TimeoutError`, is the error when no data arrives within `timeout` (default `retries * delay + 5` seconds) or when the service does not answer.

With a `CamClient` of your own, `client.start(...)` raises `CamStartError` directly, and `client.start(wait_ready=False)` returns at once and fails on the first use, at `wait()` or at `on_fail`.

Calling `start_camera()` again after a failure tries again.

### start

`start_camera()` and `CamClient.start(retries=10, delay=1.0, timeout=None, exclusive=True, wait_ready=True)` do the following. Both wait for the camera. On failure `start_camera` returns a `FailedCamera` and `CamClient.start` raises.

1. Waits for the service's status. If none arrives it fails with "Is raccoon-cam running?".
2. Sends the declared backend, if you called `set_backend`, and every declared processor.
3. With `exclusive`, removes processors in the service that you did not declare.
4. Takes a lease with `retries` and `delay`. This opens the camera, if it is closed, with the configuration from steps 2 and 3.
5. Waits until the backend has delivered its first frame or detections, or has reported that it gave up.

Sending is idempotent. A processor with the same name, class and options is left alone, so it keeps its state when your program restarts. A changed option replaces the processor. The same holds for the backend: the camera is not reopened if the service already runs that backend with those options.

If the service itself restarts, the client notices the new instance and sends its declarations again.

### When the camera is open

The service runs all the time, but the camera is only open while at least one client holds a lease. A lease is a claim that the client renews every two seconds while it lives.

- `start_camera()` takes a lease and opens the camera.
- `stop_camera()` (or `client.stop()`) releases it. If it was the last lease, the service closes the camera immediately and forgets the backend and processors your program declared. The service goes back to the default backend with no processors.
- When your program exits, the client releases the lease on its own.
- If the program dies without releasing (a crash or a kill), the lease runs out after 6 seconds and the service closes the camera.

For a short use, call `start_camera()` just before and `stop_camera()` right after. If you need the camera often, call `start_camera()` once at the start and keep it open. The program's end closes it.

Closing and opening the camera again is the step that often failed in `drum-bot`. The USB backend now waits until its capture thread has really released the device before it reports the camera as closed, but this is not tested against a real camera yet.

### Reading results

| Method | Returns |
|---|---|
| `detections(source=None, max_age=None)` | All current detections, or only those from one processor |
| `latest(source, label)` | The most confident current detection with that label, or `None` |
| `is_detected(source, label)` | Whether `latest` finds one |
| `age()` | Seconds since the last result, or `None` |
| `status()` | The service status as a dict |

A result older than `max_age` (default 1 second) counts as absent, so a service that stopped publishing does not leave the last detection standing. `source` is the processor's name, or the backend's name for ready-made detections from the backend.

### Controlling the service

| Method | Purpose |
|---|---|
| `set_backend(cls, cfg)` | Declare, and switch the running service |
| `set_processor(processor, name, cfg)` | Declare, and add to the running service |
| `remove_processor(name)` | Remove it |
| `processor_command(name, command, data)` | Send a command to one processor, returns its result |
| `backend_command(command, data)` | Send a command to the backend |
| `pause()` / `resume()` | Stop and restart running processors. The camera keeps capturing |
| `stream(fps, quality=None)` | Frame stream for the UI. `0` turns it off |
| `command(name, data)` | The generic call behind all of these |

A command the service rejects raises `CamCommandError` with the reason. A command that gets no answer raises `TimeoutError`. Using the client after a failed start raises `CamStartError`. Switching to a backend that delivers no frames removes all processors, and the answer lists them in `dropped_processors`.

### Without a service

`FakeCamClient` has the same methods, including `on_fail`, which does nothing because starting never fails. It needs no service and no camera: you hand it detections with `set_detections(...)`. Use it in the simulator and in tests. It records the commands you send in `commands`.

## How frames are handled

The backend pushes frames from its own thread. A worker thread takes the newest one and runs the processors. A frame that arrives while the worker is still busy replaces the waiting one and counts as dropped, so the service always works on a fresh image and never builds a queue. `status` shows the counts under `frames`.

## Channels

| Channel | Direction | Content |
|---|---|---|
| `raccoon/cam/detections` | service to clients | `cam_detections_t`, retained. Detections of all processors and the backend together |
| `raccoon/cam/frame` | service to UI | `cam_frame_t` with a JPEG. Only if the stream is on |
| `raccoon/cam/cmd` | client to service | `string_t` with JSON: `request_id`, `command`, `data` |
| `raccoon/cam/response` | service to clients | `string_t` with JSON: `request_id`, `ok`, `data` |
| `raccoon/cam/status` | service to clients | `string_t` with JSON, retained, every 2 seconds and on changes |
| `raccoon/cam/error` | service to clients | `string_t` with JSON `message` and `context`, retained |
| `raccoon/errors` | service to UI | The same errors as plain text, prefixed with `raccoon-cam:` |

`cam_blob_t` has no field for the source, so the label on the wire is `source/label`, for example `BrightSpot/bright`. The client splits it again, which is why processor names must not contain `/`. A detection from a backend carries the backend's name as source.

> The existing `drum-bot` vision daemon uses the same channel names with different commands. Do not run both at once.

### Commands

| Command | `data` | Result |
|---|---|---|
| `ping` | | `instance_id` |
| `status` | | The status |
| `acquire` | `lease`, `ttl`, `retries`, `delay` | Takes a lease and opens the camera if it is closed |
| `renew` | `lease`, `ttl` | Extends a lease. Fails if the service does not know it |
| `release` | `lease` | Gives a lease back. The last one closes the camera |
| `set_backend` | `path`, `cfg` | `changed`, `dropped_processors` |
| `set_processor` | `path`, `name`, `cfg` | `changed`, `name` |
| `remove_processor` | `name` | |
| `processor_command` | `name`, `command`, `data` | The processor's result |
| `backend_command` | `command`, `data` | The backend's result |
| `pause`, `resume` | | |
| `stream` | `fps`, `quality` | The settings now in effect |

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
| `processors` | Per processor: `path`, `calls`, `failures`, `disabled`, `avg_ms`, `last_ms`, `last_error` |
| `frames` | `received`, `processed`, `dropped` |
| `streaming` | `fps`, `quality` |
