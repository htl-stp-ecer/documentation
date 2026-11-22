---
title: "Built-in Backends and Processors"
author: "Mario Scholze"
date: 2026-11-19
draft: false
weight: 50
description: "The USB and replay backends that ship with raccoon-cam, with their options."
---

# Built-in Backends and Processors

## Backends

Two backends ship with raccoon-cam. Select one with `set_backend`, see [Backends]({{< ref "/01-programming-guide/06-camera/03-backends.md" >}}). To add your own, see [Writing a backend]({{< ref "/01-programming-guide/06-camera/03-backends.md" >}}#writing-a-backend).

### USB camera backend

`UsbCameraBackend` reads a V4L2 camera through OpenCV. It delivers frames and no detections (`allow_processors = True`, `provides_detections = False`).

Capture runs on its own thread, and the device is opened on that thread. If the camera is missing, the backend retries, so `start` returns immediately and a camera that enumerates late at boot does not stop the service. How often it tries before the first open, and how long it waits between tries, comes from the client (`start_camera(retries=10, delay=1.0)`). When the tries run out it reports the failure with `sink.failed`. After the first successful open it never gives up. If reads fail repeatedly, it closes the device and opens it again.

It needs OpenCV (`cv2`), see [Dependencies of a backend](#dependencies-of-a-backend). OpenCV is only needed once this backend is used.

| Option | Default | Meaning |
|---|---|---|
| `device` | `"/dev/video0"` | Index or path. A string of digits is treated as an index |
| `resolution` | `(320, 240)` | Requested `(width, height)` |
| `fps` | `15` | Requested frame rate, also used to throttle capture |
| `codec` | `"MJPG"` | Four-character code |
| `retry_delay` | `1.0` | Seconds between open attempts, at least `0.01`. `start_camera(delay=...)` overrides it |
| `max_read_failures` | `30` | Failed reads in a row before the device is reopened, at least `1` |

An unknown option raises `ValueError`, so a typo does not pass silently. A failed open is reported to the sink (and so to the UI) when the backend gives up after its last attempt. While attempts are left it is only in the journal and the status, because a USB camera needs a few seconds to come back right after it was closed. A backend without a limit of attempts, and a camera that was open before and is gone, report after 5 seconds of failing, at the first such attempt and every tenth one after it. Failed reads that end in a reopen are a warning in the journal.

`status()` returns the current `state` (`opening`, `running`, `reconnecting`, `stopped`), the settings, the frame count, the number of open attempts and the last error.

### Replay backend

`ReplayBackend` plays a recording as if it were a camera: a video file, a folder of images, or a single image. The service, the processors and the client run unchanged, so you can develop and test a processor on a laptop without a robot. It delivers frames and no detections (`allow_processors = True`, `provides_detections = False`).

```python
from raccoon_cam import ReplayBackend, set_backend

set_backend(ReplayBackend, {"source": "recordings/field.mov", "fps": 15})
```

| Option | Default | Meaning |
|---|---|---|
| `source` | required | A video file, a folder of images (played in file name order) or one image that repeats |
| `fps` | the video's own rate, `15` for images | Playback rate, at least `0.01` |
| `loop` | `True` (true or false only) | Start again at the end. With `False` the backend stops delivering after the last frame and its state becomes `finished` |
| `resolution` | unchanged | `(width, height)` to scale every frame to |

A source that does not exist, a video that cannot be opened and a folder without images are reported with `sink.failed` at once. The retries of `start_camera` do not apply, because trying again would not help. An unknown option raises `ValueError`. An image in a folder that cannot be read is skipped.

It needs OpenCV (`cv2`) as the USB backend does. For the simulator, a processor reads the same kind of frames from a replay as from a camera, but the replay is not a model of the camera: exposure, motion blur and colour balance are those of the recording.

`status()` returns the `state` (`opening`, `running`, `finished`, `failed`, `stopped`), the source, the rate, the frame count and the position.

## Processors

raccoon-cam ships no processors. The image processing is yours: write a `CamProcessor` in your project, see [Processors]({{< ref "/01-programming-guide/06-camera/04-processors.md" >}}).
