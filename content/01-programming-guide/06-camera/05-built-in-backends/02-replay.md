---
title: "Replay"
author: "Mario Scholze"
date: 2026-11-19
draft: false
weight: 20
description: "ReplayBackend: plays a video, a folder of images or one image as if it were a camera."
---

# Replay backend

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

It needs OpenCV (`cv2`) as the [USB backend]({{< ref "/01-programming-guide/06-camera/05-built-in-backends/01-usb-camera.md" >}}) does. For the simulator, a processor reads the same kind of frames from a replay as from a camera, but the replay is not a model of the camera: exposure, motion blur and colour balance are those of the recording.

`status()` returns the `state` (`opening`, `running`, `finished`, `failed`, `stopped`), the source, the rate, the frame count and the position.

