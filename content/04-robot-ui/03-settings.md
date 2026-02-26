---
title: "Settings"
date: 2024-01-01
draft: false
weight: 4
---

# Settings

The Settings section gives you access to display options, touch calibration, and system service monitoring.

---

## Navigating to Settings

From the dashboard, tap the orange **Settings** tile.

---

## Screen Rotation

If the image on the screen is upside down or sideways, tap **Screen Rotation** and select the correct orientation. Options are:

- Portrait (upright)
- Landscape left
- Landscape right
- Portrait upside down

The screen rotates immediately.

> **[PICTURE: Screen rotation selection with four orientation options]**

---

## Touch Calibration

If the touchscreen is not responding accurately — taps register in the wrong position — tap **Touch Calibration**.

A series of crosshair targets appear on the screen. Tap the center of each target as precisely as possible. After all targets are tapped, the calibration is saved.

> **[PICTURE: Touch calibration screen with a crosshair target in the center]**

---

## Service Status

Shows the status of all background system services (daemons) running on the robot. Each service is displayed as a tile with a color indicating its state:

- **Green** — running normally
- **Red / orange** — stopped or failed

Tap a service tile to see more details about that service.

> **[PICTURE: Service status screen with colored tiles for each service]**

### Service Detail Page

Shows the current status of a specific service and provides access to its log. Tap **View Logs** to open a scrollable log viewer for that service. This is useful for diagnosing problems — for example if a motor isn't responding, the stm32 data reader service log may show an error.

---

## Device Info

> **[TODO: Confirm whether there is a Device Info option under Settings in the current botui — check the routes/navigation in the Settings screen]**
