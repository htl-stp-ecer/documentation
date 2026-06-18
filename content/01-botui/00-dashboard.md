---
title: "Dashboard"
author: "Jakob Schlögl"
date: 2026-06-18
draft: false
weight: 1
---

# Dashboard

The Dashboard is the first screen shown after BotUI boots. It is a single full-screen view with three vertically stacked tiles that navigate to the three main areas of the application.

![IMG: Dashboard Screen on the Bot UI](/images/botui/botui-dashboard.png)

## Tile Layout

The tiles are arranged in a single column and sized using `flex` weights, so the screen is always fully filled regardless of resolution:

| Tile | Flex weight | Destination |
|------|-------------|-------------|
| Sensors & Actors | 1 (smaller) | Sensor graphs and actor controls |
| **Programs** | **2 (large, center)** | Program list and execution |
| Settings | 1 (smaller) | System and device configuration |

The Programs tile is intentionally the largest because it is the most-used feature during a competition run. Tap any tile to navigate to that section; use the back arrow in the top bar to return to the Dashboard from any sub-screen.

## Screensaver

When the Dashboard is idle, BotUI shows an animated robot face (the screensaver). The screensaver activates only on the Dashboard screen — it is not shown on any other page.

The screensaver is **enabled by default**. You can toggle it on or off under **Settings → Display → Screensaver**. The tile label on the Display settings screen reflects the current state: it reads "Screensaver On" (cyan) when enabled, or "Screensaver Off" (grey) when disabled. The setting is persisted across reboots via `SharedPreferences`.

When the screensaver is active, any tap on the screen dismisses it and returns to the normal Dashboard view.