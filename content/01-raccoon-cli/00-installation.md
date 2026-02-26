---
title: "Installation"
date: 2024-01-01
draft: false
weight: 1
---

# Installation

raccoon needs to be installed in two places:

1. **Your laptop** — where you write code and run raccoon commands
2. **The Raspberry Pi on the robot** — where the raccoon server daemon runs

---

## Installing on Your Laptop

Open a terminal and run:

```bash
pip install raccoon
```

Verify the installation:

```bash
raccoon --help
```

You should see the list of available commands. If the command is not found, make sure Python's script directory is in your system `PATH`.

> **[TODO: Add a note here about how to add Python scripts to PATH on Windows if needed — check whether raccoon actually requires this]**

---

## Installing on the Robot (Raspberry Pi)

SSH into the robot:

```bash
ssh pi@192.168.4.1
```

Then install raccoon and the server daemon:

```bash
pip install raccoon
sudo raccoon-server install
```

`raccoon-server install` registers a background service that starts automatically when the robot boots. You only need to do this once per robot.

---

## Verifying the Setup

With the robot powered on and your laptop connected to its WiFi:

```bash
raccoon connect 192.168.4.1
raccoon status
```

If you see "Connected" in the output, everything is working correctly.
