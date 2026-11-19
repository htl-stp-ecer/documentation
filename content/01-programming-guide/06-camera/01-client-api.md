---
title: "Client API"
author: "Mario Scholze"
date: 2026-11-19
draft: false
weight: 10
description: "Use the camera from your program: set_backend, load_processor, set_processor, start_camera and reading detections."
---

# Client API

This is what your program uses. A `CamClient` talks to the camera service, see [The Service]({{< ref "/01-programming-guide/06-camera/06-service.md" >}}). Your program never loads OpenCV.


```python
from raccoon_cam import (
    UsbCameraBackend, change_processor, load_processor, set_backend, set_processor,
    start_camera, stop_camera,
)

set_backend(UsbCameraBackend, {"resolution": (160, 120)})
load_processor("src.vision.bright_spot:BrightSpot", cfg={"threshold": 230})
load_processor("src.vision.dark_spot:DarkSpot")
set_processor("BrightSpot")


cam = start_camera()        # opens the camera and returns it. There is no separate getter

cam.is_detected("BrightSpot", "bright")
spot = cam.latest("BrightSpot", "bright")   # a Detection, or None

change_processor("DarkSpot")                # swap while the camera runs

stop_camera()               # closes the camera right away
```

Before `start_camera()` you declare the backend with `set_backend`, load at least one processor with `load_processor` (this loads it in the service at once, with the camera still closed) and name the active one with `set_processor`. A backend that delivers no frames takes no processors. [Processors]({{< ref "/01-programming-guide/06-camera/04-processors.md" >}}#load-set-and-change) explains the three calls and [Checking the setup]({{< ref "/01-programming-guide/06-camera/04-processors.md" >}}#checking-the-setup) what a wrong setup looks like.

`start_camera()` creates a default client and returns it. `stop_camera()` gives the camera back. You can also create your own `CamClient(bus=None)`. Without a bus it uses the robot transport from `raccoon-lib`.

## Retries and failure

`start_camera(retries=, delay=, timeout=, exclusive=True)` tries to open the camera `retries` times, `delay` seconds apart (`retries=None` tries forever), and waits at most `timeout` seconds in total, for the service to answer and for the first data. If you leave `retries`, `delay` and `timeout` out, the backend decides: 10 tries, 1 second apart and 10 seconds, unless the backend sets its own values (the USB backend waits 30 seconds, see [Start behaviour]({{< ref "/01-programming-guide/06-camera/03-backends.md" >}}#start-behaviour)). The numbers go to the backend. The USB backend counts failed opens until the first one succeeds. Once the camera has opened, it reconnects forever, so a loose cable during a run does not end the program.

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

A handler that returns nothing makes `cam` `None`. A handler that calls `sys.exit` stops the program. `CamStartTimeout`, a `TimeoutError`, is the error when no data arrives within `timeout` or when the service does not answer. The first start after a boot can take several seconds, because OpenCV is slow to load on a Raspberry Pi 3; raise `timeout` if you see it there.

With a `CamClient` of your own, `client.start(...)` raises `CamStartError` directly, and `client.start(wait_ready=False)` returns at once and fails on the first use, at `wait()` or at `on_fail`.

Calling `start_camera()` again after a failure tries again.

A wrong setup is not a failed camera. If the declarations do not fit together (nothing loaded, the set processor not loaded, a processor with a backend that has no frames), `start_camera()` raises `CamConfigError` before it contacts the service, and `on_fail` does not catch it. The program is at fault, so it stops where the mistake is.

## start

`start_camera()` and `CamClient.start(retries=, delay=, timeout=, exclusive=True, wait_ready=True)` do the following. Both wait for the camera. On failure `start_camera` returns a `FailedCamera` and `CamClient.start` raises.

1. Checks the declarations (`validate_camera(need_backend=False)`). A wrong setup raises `CamConfigError` here and nothing is sent.
2. Connects to the service, unless `load_processor` did already: waits for its status and holds a lease without opening the camera. If no status arrives it fails with "Is raccoon-cam running?".
3. Sends the declared backend, if you called `set_backend`.
4. Loads the declared processors that the service does not have yet (a processor that `load_processor` loaded already is left alone), then sets the active one (`set_processor`).
5. With `exclusive`, removes processors in the service that you did not declare.
6. Takes a lease with `retries` and `delay`. This opens the camera, if it is closed, with the configuration from steps 3 to 5.
7. Waits until the backend has delivered its first frame or detections, or has reported that it gave up.

Sending is idempotent. A processor with the same name, class and options is left alone, so it keeps its state when your program restarts. A changed option replaces the processor. The same holds for the backend: the camera is not reopened if the service already runs that backend with those options.

If the service itself restarts, the client notices the new instance and sends its declarations again.

## When the camera is open

The service runs all the time, but the camera is only open while at least one client holds a lease. A lease is a claim that the client renews every two seconds while it lives.

- `load_processor` connects and takes a lease without opening the camera (`hold`). `start_camera()` takes a lease and opens the camera.
- `stop_camera()` (or `client.stop()`) releases it. If it was the last lease, the service closes the camera immediately and forgets the backend and processors your program declared. The service goes back to its configured backend (the one chosen in the UI, otherwise none) with no processors.
- When your program exits, the client releases the lease on its own.
- If the program dies without releasing (a crash or a kill), the lease runs out after 6 seconds and the service closes the camera.
- If the service itself stands still for more than a second, for example while it imports OpenCV, the leases are extended by that time. The programs could not renew either, so a slow service does not cost them the camera.

For a short use, call `start_camera()` just before and `stop_camera()` right after. If you need the camera often, call `start_camera()` once at the start and keep it open. The program's end closes it.

Closing and opening the camera again is the step that often failed in `drum-bot`. The USB backend now waits until its capture thread has really released the device before it reports the camera as closed, but this is not tested against a real camera yet.

## Reading results

| Method | Returns |
|---|---|
| `detections(source=None, max_age=None)` | All current detections, or only those from one processor |
| `latest(source, label)` | The most confident current detection with that label, or `None` |
| `is_detected(source, label)` | Whether `latest` finds one |
| `age()` | Seconds since the last result, or `None` |
| `status()` | The service status as a dict |

A result older than `max_age` (default 1 second) counts as absent, so a service that stopped publishing does not leave the last detection standing. `source` is the processor's name, or the backend's name for ready-made detections from the backend.

## Controlling the service

| Method | Purpose |
|---|---|
| `set_backend(cls, cfg)` | Declare, and switch the running service |
| `load_processor(processor, name, cfg)` | Add to the pool, and load it in the running service now |
| `set_processor(name)` | Choose the active processor. On a running camera this is `change_processor` |
| `change_processor(name)` | Swap the active processor of the running camera, waits until it is done. A processor that is not loaded raises `CamConfigError` |
| `remove_processor(name)` | Take it out of the pool. If it was active, none is active |
| `processor_command(name, command, data)` | Send a command to one processor, returns its result |
| `backend_command(command, data)` | Send a command to the backend |
| `pause()` / `resume()` | Stop and restart running processors. The camera keeps capturing |
| `stream(fps, quality=None)` | Frame stream for the UI. `0` turns it off |
| `command(name, data)` | The generic call behind all of these |

A command the service rejects raises `CamCommandError` with the reason. A command that gets no answer raises `TimeoutError`. Using the client after a failed start raises `CamStartError`. Switching to a backend that delivers no frames removes all processors, and the answer lists them in `dropped_processors`.

## Errors

| Error | When | Is a |
|---|---|---|
| `CamConfigError` | The setup is wrong: nothing loaded, the set processor is not loaded, `change_processor` to a processor that is not loaded or without a running camera, processors with a backend that has no frames | `ValueError` |
| `CamStartError` | The service does not answer, or the camera cannot be opened | `RuntimeError` |
| `CamStartTimeout` | No data within `timeout` | `CamStartError` and `TimeoutError` |
| `CamCommandError` | The service rejected a command | `RuntimeError` |

`start_camera()` returns a `FailedCamera` for a `CamStartError` and raises a `CamConfigError`.

## Without a service

`FakeCamClient` has the same methods, including `load_processor`, `set_processor`, `change_processor` and `on_fail`, which does nothing because starting never fails. It needs no service and no camera: you hand it detections with `set_detections(...)`. Use it in the simulator and in tests. It records the commands you send in `commands`, keeps the loaded names in `loaded` and the active one in `active`. Like the real client, its `change_processor` raises `CamConfigError` for a processor that is not loaded.
