---
title: "Processors"
author: "Mario Scholze"
date: 2026-11-19
draft: false
weight: 40
description: "Write a CamProcessor, load it, choose the active one and swap it while the camera runs, check the setup before the program runs, and how the ProcessorHost handles failures."
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
| `options`, `description` | no | Declare the options like a backend does ([Options]({{< ref "/01-programming-guide/06-camera/03-backends.md" >}}#options)). For now only the declaration exists; the UI does not configure processors yet |
| `process(frame)` | **yes** | For every new frame. Must return a `list[Detection]` |
| `handle_command(cmd, data)` | no | When a command is addressed to this processor, for example `calibrate`. Return a result dict, or `None` for an unknown command |
| `close()` | no | On shutdown or when the processor is replaced |

Without an override, `process` raises `NotImplementedError`. The attribute `name` is set by the host to the processor's instance name.

## Load, set and change

Three calls decide which processor runs. Each one has its own job, and you make all three before the camera starts, except the swap.

```python
from raccoon_cam import (
    UsbCameraBackend, change_processor, load_processor, set_backend, set_processor, start_camera,
)

set_backend(UsbCameraBackend)
load_processor(BrightSpot, cfg={"threshold": 230})
load_processor(BrightSpot, name="dim", cfg={"threshold": 120})
load_processor("src.vision.dark_spot:DarkSpot")                 # by path, nothing imported
set_processor("BrightSpot")                                     # the one that runs first

cam = start_camera()
change_processor("dim")                                         # swap, camera keeps running
```

### load_processor

`load_processor(processor, name=None, cfg=None)` puts a processor into the pool and loads it in the service right away: the service imports the module, checks `cfg` against the processor's `options` and calls `configure`. This is the slow part, and it happens at this line and not at `start_camera()`. The call returns the processor's `ProcessorSpec`, and the camera stays closed.

| Argument | Meaning |
|---|---|
| `processor` | A `CamProcessor` subclass, or a path string `"package.module:ClassName"` |
| `name` | Instance name. Defaults to the class name. Must not contain `/` |
| `cfg` | Dict passed to `configure` |

The first `load_processor` connects to the camera service and holds a lease, without opening the camera. If your program dies, the lease runs out after 6 seconds and the service frees what you loaded, so a model does not stay in the memory of the Raspberry Pi. `stop_camera()` frees it at once.

If the service refuses the processor (the module does not import, `cfg` does not fit the options, something it needs is not installed), `load_processor` raises `CamCommandError` with the reason, and the processor is not declared. An earlier declaration with the same name stays as it was.

If no service answers, for example in the simulator, `load_processor` waits one second for it once, then only declares the processor and does not wait again. `start_camera()` loads what is still missing. That one second is the only cost of running the same program without a service.

Loading the same name again replaces the earlier declaration. A processor that is already loaded with the same class and `cfg` is left alone and keeps its state. `remove_processor(name)` takes a processor out of the pool, and if it was the active one, none is active afterwards. `get_processors()` returns the loaded list in the order you loaded it. Passing something that is not a `CamProcessor` subclass raises `TypeError`.

### set_processor

`set_processor(name)` names the processor that runs on the frames and returns the name. Exactly one processor runs at a time. Pass the name the processor was loaded under, which is the class name unless you gave another. A class stands for its default name.

It may come before the `load_processor` call that it refers to, because the program is only checked when the camera starts. A string with a `:` in it is a class path and not a name, so `set_processor("src.vision.dark_spot:DarkSpot")` raises a `ValueError` that tells you to load it first.

### change_processor

`change_processor(name)` swaps the active processor while the camera runs. It waits until the swap is done, so the next frame goes to the new processor. It exists as a function (it uses the camera that `start_camera()` returned) and as a method of `CamClient`.

- The processor must be loaded. If it is not, `change_processor` raises `CamConfigError` and nothing changes. The service checks this as well.
- The detections of the processor you leave are dropped at once, because they say nothing about the new one. The new processor's first result arrives with the next frame.
- The processor you leave stays loaded and keeps its state, so you can swap back.
- It needs a running camera. Before `start_camera()`, use `set_processor`.
- Calling `set_processor` on a running camera does the same as `change_processor`.
- `client.load_processor(...)` also works on a running camera and loads the processor right away. That is the slow step, so do it before you need the processor.

If the service restarts, the client sends the pool and the active processor again, including a swap you made.

Declaring only records. Your program sends the declarations to the service when you start the camera, see [Client API]({{< ref "/01-programming-guide/06-camera/01-client-api.md" >}}).

## A processor chosen in the UI

A processor does not have to be declared in a program. In the robot's UI (**Camera → Configure processor**) you choose a processor, built-in or from a project, and its options. The choice is kept on the robot in `processor.json` next to `backend.json`, and the camera service applies a change at once.

The service loads this processor when the camera opens and no program has processors of its own. It runs on the frames while the UI holds the camera: the picture in the camera menu and the [camera picture widget]({{< ref "/01-programming-guide/06-camera/09-ui-picture.md" >}}) draw its detections. When the last user gives the camera back, the processor is unloaded; the next use loads it again.

A program that loads a processor takes the place of the chosen one: `load_processor` unloads it, and `start_camera` removes processors that the program did not declare (see `exclusive`). A program that loads the processor of the same name keeps it with the configuration of the program. A processor that cannot be loaded (a project that was changed, a missing option) gives an error message and does not keep the camera from opening.

## Checking the setup

A wrong setup should stop the program when it starts, not in the middle of a run. You do not have to call anything for this. The calls themselves refuse what is wrong, and `start_camera()` checks the rest before it contacts the service:

| Where | What is refused (`CamConfigError`) |
|---|---|
| `load_processor` | A name with `/`. A backend that delivers no frames. A class whose `cfg` does not fit its `options` |
| `set_backend` | A backend that delivers no frames while processors are loaded |
| `change_processor` | A processor that is not loaded, or no running camera |
| `start_camera()` | No backend (unless the service has one), no processor loaded, none set, or the set one is not loaded |

`validate_camera()` runs all of these checks on request, without the service and without a camera, and raises one `CamConfigError` that lists every problem. You need it when you want the result at a place of your choice, or for the two checks that need your input: the names you will swap to later, and the import of processor classes.

```python
from raccoon_cam import validate_camera

validate_camera()                          # backend, processors
validate_camera(changes=["dim"])           # also: the program will swap to "dim"
validate_camera(import_classes=True)       # also: import the processors and check their cfg
```

What it checks:

| Check | Error |
|---|---|
| A backend is declared with `set_backend`, and its options fit | `no camera backend`, or the option error |
| At least one processor is loaded | `no processor loaded` |
| A processor is set | `no processor set` |
| The set processor is loaded | `processor 'x' is set but not loaded (loaded: ...)` |
| Every name in `changes` is loaded | `change_processor('x'): that processor is not loaded` |
| A backend that delivers no frames has no processors | `does not deliver frames, so processors cannot be used with it` |
| Names contain no `/` | `must not contain '/'` |
| With `import_classes=True`: each class imports, and its `cfg` fits its `options` | The import or option error, with the processor's name |

`import_classes` is off by default. Importing a processor can load OpenCV, which takes seconds and memory on a Raspberry Pi 3, and the service loads it anyway. Turn it on when you want to find a typo in a path or an option at program start.

`need_backend=False` accepts a program without `set_backend`: the service may be configured with a backend, and the program cannot know whether that backend takes processors. In that case processors are not required, but what you declare must fit together: a set processor has to be loaded, and loading one means setting one.

`start_camera()` runs this check first, with `need_backend=False`, and raises `CamConfigError` without sending anything to the service. It does not return a `FailedCamera`, because the program is at fault and not the camera. A `CamConfigError` is a `ValueError`, so `on_fail` does not catch it.

## Where your class runs

The service imports your class by its module path, so the class has to live in a module that can be imported by that path, for example `src/vision/bright_spot.py` in your project. `load_processor` raises a `ValueError` for a class defined in `__main__` or inside a function, because a separate process cannot load it. Keep processors in their own files.

Passing the path as a string avoids importing the class in your program at all. That matters when the processor module imports OpenCV or a model runtime at the top: with a string, only the service loads them.

## How the host runs processors

`ProcessorHost` is what the service uses to run the processors. You can also use it directly, for example in a test.

```python
from raccoon_cam import ProcessorHost, get_processors

host = ProcessorHost()
host.load(get_processors())        # loads all of them
host.set_active("BrightSpot")      # the one that runs
detections = host.process(frame)   # runs the active processor
host.close()
```

| Method | Purpose |
|---|---|
| `add(processor, name=None, cfg=None)` | Create, configure and register one processor. Replaces and closes an existing one with the same name, which stays the active one if it was |
| `load(specs)` | `add` for each declared spec |
| `remove(name)` | Close and remove. If it was the active one, none is active afterwards |
| `set_active(name)` | Make a loaded processor the one that runs. Raises `KeyError` for a name that is not loaded and changes nothing |
| `active()` | The active name, or `None` |
| `process(frame)` | Run the active processor, return its detections. Empty if none is active or it is disabled |
| `handle_command(name, cmd, data)` | Pass a command to one processor |
| `stats()` | Per-processor timing and failure counts |
| `enable(name)` | Re-enable a processor that was disabled |
| `close()` | Close all processors |

### Failures stay contained

A processor that raises, or whose `process` returns something other than a list of `Detection`, does not stop the host. The failure is counted and passed to the optional `on_error(name, message, disabled)` callback. After five failures in a row (`max_consecutive_failures`) that processor is disabled and skipped. Another processor that you swap to is not affected. One successful call resets the count. Errors in `configure` are different: they propagate to the caller of `add`, so a bad configuration is visible right away.

### Timing

`stats()` returns a `ProcessorStats` for each processor with `calls`, `failures`, `last_ms`, `avg_ms` (a moving average), `disabled` and `last_error`. Use `avg_ms` to see how much of the frame time a processor takes on the Raspberry Pi.

> The host measures time but does not enforce a time limit. Python cannot safely interrupt a running function, so a processor that is too slow slows every frame down. Watch `avg_ms`.

### Backends without images

`ProcessorHost(backend=SomeBackend)` refuses to add processors when the backend has `allow_processors = False`, with the message that the backend does not deliver frames. Without the `backend` argument the host accepts everything.
