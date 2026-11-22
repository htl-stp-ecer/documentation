---
title: "Camera picture in a UI screen"
author: "Mario Scholze"
date: 2026-11-22
draft: false
weight: 90
description: "Show the live camera picture, with the detections drawn over it, in a dynamic UI screen of your program with one widget."
---

# Camera picture in a UI screen

`CamFeed` is a widget for the dynamic UI screens of a program. It shows the live picture of the camera on the robot's display, with the detections drawn over it. The program starts nothing for it.

```python
from raccoon.ui import UIScreen
from raccoon.ui.widgets import Column, Text
from raccoon_cam.ui import CamFeed


class LookScreen(UIScreen[None]):
    title = "Look"

    def build(self):
        return Column(children=[Text("What the camera sees"), CamFeed()])
```

While the widget is on the display, the UI takes a lease on the camera and turns the frame stream on. It gives both back when the screen is gone, and the stream is set to what it was before. A program that uses the camera at the same time keeps working, because leases add up (see [The Service]({{< ref "/01-programming-guide/06-camera/06-service.md" >}})).

The camera needs a backend. Choose one on the robot in the UI (**Camera → Configure backend**), or select it in the program with `set_backend` (see [Backends]({{< ref "/01-programming-guide/06-camera/03-backends.md" >}})).

## Options

| Option | Default | Meaning |
|--------|---------|---------|
| `id` | `"cam_feed"` | The id of the widget. The value of the widget is the position of the last tap. |
| `show_fps` | `False` | Show the frame rate in the top left corner of the picture. |
| `show_detections` | `True` | Draw a box and a label for every detection over the picture. |
| `tappable` | `False` | A tap on the picture sets the value of the widget. |
| `width` | `None` | Width in pixels. The height follows the shape of the picture. |
| `height` | `None` | Height in pixels. The width follows the shape of the picture. |
| `fit` | `"contain"` | In a box with both `width` and `height`: `"contain"` shows all of the picture with black bars where the shapes differ, `"cover"` fills the box and cuts off what does not fit. |

Without `width` and `height` the picture fills the width that its place in the layout gives it, and its height follows the shape of the picture. You can also shape it with the layout, for example `Split(left=[CamFeed()], right=[...], ratio=(5, 3))`.

```python
CamFeed(width=240, height=240, fit="cover")   # a square, the picture cut off at the sides
```

## Detections

The detections that the processors return are drawn on the picture as it is shown. A box is placed by the centre and the size of the detection, as fractions of the frame, so it stays on the object when the picture is shown smaller, with bars or cut off.

## Taps

With `tappable=True`, a tap sets the value of the widget to `{"x": ..., "y": ...}`, the position of the tap as a fraction of the picture, from 0 to 1. A tap on a black bar beside the picture is ignored. Read the value in the screen with `self.get_value("cam_feed")`, or with the `id` that you gave.

## Requirements

`raccoon_cam.ui` needs raccoon-lib, which provides the base class of the widgets and the screens. `import raccoon_cam` does not import it.
