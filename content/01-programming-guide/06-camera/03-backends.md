---
title: "Backends"
author: "Mario Scholze"
date: 2026-11-19
draft: false
weight: 30
description: "CamBackend, the sink it pushes into, selecting a backend with set_backend, dependencies and writing your own."
---

# Backends

A backend is the source behind the camera service. The service reads the backend's flags and reacts to whatever the backend pushes, so you can swap a USB camera for a different kind of camera without changing anything else.

## Selecting a backend

```python
from raccoon_cam import set_backend
from raccoon_cam.backends import UsbCameraBackend

set_backend(UsbCameraBackend, {"resolution": (160, 120)})   # the class itself, plus options
```

The second argument holds the backend's options and is optional. `set_backend` raises `TypeError` if you pass something that is not a `CamBackend` subclass, and `ValueError` if `name`, `allow_processors` or `provides_detections` is not set, or if the options do not fit the backend (see [Options](#options)).

There is no default backend. Which one runs is decided in this order:

1. The backend your program declares with `set_backend`. It applies while your program holds the camera.
2. The backend chosen on the robot: in the UI under **Sensors & Actors → Camera → Configure backend**. It is kept on the robot and applies to every program that does not declare its own.
3. The service's own configuration (`RACCOON_CAM_BACKEND`, see [The Service]({{< ref "/01-programming-guide/06-camera/06-service.md" >}})).

If none of them names a backend, `start_camera()` fails with a message that says so.

A backend that delivers no frames (`allow_processors = False`) takes no processors. If your program declares one with `set_backend` and also loads a processor, `start_camera()` raises a `CamConfigError` that says so ([Checking the setup]({{< ref "/01-programming-guide/06-camera/04-processors.md" >}}#checking-the-setup)). Selecting such a backend in a running service removes the processors that are loaded, and the answer lists them in `dropped_processors`.

The selection is only a declaration. The client sends it to the service on `start`, and the service remembers it and uses it when the camera opens. If the camera is already open with a different backend, the service switches. Asking for the backend and options it already runs does not restart the camera.

## Options

A backend declares what it can be configured with as a list of `Option`s. The same list checks the configuration (an unknown name, a wrong type or a value out of range raises `ValueError` that names the option) and is what the UI reads to show a form, so you declare an option once.

```python
from raccoon_cam import CamBackend, Option

class MyCamera(CamBackend):
    name = "my-camera"
    allow_processors = True
    provides_detections = False
    description = "A camera of my own"        # shown in the UI; default: the first line of the docstring
    options = (
        Option("device", "str", "/dev/video2", description="Device path"),
        Option("fps", "int", 15, min=1, max=60, unit="fps"),
        Option("mode", "choice", "fast", choices=("fast", "sharp")),
        Option("flip", "bool", False),
        Option("resolution", "size", (320, 240), unit="px"),
    )

    def configure(self, cfg):
        values = self.validate_config(cfg)   # raises ValueError for a wrong option; typed values
```

| `Option(...)` | Meaning |
|---|---|
| `name`, `type` | `type` is `int`, `float`, `str`, `bool`, `choice` or `size` (`[width, height]`) |
| `default` | Shown in the UI and used when the option is left out |
| `required` | The UI asks for it, and a configuration without it is refused |
| `min`, `max` | Bounds of `int` and `float` |
| `choices` | The values of a `choice` |
| `length` | Fixed length of a `str` (the codec is four characters) |
| `description`, `unit` | Shown next to the field |

`MyCamera.validate_config(cfg)` returns the values as their types or raises `ValueError`. `MyCamera.describe()` returns everything a UI needs as plain JSON types, and imports nothing slow. A backend without `options` accepts any configuration, as before. A `CamProcessor` declares `options` in the same way.

## Backends from your project in the UI

The robot's server lists the backends of your projects next to the built-in ones. It does not run your code to find them: it reads the source of each project (`src/`) and picks every class that inherits from `CamBackend`, directly or through another class of the project. A class whose name starts with `_` is skipped. Only then, when you open a backend in the UI, a separate process imports it to read its `options`. The UI shows `Built-In · usb` or `Project (<name>) · <backend>`.

So for your backend to show up: inherit from `CamBackend` (not from a copy of it), put it in `src/`, and give it `options`. A backend with an error on import still shows up in the list and the UI shows the error when you select it.

You can try what the UI sees without it:

```bash
python3 -m raccoon_cam.describe --builtin                              # the built-in backends as JSON
python3 -m raccoon_cam.describe src.cam.mine:Mine --project-dir ~/my-project
python3 -m raccoon_cam.describe src.cam.mine:Mine --project-dir ~/my-project --validate '{"fps": 30}'
```

## Dependencies of a backend

A backend declares what it needs installed in `requires`. The service checks this when it is about to start the backend, and not before. Selecting a backend, importing `raccoon_cam` and running a program that uses another backend need none of it. If something is missing, `start_camera()` fails at once with the reason and how to install it:

```text
The 'usb' camera backend needs OpenCV (module 'cv2'): install with `sudo apt install python3-opencv` on the robot or `pip install opencv-python-headless` elsewhere
```

| Backend | Needs | On the robot | Elsewhere |
|---|---|---|---|
| `UsbCameraBackend` | OpenCV (`cv2`) | `sudo apt install python3-opencv` | `pip install opencv-python-headless` |
| `ReplayBackend` | OpenCV (`cv2`) | `sudo apt install python3-opencv` | `pip install opencv-python-headless` |

Every backend ships in the `raccoon-cam` package. There are no extras to choose. `pip install raccoon-cam` installs only `numpy` and `raccoon-transport`; the rest is checked when the backend is used. On the robot the image and `raccoon update` install what the built-in backends need (see [The Service]({{< ref "/01-programming-guide/06-camera/06-service.md" >}}#as-a-system-service)). On a laptop nothing is installed unless you ask: run the `pip install` from the table when you want to use the backend there.

For your own backend:

```python
from raccoon_cam import CamBackend, Requirement

class MyAiCamera(CamBackend):
    name = "ai"
    allow_processors = False
    provides_detections = True
    requires = (Requirement("tflite_runtime", label="TFLite", pip="tflite-runtime"),)
```

The same `requires` exists on a `CamProcessor`. It is checked when the processor is loaded in the service, not when you declare it with `load_processor`.

`Requirement(module, label="", pip=None, apt=None)` looks for the import name `module` without importing it. `pip` and `apt` only feed the install hint. Import the heavy library inside `start` or `configure`, not at the top of your module, so that selecting the backend stays free.

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
| `options`, `description` | no | The [options](#options) the backend can be configured with, for checking and for the UI |
| `start_timeout`, `open_retries`, `open_delay` | no | What a program gets by default when it starts the camera, see [Start behaviour](#start-behaviour) |
| `configure(cfg)` | no | Backend options, called before `start` |
| `status()` | no | A dict for the status channel |
| `handle_command(cmd, data)` | no | Backend-level commands, for example exposure. Return a dict, or `None` if unknown |

### Start behaviour

Three class attributes tell a program how long and how often to try. A program that calls `start_camera()` without these arguments gets the backend's values. A program that passes its own arguments wins.

| Attribute | Default | Meaning | Argument of `start_camera` |
|---|---|---|---|
| `start_timeout` | `10.0` s | How long the whole start may take, up to the first data | `timeout` |
| `open_retries` | `10` | How often the device is tried to open before the start counts as failed. `None` tries forever | `retries` |
| `open_delay` | `1.0` s | The pause between those tries | `delay` |

Raise `start_timeout` for a backend that is slow to start. `UsbCameraBackend` sets it to 30 s, because importing OpenCV alone takes more than 10 s on a Raspberry Pi 3. The UI sends no retries and no delay, so it gets the backend's values too. `describe()` and the status (`selected`) show all three. A backend that has a setting of its own for the pause, such as the `retry_delay` option of the USB backend, uses that, and a `delay` from the program wins over both.

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
