---
title: "Drum Dispenser"
date: 2024-01-01
draft: false
weight: 6
---

# Drum Dispenser

The Drum Dispenser is a game element dispenser used on the Botball game table. It automatically releases game objects (drums) one at a time on command. It is controlled through a web interface accessible from any device on the same network.

> **[PICTURE: Photo of the physical drum dispenser hardware mounted on the game table]**

---

## Opening the Control Interface

Open a browser and navigate to the dispenser's IP address:

```
http://<dispenser-ip>/
```

> **[TODO: Confirm the default IP address or hostname of the drum dispenser — check botui/spring-2026-gametable configuration]**

The interface has two tabs: **Dispenser** and **Calibrate**.

> **[PICTURE: Drum dispenser web UI showing the Dispenser tab with Start button and status card]**

---

## Dispenser Tab

### Status Card

Shows the current state of the dispenser:

| Status | Color | Meaning |
|---|---|---|
| **Ready** | Green | Dispenser is loaded and waiting to start |
| **Countdown** | Yellow | Counting down before dispensing begins |
| **Dispensing** | Blue/Active | Actively releasing drums |

While dispensing, a progress bar shows how many drums out of 8 have been released (e.g., `3 / 8`).

### Controls

- **Start Dispenser** (green button) — begins the dispensing sequence. Only available when the dispenser is connected and in Ready state.
- **Stop** (red button) — immediately stops the dispenser. This button replaces Start while the dispenser is running.

> **[PICTURE: Dispenser tab with a countdown displayed and the Stop button visible]**

---

## Calibrate Tab

The Calibrate tab lets you set the exact angles for each servo so drums release and reload correctly for your physical setup.

> **[PICTURE: Calibrate tab showing two servo cards with current angle values]**

### Selecting a Servo

Two servos control the dispenser mechanism:

| Servo | GPIO Pin | Controls |
|---|---|---|
| **Servo 1** | GPIO 21 | First drum gate |
| **Servo 2** | GPIO 5 | Second drum gate |

Each servo card shows the current **Reloaded** and **Released** angles. Tap a card to enter calibration mode for that servo.

### Calibrating a Servo

> **[PICTURE: Servo calibration screen with large angle display and slider]**

In calibration mode:

1. **Drag the slider** (0–180°) to move the servo to the desired position. The servo moves in real time as you drag.

2. **Set the Reloaded position** — the angle where the gate holds a drum ready to be released:
   - Move the slider until the mechanism is in the correct loaded position
   - Tap **Save as Reloaded** to save this angle

3. **Set the Released position** — the angle where the gate opens and releases the drum:
   - Move the slider until the mechanism fully opens
   - Tap **Save as Released** to save this angle

You can also tap **Go to Reloaded** or **Go to Released** to jump to a previously saved position.

---

## Connection Status

The header always shows a connection badge:

- **Connected** (green dot) — the browser is communicating with the dispenser
- **Disconnected** (grey/red dot) — connection lost; check the dispenser's power and network

If the connection is lost, refresh the page. If it does not reconnect, verify that the dispenser is powered on and your device is on the same network.
