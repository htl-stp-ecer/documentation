---
title: "Web IDE"
author: "Florian Schwanzer"
date: 2026-03-22
draft: false
weight: 1
---

# Web IDE

The Web IDE is a browser-based interface for configuring your robot and building missions visually.

## Starting the Web IDE

```bash
raccoon web
```

Run this from inside your project folder. raccoon starts a local server and opens the Web IDE in your browser.

## Sensor Configuration (Required if you use sensors)

If your robot has IR sensors or other sensors defined in `config/hardware.yml`, you **must** configure their positions in the Web IDE before your robot will behave correctly.

Open the **Settings** menu in the Web IDE and:

1. **Place each sensor** on the virtual robot diagram to match its physical position on your real robot — enter the actual measurements in millimetres
2. **Set the rotation center** — the point your robot physically rotates around (usually the midpoint between the driven wheels)

These values are used by the drive system and lineup algorithms. If they are wrong, `drive_forward()` distances and `lineup_on_black()` behaviour will be off.

> **TODO:** Add screenshots of the sensor placement UI.
