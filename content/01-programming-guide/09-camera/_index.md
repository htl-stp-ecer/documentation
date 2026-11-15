---
title: "raccoon-cam"
author: "Mario Scholze"
date: 2026-11-14
draft: false
weight: 90
description: "The camera service: swappable camera backends, CamProcessors that turn images into data, and a client for your program. Work in progress: runs in tests, not yet on a robot."
aliases:
  - /09-raccoon-cam/
---

# raccoon-cam

`raccoon-cam` is the camera part of RaccoonOS, split out of individual robot projects. A service owns the camera and runs your image processing, and your program reads the results through a small client.

> **Work in progress.** The package, the service and the client are written and tested against an in-memory bus and a fake camera. They have not run on a robot with a real camera yet, and no bundle installs the service. [Status](/01-programming-guide/09-camera/04-status/) lists what is verified and what is not.

You work with two kinds of classes, and both are things you can inherit from:

| Class | What it does | You write one when |
|---|---|---|
| `CamBackend` | The source of data: opens a camera and pushes frames or detections | You add a new kind of camera |
| `CamProcessor` | Takes one image, returns data | You want to detect or measure something in the image |

| Page | What it covers |
|---|---|
| [Overview](/01-programming-guide/09-camera/00-overview/) | How the pieces fit together and why processing runs in a service |
| [CamProcessor](/01-programming-guide/09-camera/01-camprocessor/) | Writing a processor, declaring it, and how the host runs it |
| [Backends](/01-programming-guide/09-camera/02-backends/) | `CamBackend`, the USB backend and its options, adding your own backend |
| [Service and client](/01-programming-guide/09-camera/03-service-and-client/) | Running the service, the client API, channels, commands and status |
| [Status](/01-programming-guide/09-camera/04-status/) | What is verified, what is missing, what is still undecided |
