---
title: "WiFi"
date: 2024-01-01
draft: false
weight: 5
---

# WiFi

The WiFi section lets you manage all network connections on the robot — including joining existing networks, configuring the robot's own access point, and viewing device information.

---

## Navigating to WiFi

From the dashboard, tap **Settings**, then tap **WiFi**.

> **[PICTURE: WiFi home screen showing current connection status]**

---

## Connection Status

The WiFi home screen shows whether the robot is currently connected to a network or operating as an access point (AP). Current IP addresses are displayed.

---

## Scanning for Networks

Tap **Scan** to see a list of available WiFi networks. Each entry shows:

- Network name (SSID)
- Signal strength indicator

Tap a network to connect to it.

> **[PICTURE: WiFi scan results with network names and signal bars]**

---

## Connecting to a Network

### Standard (Personal) Network

1. Tap **Scan** and select your network from the list, or tap **Manual Connect** and type the SSID yourself
2. Enter the WiFi password when prompted
3. Tap **Connect**

> **[PICTURE: Password entry screen for a selected network]**

### Enterprise Network

For school or corporate networks that require a username and password (WPA2-Enterprise):

1. Tap **Enterprise Connect**
2. Enter the **username**, **password**, and optionally a **certificate** if required by your network
3. Tap **Connect**

---

## Saved Networks

Tap **Saved Networks** to see a list of networks the robot has connected to before. Tap any entry to view its details or delete it.

---

## Access Point (AP) Mode

The robot can broadcast its own WiFi network so you can connect your laptop directly without needing a router. This is the default mode.

Tap **Access Point Config** to change:

- **SSID** (network name)
- **Password**
- **Channel**

Tap **Save** to apply. The robot will restart its AP with the new settings.

> **[PICTURE: Access Point configuration form with SSID and password fields]**

Tap **Access Point Status** to see the current AP settings and how many devices are connected.

---

## LAN Only Mode

If the robot is connected to a wired Ethernet network and you want to disable WiFi, tap **LAN Only**. The status screen confirms that WiFi is off and shows the Ethernet IP.

---

## Device Info

Shows the robot's network information:

- Hostname
- WiFi IP address
- Ethernet IP address (if connected)
- MAC addresses

This page is useful when you need the robot's IP address but cannot see the main dashboard.
