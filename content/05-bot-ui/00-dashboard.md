---
title: "Dashboard"
author: "Jakob Schlögl, Mario Scholze"
date: 2026-11-16
draft: false
weight: 1
---

# Dashboard

The Dashboard is the first screen after BotUI boots, and the root of the app. Every other screen is reached from here, and the back arrow brings you back.

![IMG: Dashboard Screen on the BotUI](/images/botui/botui-dashboard.png)

The screen is split into two halves of equal size: an **overview panel** with the state of the robot, and the **menu** with three big tiles.

## Menu

| Tile | Opens |
|------|-------|
| **Sensors & Actors** | [Sensor graphs, motor and servo control, camera, system health]({{< ref "/05-bot-ui/01-sensors-actors.md" >}}) |
| **Programs** | [The list of programs on the robot]({{< ref "/05-bot-ui/02-programs.md" >}}) |
| **Settings** | [Network, system, display, logs, versions, services]({{< ref "/05-bot-ui/03-settings.md" >}}) |

The three tiles are equally high and fill the whole half. Their colors come from the active [color theme]({{< ref "/05-bot-ui/03-settings.md#color-theme" >}}).

## Overview Panel

The overview panel answers "is the robot ready?" at a glance, without opening anything. From top to bottom it shows:

1. **Identity**: the raccoon logo and the robot's **hostname**.
2. **Network**: an icon and the name of the current connection, and the IP address below it.

   | Icon | Meaning | Name shown |
   |------|---------|------------|
   | Wi-Fi | Connected to a Wi-Fi network | SSID of the network |
   | Tethering | The robot runs its own hotspot | SSID of the hotspot |
   | LAN | Ethernet mode | `Ethernet (Client)` or `Ethernet (Host)` |
   | Wi-Fi off | No connection | `Not connected` |

   `N/A` is shown until the robot has answered for the first time.
3. **Stats**: **Battery** (voltage, two decimals), **CPU** (%), **RAM** (% and used / total MB) and **Disk** (% and used / total GB). These are the same values as in [System Health]({{< ref "/05-bot-ui/01-sensors-actors.md#system-health" >}}).

The panel keeps the last known values while it refreshes, so it never flashes empty. It refreshes when you come back to the Dashboard from another screen, and when the robot reports a network change (cable plugged in, mode switched, hotspot started). It does not poll.

### Where the Panel Sits

Under **Settings → Display** the **Overview** tile cycles through three states, which are saved on the robot:

| State | Landscape | Portrait |
|-------|-----------|----------|
| **Overview Left** (default) | Panel on the left, menu on the right | Panel at the bottom |
| **Overview Right** | Panel on the right | Panel on top |
| **Overview Off** | The menu fills the whole screen | the same |

## Screensaver

After **30 seconds without a touch** the Dashboard shows an animated robot face. Any touch removes it again.

- It only appears from the Dashboard, never on another screen.
- If a [dynamic screen]({{< ref "/05-bot-ui/05-dynamic-screens.md" >}}) is open, the screensaver waits (it checks again every second) and a dynamic screen that opens while it is up removes it.
- The face is drawn from the robot's [personality]({{< ref "/05-bot-ui/03-settings.md#personality" >}}), so every robot looks a bit different. While a program is running the face looks "focused".
- Pressing the built-in button repeatedly annoys the robot. It is a joke, nothing happens to the robot.

The screensaver is **on by default**. Turn it off with the **Screensaver** tile under **Settings → Display**. The choice is saved on the robot.

When the screensaver goes away, the overview panel and the network state refresh once, so anything that changed in the meantime is shown at once.

## Popups on the Dashboard

Some popups can cover the Dashboard (and every other screen): low battery, hardware shutdown, a version mismatch, error messages from the robot, and the Ethernet cable question. They are collected on [System Popups]({{< ref "/05-bot-ui/07-system-popups.md" >}}).

Holding the built-in button for 2 seconds opens the [Dev Menu]({{< ref "/05-bot-ui/06-dev-menu.md" >}}) from anywhere.
