---
title: "Camera"
author: "Mario Scholze"
date: 2026-11-19
draft: false
weight: 60
description: "The camera service: swappable camera backends, CamProcessors that you load once and swap while the camera runs, and a client for your program. Work in progress: runs in tests, not yet on a robot."
---

# raccoon-cam

`raccoon-cam` is the camera part of RaccoonOS, split out of individual robot projects. A service owns the camera and runs your image processing, and your program reads the results through a small client.

> **Work in progress.** The package, the service and the client are written and tested against an in-memory bus and a fake camera. They have not run on a robot with a real camera yet, and the service has not run as a system service on a robot. [Status]({{< ref "/01-programming-guide/06-camera/07-status.md" >}}) lists what is verified and what is not.

You work with two kinds of classes, and both are things you can inherit from:

| Class | What it does | You write one when |
|---|---|---|
| `CamBackend` | The source of data: opens a camera and pushes frames or detections | You add a new kind of camera |
| `CamProcessor` | Takes one image, returns data | You want to detect or measure something in the image |

| Page | What it covers |
|---|---|
| [Client API]({{< ref "/01-programming-guide/06-camera/01-client-api.md" >}}) | What your program calls: `set_backend`, `load_processor`, `set_processor`, `start_camera`, reading detections, errors |
| [Concept]({{< ref "/01-programming-guide/06-camera/02-concept.md" >}}) | How the pieces fit together and why processing runs in a service |
| [Backends]({{< ref "/01-programming-guide/06-camera/03-backends.md" >}}) | `CamBackend`, selecting a backend, options, adding your own backend |
| [Processors]({{< ref "/01-programming-guide/06-camera/04-processors.md" >}}) | Writing a `CamProcessor`, loading it, choosing and swapping the active one, and how the host runs it |
| [Built-in Backends and Processors]({{< ref "/01-programming-guide/06-camera/05-built-in-backends-and-processors.md" >}}) | The USB and replay backends, the `ColorBlobs` processor and their options |
| [The Service]({{< ref "/01-programming-guide/06-camera/06-service.md" >}}) | Running the service (project or systemd service), settings, channels, commands and status |
| [Status]({{< ref "/01-programming-guide/06-camera/07-status.md" >}}) | What is verified, what is missing, what is still undecided |
| [Logs and errors]({{< ref "/01-programming-guide/06-camera/08-logs.md" >}}) | The journal, the log of each run, and the errors your program and the UI get |
