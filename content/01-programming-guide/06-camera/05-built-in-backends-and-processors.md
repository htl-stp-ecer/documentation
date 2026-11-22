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

raccoon-cam ships one processor, `ColorBlobs`, for the common case of finding areas of a colour. Anything else is yours: write a `CamProcessor` in your project, see [Processors]({{< ref "/01-programming-guide/06-camera/04-processors.md" >}}).

### ColorBlobs

`raccoon_cam.processors.color:ColorBlobs` finds areas of named colours. It needs OpenCV.

```python
from raccoon_cam import load_processor, set_processor, start_camera

load_processor("raccoon_cam.processors.color:ColorBlobs", cfg={"colors": ["red", "blue"], "min_area": 200})
set_processor("ColorBlobs")
cam = start_camera()

blue = cam.latest("ColorBlobs", "blue")   # the largest blue area, or None
```

For every frame it scales the picture down, converts it to HSV, makes one mask for each colour, cleans the mask up and looks for connected areas. Each area is one `Detection`:

| Field | Value |
|-------|-------|
| `label` | The name of the colour. |
| `x`, `y` | The centre of the area, as fractions of the frame. |
| `w`, `h` | The size of its bounding box, as fractions of the frame. |
| `area` | The area in pixels of the frame, not of the scaled picture. |
| `confidence` | The share of the bounding box that the area fills, 1 for a full rectangle. |
| `color` | The colour the UI draws the box in: the colour of the name, for example red for `red`. |

The areas of a colour come largest first.

| Option | Default | Meaning |
|--------|---------|---------|
| `colors` | `["red", "green", "blue", "yellow"]` | The colours to find, see below. |
| `min_area` | `150` | The smallest area to report, in pixels of the frame. |
| `scale` | `0.5` | The picture is scaled to this fraction (0.1 to 1) before the colours are looked for. Smaller is faster. |
| `blur` | `3` | Size of the blur against noise, in pixels of the scaled picture. 0 for none. |
| `cleanup` | `3` | Size of the clean-up of each mask (removes specks, closes holes), in pixels of the scaled picture. 0 for none. |
| `max_per_color` | `10` | At most this many areas per colour. |

The blur makes an area a little larger than it is, by about the width of the blur at each edge. Set `blur` to 0 when the exact area matters.

#### Colours

A colour is a range in OpenCV's HSV: hue from 0 to 179, saturation and value from 0 to 255. `colors` is a list of the names of the built-in colours, or an object from a name to its range:

```python
cfg = {"colors": {
    "red": None,                                                        # the built-in red
    "drum": {"hsv_low": [150, 60, 80], "hsv_high": [172, 255, 255]},   # a colour of your own
}}
```

The built-in colours are `red`, `orange`, `yellow`, `green`, `cyan`, `blue` and `purple`. They are starting values: no range holds for every light and every camera. Red lies on both sides of the hue wrap (hue near 0 and near 179), so a colour can be a list of ranges, and the built-in red has two:

```python
"red": [{"hsv_low": [0, 120, 70], "hsv_high": [10, 255, 255]},
        {"hsv_low": [170, 120, 70], "hsv_high": [179, 255, 255]}]
```

A colour name has up to 32 characters and no `/`.

#### Calibrating a colour

The ranges that fit your camera and your light come from the picture. The command `calibrate` makes the range of a colour from a region of the last frame and uses it from the next frame on:

```python
cam.processor_command("ColorBlobs", "calibrate", {
    "name": "drum",
    "region": {"x": 0.5, "y": 0.5, "w": 0.1, "h": 0.1},   # the centre and the size, as fractions of the frame
})
# {"name": "drum", "ranges": [{"hsv_low": [...], "hsv_high": [...]}], "pixels": 480}
```

The range holds what the region shows (without the 5 percent of the pixels at each end) plus a margin: 8 in hue, 40 in saturation and in value. Change them with `margin` (`{"h": ..., "s": ..., "v": ...}`) and `trim` (percent). A region that crosses the hue wrap, like red, gives two ranges. The result has the ranges, so that you can keep them in the configuration of your program. A region with little colour (a wall, a shadow) is calibrated too, with a `warning` in the result: its hue says little.

The command `colors` returns the colours that run now, and `presets` the built-in colours with their ranges.

#### Time on the Raspberry Pi 3

Measured per frame on a Raspberry Pi 3 with the other robot services running, on a synthetic picture with four coloured areas:

| Frame | `scale` | 1 colour | 4 colours | 7 colours |
|-------|---------|----------|-----------|-----------|
| 320x240 | 1.0 | 6 ms | 16 ms | 24 ms |
| 320x240 | 0.5 | 3 ms | 7 ms | 12 ms |
| 320x240 | 0.25 | 2 ms | 4 ms | 6 ms |
| 640x480 | 1.0 | 23 ms | 54 ms | 82 ms |
| 640x480 | 0.5 | 7 ms | 20 ms | 24 ms |
| 640x480 | 0.25 | 3 ms | 6 ms | 10 ms |

The time grows with the number of colours and with the number of pixels. With the defaults (four colours, `scale` 0.5) a 320x240 frame takes about 7 ms.
