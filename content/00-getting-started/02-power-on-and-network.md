---
title: "Power On and Connect to a Network"
author: "Tobias Madlberger, Mario Scholze"
date: 2026-11-15
draft: false
weight: 20
description: "Boot the Wombat and join a network: WiFi client, hotspot or LAN."
---

# Power On and Connect to a Network

Connect the battery and power on the Wombat. After a few seconds the **BotUI** touchscreen dashboard appears — that's your confirmation it booted correctly.

The Wombat supports three connection modes. Open **Settings → WiFi** in BotUI to choose one:

| Mode | When to use |
|------|-------------|
| **WiFi Client** | Join your existing WiFi network |
| **Hotspot** | Wombat creates its own network — your laptop connects to it |
| **LAN** | Plug in an ethernet cable (peer-to-peer also works) |

For **WiFi Client** mode:
1. Select **WiFi Client** from the dropdown and click **Connect to WiFi**
2. Scroll to your network and tap it
3. Enter the password using a **USB keyboard** plugged into the Wombat
4. When the status turns green, go back and tap **Device Info** to see the IP address

> Note the IP — you'll need it shortly. Example: `192.168.178.124`

For **Hotspot** mode, select **Hotspot** and start it with the default values. The Wombat then creates a network named **`RaccoonOS`** with the password **`raccoonos`**. Connect your laptop to it, then tap **Device Info** to see the IP address. You can change the name and password in the hotspot settings.

**If the robot isn't reachable after connecting:** this is a known network manager issue. Reboot the Wombat and it will reconnect.

→ See [BotUI documentation]({{< ref "/05-bot-ui/_index.md" >}}) for full detail on all connection modes.

---

**Next:** [Create your project](/00-getting-started/03-create-your-project/)
