---
title: "Set up the robot"
author: "Tobias Madlberger, Mario Scholze"
date: 2026-11-15
draft: false
weight: 20
description: "Boot the Wombat and join a network: WiFi client, hotspot or LAN."
---

# Set up the robot

Connect the battery and power on the Wombat. On first boot, there will be a message along the lines of "First Boot, please wait..." on the screen. Just let the Wombat be, it will restart automatically. After the restart, you should see the BotUI.

The battery voltage showing "N/A" for the first few minutes is normal, as the STM32 Data Reader first needs to flash the STM32's firmware.
After a bit of time, the voltage should be shown.

During this initial time where a battery voltage isn't available, motor commands, servo commands, digital and analog sensors as well as the IMU won't work. This is normal and nothing to worry about.

## Setting the keyboard layout

First, plug a **USB Keyboard** into the wombat.
Then, navigate to **Settings → System**. Here, you should have two options: **Hostname** and **Keyboard**.

<img src="/images/botui/settings/system.png">

To change your keyboard layout, go into **Keyboard** and select the correct one. By default, **American (US)** is selected.
If you changed your keyboard layout, you must restart the wombat for it to take effect.

Currently, the following keyboard layouts are supported:
- American (US)
- German/Austrian (DE/AT)

Others aren't supported. If you really want support for your layout, consider opening a PR or issue in the [BotUI Repository](https://github.com/htl-stp-ecer/botui).

## Setting the Wombat's hostname

First, plug in a **USB Keyboard**.

Then, to set the Wombat's hostname, go into **Hostname**, and then enter the new hostname for your wombat.

The wombat will be reachable via this name followed by `.local` in the network, which means instead of running `raccoon connect 192.168.1.123`, you can use `raccoon connect my-robot.local`.

## Connecting to WiFi

The Wombat supports three connection modes. Open **Settings → Network → Manage Connection** in the BotUI to choose one:

| Mode | When to use |
|------|-------------|
| **WiFi** | Join your existing WiFi network |
| **Hotspot** | Wombat creates its own network — your laptop connects to it |
| **Ethernet** | Plug in an ethernet cable (peer-to-peer also works) |

For **WiFi** mode:
1. Select **WiFi** and press **Scan Networks**
2. Scroll to your network and tap it
3. Enter the password using a **USB keyboard** plugged into the Wombat
4. When the status turns green, go back and tap **Device Info** to see the IP address

For **Hotspot** mode, select **Hotspot** and start it with the default values. The Wombat then creates a network named **`RaccoonOS`** with the password **`raccoonos`**. Connect your laptop to it, then tap **Device Info** to see the IP address. You can change the name and password in the hotspot settings.

**If the robot isn't reachable after connecting:** this is a known network manager issue. Reboot the Wombat and it will reconnect.

→ See [BotUI documentation]({{< ref "/05-bot-ui/_index.md" >}}) for full detail on all connection modes.
