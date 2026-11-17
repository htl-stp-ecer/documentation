---
title: "CamProcessor"
author: "Mario Scholze"
date: 2026-11-14
draft: false
weight: 10
description: "Write a CamProcessor, declare it with set_processor, and learn how the ProcessorHost runs it and handles failures."
---

# CamProcessor

A `CamProcessor` turns one `Frame` into a list of `Detection`. You inherit from it and override `process`.

```python
import cv2
from raccoon_cam import CamProcessor, Detection, Frame


class BrightSpot(CamProcessor):
    def configure(self, cfg: dict) -> None:
        self.threshold = cfg.get("threshold", 240)

    def process(self, frame: Frame) -> list[Detection]:
        gray = cv2.cvtColor(frame.image, cv2.COLOR_BGR2GRAY)
        _, _, _, (x, y) = cv2.minMaxLoc(gray)
        height, width = gray.shape
        if gray[y, x] < self.threshold:
            return []
        return [Detection(label="bright", x=x / width, y=y / height, w=0.0, h=0.0, confidence=1.0)]
```

The processor never touches the camera or the transport. It receives an image and returns data, which also makes it easy to test with a saved image.

## The methods

| Method | Required | When it is called |
|---|---|---|
| `configure(cfg)` | no | Once, before the first frame. `cfg` is the dict you declared |
| `options`, `description` | no | Declare the options like a backend does ([Options](/01-programming-guide/09-camera/02-backends/#options)). For now only the declaration exists; the UI does not configure processors yet |
| `process(frame)` | **yes** | For every new frame. Must return a `list[Detection]` |
| `handle_command(cmd, data)` | no | When a command is addressed to this processor, for example `calibrate`. Return a result dict, or `None` for an unknown command |
| `close()` | no | On shutdown or when the processor is replaced |

Without an override, `process` raises `NotImplementedError`. The attribute `name` is set by the host to the processor's instance name.

## Declaring a processor

`set_processor` records which processors should run. It takes the class itself, so there is no registration step.

```python
from raccoon_cam import set_processor

set_processor(BrightSpot, cfg={"threshold": 230})
set_processor(BrightSpot, name="dim", cfg={"threshold": 120})
set_processor("src.vision.bright_spot:BrightSpot", name="third")   # by path, nothing imported
```

| Argument | Meaning |
|---|---|
| `processor` | A `CamProcessor` subclass, or a path string `"package.module:ClassName"` |
| `name` | Instance name. Defaults to the class name. Must not contain `/` |
| `cfg` | Dict passed to `configure` |

Declaring the same name again replaces the earlier declaration. `remove_processor(name)` drops it and `get_processors()` returns the declared list. Passing something that is not a `CamProcessor` subclass raises `TypeError`.

Declaring only records. Your program sends the declarations to the service when you call `start` on the client, see [Service and client](../03-service-and-client/).

## Where your class runs

The service imports your class by its module path, so the class has to live in a module that can be imported by that path, for example `src/vision/bright_spot.py` in your project. `set_processor` raises a `ValueError` for a class defined in `__main__` or inside a function, because a separate process cannot load it. Keep processors in their own files.

Passing the path as a string avoids importing the class in your program at all. That matters when the processor module imports OpenCV or a model runtime at the top: with a string, only the service loads them.

## How the host runs processors

`ProcessorHost` is what the service uses to run the processors. You can also use it directly, for example in a test.

```python
from raccoon_cam import ProcessorHost, get_processors

host = ProcessorHost()
host.load(get_processors())
detections = host.process(frame)   # runs every enabled processor
host.close()
```

| Method | Purpose |
|---|---|
| `add(processor, name=None, cfg=None)` | Create, configure and register one processor. Replaces and closes an existing one with the same name |
| `load(specs)` | `add` for each declared spec |
| `remove(name)` | Close and remove |
| `process(frame)` | Run all enabled processors, return all detections |
| `handle_command(name, cmd, data)` | Pass a command to one processor |
| `stats()` | Per-processor timing and failure counts |
| `enable(name)` | Re-enable a processor that was disabled |
| `close()` | Close all processors |

### Failures stay contained

A processor that raises, or whose `process` returns something other than a list of `Detection`, does not stop the host. The failure is counted and passed to the optional `on_error(name, message, disabled)` callback. After five failures in a row (`max_consecutive_failures`) that processor is disabled and skipped, while the others keep running. One successful call resets the count. Errors in `configure` are different: they propagate to the caller of `add`, so a bad configuration is visible right away.

### Timing

`stats()` returns a `ProcessorStats` for each processor with `calls`, `failures`, `last_ms`, `avg_ms` (a moving average), `disabled` and `last_error`. Use `avg_ms` to see how much of the frame time a processor takes on the Raspberry Pi.

> The host measures time but does not enforce a time limit. Python cannot safely interrupt a running function, so a processor that is too slow slows every frame down. Watch `avg_ms`.

### Backends without images

`ProcessorHost(backend=SomeBackend)` refuses to add processors when the backend has `allow_processors = False`, with the message that the backend does not deliver frames. Without the `backend` argument the host accepts everything.
