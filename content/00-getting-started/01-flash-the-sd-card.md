---
title: "Flash the SD Card"
author: "Tobias Madlberger, Mario Scholze"
date: 2026-11-15
draft: false
weight: 10
description: "Download the RaccoonOS image and flash it to the Wombat's SD card."
---

# Flash the SD Card

Download the latest **RaccoonOS** image from:

> **[github.com/htl-stp-ecer/raccoon-image/releases](https://github.com/htl-stp-ecer/raccoon-image/releases)**

Grab the `.img.xz` file from the most recent release. Then flash it to your SD card:

Use **[Raspberry Pi Imager](https://www.raspberrypi.com/software/)** (Windows, macOS, Linux):
1. Click **Choose OS** → **Use custom** → select the `.img.xz` file
2. Click **Choose Storage** → select your SD card
3. Click **Next** and confirm — it will flash and verify automatically

Alternatively, [Balena Etcher](https://etcher.balena.io/) works just as well: **Flash from file** → select the `.img.xz` → **Select target** → **Flash!**

Then unscrew the lid on the back of the Wombat, insert the SD card, and close it up again.

> If your SD card was pre-flashed with raccoon (e.g. at a workshop), skip to Step 2.
