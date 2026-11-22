---
title: "USB camera"
author: "Mario Scholze"
date: 2026-11-19
draft: false
weight: 10
description: "UsbCameraBackend: a V4L2 camera through OpenCV, with its options."
---

# USB camera backend

`UsbCameraBackend` reads a V4L2 camera through OpenCV. It delivers frames and no detections (`allow_processors = True`, `provides_detections = False`).

Capture runs on its own thread, and the device is opened on that thread. If the camera is missing, the backend retries, so `start` returns immediately and a camera that enumerates late at boot does not stop the service. How often it tries before the first open, and how long it waits between tries, comes from the client (`start_camera(retries=10, delay=1.0)`). When the tries run out it reports the failure with `sink.failed`. After the first successful open it never gives up. If reads fail repeatedly, it closes the device and opens it again.

It needs OpenCV (`cv2`), see [Dependencies of a backend]({{< ref "/01-programming-guide/06-camera/03-backends.md#dependencies-of-a-backend" >}}). OpenCV is only needed once this backend is used.

| Option | Default | Meaning |
|---|---|---|
| `device` | `"/dev/video0"` | Index or path. A string of digits is treated as an index. The default means the USB camera wherever it is: after it left the bus and came back it is `/dev/video1`, and the backend finds it there |
| `resolution` | `(320, 240)` | Requested `(width, height)` |
| `fps` | `15` | Requested frame rate, also used to throttle capture |
| `codec` | `"MJPG"` | Four-character code |
| `retry_delay` | `1.0` | Seconds between open attempts, at least `0.01`. `start_camera(delay=...)` overrides it |
| `max_read_failures` | `30` | Failed reads in a row before the device is reopened, at least `1` |

An unknown option raises `ValueError`, so a typo does not pass silently. A failed open is reported to the sink (and so to the UI) when the backend gives up after its last attempt. While attempts are left it is only in the journal and the status, because a USB camera needs a few seconds to come back right after it was closed. A backend without a limit of attempts, and a camera that was open before and is gone, report after 5 seconds of failing, at the first such attempt and every tenth one after it. Failed reads that end in a reopen are a warning in the journal.

`status()` returns the current `state` (`opening`, `running`, `reconnecting`, `stopped`), the settings, the frame count, the number of open attempts and the last error.

A camera that cannot be opened is reset after every third failed attempt, like unplugging it and plugging it in again. That frees a camera that answers every request with an error (`Failed to set UVC probe control : -71` in `dmesg`). A UVC camera is also kept out of USB power saving, so it does not leave the bus while it is idle. Both come with the package on the robot.
