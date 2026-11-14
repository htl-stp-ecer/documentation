---
title: "Backends"
author: "marios271"
date: 2026-11-14
draft: false
weight: 30
description: "CamBackend, the sink it pushes into, selecting a backend with set_backend, the USB backend and its options, and writing your own."
---

# Backends

A backend is the source behind the camera service. The service reads the backend's flags and reacts to whatever the backend pushes, so you can swap a USB camera for a different kind of camera without changing anything else.

## Selecting a backend

```python
from raccoon_cam import set_backend, get_backend
from raccoon_cam.backends import UsbCameraBackend

set_backend(UsbCameraBackend, {"resolution": (160, 120)})   # the class itself, plus options
get_backend()                                               # the selected class
```

The second argument holds the backend's options and is optional. `set_backend` raises `TypeError` if you pass something that is not a `CamBackend` subclass, and `ValueError` if `name`, `allow_processors` or `provides_detections` is not set. If you never call it, `get_backend()` returns `UsbCameraBackend`, and your program does not tell the service to change anything.

The selection is only a declaration. The client sends it to the service on `start`, and the service remembers it and uses it when the camera opens. If the camera is already open with a different backend, the service switches. Asking for the backend and options it already runs does not restart the camera.

## USB camera backend

`UsbCameraBackend` reads a V4L2 camera through OpenCV. It delivers frames and no detections (`allow_processors = True`, `provides_detections = False`).

Capture runs on its own thread, and the device is opened on that thread. If the camera is missing, the backend retries, so `start` returns immediately and a camera that enumerates late at boot does not stop the service. How often it tries before the first open, and how long it waits between tries, comes from the client (`start_camera(retries=10, delay=1.0)`). When the tries run out it reports the failure with `sink.failed`. After the first successful open it never gives up. If reads fail repeatedly, it closes the device and opens it again.

OpenCV is imported when the backend starts. On the robot it comes from the system package `python3-opencv`; it is not a pip dependency of `raccoon-cam`. If it is missing, `start` raises a `RuntimeError` that says so.

| Option | Default | Meaning |
|---|---|---|
| `device` | `"/dev/video0"` | Index or path. A string of digits is treated as an index |
| `resolution` | `(320, 240)` | Requested `(width, height)` |
| `fps` | `15` | Requested frame rate, also used to throttle capture |
| `codec` | `"MJPG"` | Four-character code |
| `retry_delay` | `1.0` | Seconds between open attempts. `start_camera(delay=...)` overrides it |
| `max_read_failures` | `30` | Failed reads in a row before the device is reopened |

An unknown option raises `ValueError`, so a typo does not pass silently. The first failed open and then every tenth attempt are reported to the sink as errors, not every attempt.

`status()` returns the current `state` (`opening`, `running`, `reconnecting`, `stopped`), the settings, the frame count, the number of open attempts and the last error.

## Writing a backend

Inherit from `CamBackend`, set the three flags, and implement `start` and `stop`.

```python
from raccoon_cam import CamBackend, BackendSink, Detection


class MyAiCamera(CamBackend):
    name = "my-ai"
    allow_processors = False       # this camera sends no images
    provides_detections = True     # it sends results

    def start(self, sink: BackendSink) -> None:
        self._device = open_device()
        self._device.on_result(lambda r: sink.detections([Detection(label=r.name, x=r.x, y=r.y)]))

    def stop(self) -> None:
        self._device.close()
```

| Member | Required | Purpose |
|---|---|---|
| `name`, `allow_processors`, `provides_detections` | **yes** | Flags, `None` until you set them |
| `start(sink)` | **yes** | Open the device and begin pushing. Must not block: use your own thread or the device's callback |
| `stop()` | **yes** | Stop and release the device. Safe to call more than once |
| `configure(cfg)` | no | Backend options, called before `start` |
| `status()` | no | A dict for the status channel |
| `handle_command(cmd, data)` | no | Backend-level commands, for example exposure. Return a dict, or `None` if unknown |

### The sink

The service gives `start` an object with four methods. Call them whenever you have something, from any thread.

| Method | Use |
|---|---|
| `sink.frame(Frame)` | Deliver one image |
| `sink.detections(list[Detection])` | Deliver ready-made results |
| `sink.error(message, **context)` | Report a problem |
| `sink.failed(message)` | Report that you gave up opening the device, then return from your thread. The client raises `CamStartError` |

What a backend sends decides what the service does. Frames go to the processors. Detections go straight to the output. A backend can send both.

Backend classes reach the service by module path, with the same rule as for processors: define yours in an importable module, not in `__main__`. Send options through `configure`: the service calls it once before `start`. It then calls `set_open_policy(attempts, delay)`: how often to try opening the device before the first success (`None` means forever) and the pause between tries. The default does nothing, which is right for a backend that has no device to open.
