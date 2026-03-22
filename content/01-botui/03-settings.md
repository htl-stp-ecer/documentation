---
title: "Settings"
author: "Jakob Schlögl"
date: 2026-03-05
draft: false
weight: 4
---

# Settings

This page provides access to basic system and display settings.

![IMG: Homepage for settings](/images/botui/settings/botui-settings.png)

## Function Tiles

### Wi-Fi

The Wi-Fi settings provide three different operating modes:

**Wi-Fi Client Mode (1)**
Allows the device to connect to existing wireless networks. New networks can be added manually. Once connected, networks are saved automatically, so the password does not need to be entered again. If a saved network is nearby and the robot has no internet connection, it will automatically reconnect to that network.

> **Note:** A USB keyboard must be plugged into the Wombat to type the WiFi password.

Once connected, tap **Device Info** on the WiFi page to see the assigned IP address — you will need this to connect raccoon-cli from your laptop.

**Troubleshooting:** If the robot connects successfully (status turns green) but your laptop cannot reach it, reboot the Wombat. A known network manager bug occasionally requires this.

**Hotspot Mode (2)**  
Allows the robot to create its own wireless hotspot. The following settings can be configured:
- **Network name (SSID)** (*default*: auto-generated)
- **Password** (*default*: auto-generated)
- **Wi-Fi band** (5 GHz, 2.4 GHz or Auto, *default*: Auto)
- **Security type** (WPA3 Personal, WPA2 Personal or Open, *default*: WPA3 Personal)
- **Hidden** (*default*: off)

The hotspot status is also displayed, showing whether it is **inactive** or **active**. When active, the assigned IP address is shown.

![IMG: Example of using default values to create a new hotspot](/images/botui/settings/wifi-hotspot.png)

**LAN Only Mode (3)**  
Used when the device is connected via an Ethernet (LAN) cable. In this mode, information about the currently connected network is displayed.

All three modes provide a dedicated page that displays detailed network information such as:
- **IP address**
- **SSID**
- **Encryption type**
- **MAC address**

![IMG: Device info example screen](/images/botui/settings/wifi-device-info.png)

### Power

This section contains options for controlling the device's power state.

- **Shutdown**: Powers off the device completely.
- **Reboot**: Restarts the device.

### Calibrate

This option starts the touchscreen calibration process. A Wombat icon appears in the corners and in the center of the screen. The user must tap each one as accurately as possible. The more precise the taps are, the more accurate the screen calibration will be for user input.

### Rotate

Changes the screen orientation. The display can be rotated in 90° increments (90°, 180°, 270°, and 360°).

![IMG: Screen of the rotation options](/images/botui/settings/rotate-screen.png)

### Hide UI

Hides the current user interface and displays the system logs.

### Status

The status page provides an overview of different **systemd services**.  
Each service has its own page where users can **start**, **restart**, **view logs**, and **enable** the service. The current **service status** is also displayed.
![IMG: Example status page of the flutter-ui.service](/images/botui/settings/systemd-status.png)

## Toggles
- **Screensaver**: Enables or disables the screensaver.
