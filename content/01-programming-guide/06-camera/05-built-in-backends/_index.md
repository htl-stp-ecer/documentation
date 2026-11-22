---
title: "Built-in Backends"
author: "Mario Scholze"
date: 2026-11-19
draft: false
weight: 50
description: "The backends that ship with raccoon-cam: USB camera and replay."
---

# Built-in Backends

Two backends ship with raccoon-cam. Select one with `set_backend`, see [Backends]({{< ref "/01-programming-guide/06-camera/03-backends.md" >}}). To add your own, see [Writing a backend]({{< ref "/01-programming-guide/06-camera/03-backends.md#writing-a-backend" >}}).

| Backend | What it does |
|---|---|
| [USB camera]({{< ref "/01-programming-guide/06-camera/05-built-in-backends/01-usb-camera.md" >}}) | `UsbCameraBackend`: reads a V4L2 camera through OpenCV |
| [Replay]({{< ref "/01-programming-guide/06-camera/05-built-in-backends/02-replay.md" >}}) | `ReplayBackend`: plays a video, a folder of images or one image as if it were a camera |
