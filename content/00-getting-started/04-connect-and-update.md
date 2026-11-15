---
title: "Connect to the Robot and Update"
author: "Tobias Madlberger, Mario Scholze"
date: 2026-11-15
draft: false
weight: 40
description: "Connect your laptop to the Wombat and keep both sides on the same versions."
---

# Connect to the Robot and Update

## Connect

```bash
raccoon connect 192.168.178.124
```

Replace the IP with the one shown on your Wombat's screen.

On first connect, raccoon will attempt SSH key authentication. If that fails it asks:
> *"Set up SSH key authentication now?"*

Say **yes**. When prompted for a password, use the Wombat's default credentials:
- **User:** `pi`
- **Password:** `raspberrypi`

raccoon will create an SSH key, copy it to the Wombat, and save an API token. From here on, no password is needed.

> **Security:** Change the default password once your setup is complete.

If the robot's IP ever changes, just re-run `raccoon connect <new-IP>`.

## Update

> **Notice:** `raccoon update` is not yet working as intended and should currently not be used.
> For now, just skip this step until this documentation says otherwise.

If raccoon warns about a version mismatch between your laptop and the robot, run:

```bash
raccoon update
```

This checks both sides against the current bundle target and updates anything that's out of date.

---

**Next:** [Configure your hardware](/00-getting-started/05-configure-your-hardware/)
