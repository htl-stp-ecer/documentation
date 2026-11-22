---
title: "Built-in Processors"
author: "Mario Scholze"
date: 2026-11-19
draft: false
weight: 60
description: "The processors that ship with raccoon-cam: ColorBlobs."
---

# Built-in Processors

raccoon-cam ships one processor, `ColorBlobs`, for the common case of finding areas of a colour. Anything else is yours: write a `CamProcessor` in your project, see [Processors]({{< ref "/01-programming-guide/06-camera/04-processors.md" >}}). The robot's UI lists the built-in processors and those in your projects, see [A processor chosen in the UI]({{< ref "/01-programming-guide/06-camera/04-processors.md#a-processor-chosen-in-the-ui" >}}).

| Processor | What it does |
|---|---|
| [ColorBlobs]({{< ref "/01-programming-guide/06-camera/06-built-in-processors/01-color-blobs.md" >}}) | Finds areas of named colours, or the one colour in front of the camera |
