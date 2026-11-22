---
title: "System Popups"
author: "Jakob Schlögl, Mario Scholze"
date: 2026-11-22
draft: false
weight: 8
---

# System Popups

Some events are too important to wait until you open the right screen. BotUI shows them as a popup or a short message on top of whatever is on the display. This page lists every one of them, what it means, and what to do.

## Overview

| Popup | When | Blocks the screen? |
|-------|------|--------------------|
| [Low Battery](#low-battery) | Battery voltage below 6 V | Yes, until ignored |
| [Hardware Shutdown](#hardware-shutdown) | The motors are latched off | Yes, until recovered |
| [System mismatch](#system-mismatch) | BotUI does not match the installed system | Yes, until acknowledged |
| [Error or warning from the robot](#error-messages) | A service reports an error or a warning | Yes, until acknowledged |
| [Ethernet cable](#ethernet-cable) | A cable is plugged in or pulled out | Question, answer it |
| [Messages at the bottom](#messages-at-the-bottom) | Result of something you did | No |

The two popups that could cover the screen of a running program, **Low Battery** and **Hardware Shutdown**, are **not shown** while a [dynamic screen]({{< ref "/05-bot-ui/05-dynamic-screens.md" >}}) is open. The program owns the display then. They appear again when the program closes the screen.

## Low Battery {#low-battery}

> **Low Battery**
> Battery voltage is 5.38V.
> The robot may restart at any time.
> Please switch the battery now.

It appears when the battery voltage drops below **6 V** (a reading of 0 V, which means "no reading yet", is ignored). The voltage in the text updates live.

| Button | Does |
|--------|------|
| **Ignore** | Needs a second tap, the button then reads **Confirm Ignore**. This keeps a stray tap from hiding the warning. After that the popup stays away until BotUI restarts. |
| **Shutdown** | Powers the robot off. |

Swap the battery rather than ignoring the warning: the robot can restart in the middle of a run. The battery voltage is also shown at the top right of most screens and on the [Dashboard]({{< ref "/05-bot-ui/00-dashboard.md#overview-panel" >}}).

## Hardware Shutdown {#hardware-shutdown}

The STM32 coprocessor can switch off all motors on its own. Then the display shows one of two popups:

**Hardware Watchdog Tripped**: the robot's safety watchdog did not get a heartbeat from the user program, so the motors were shut off.

**Hardware Shutdown Active**: the outputs were switched off on purpose (user-initiated shutdown, for example when `raccoon run` ends).

Both popups list the **latched outputs** (the motors) and have one button, **Recover**. It re-enables the outputs and re-arms the watchdog.

While the shutdown is active, commands from the [motor screens]({{< ref "/05-bot-ui/01-sensors-actors.md#shutdown-guard" >}}) are acknowledged, but nothing moves. That is why the popup is shown, and why the screens ask before they open.

## System mismatch {#system-mismatch}

When BotUI starts, it checks two things against the bundle file `/etc/raccoon-bundle.json`:

1. It was built for the same **transport contract** as the installed system.
2. Its own **version** is the one the bundle names for `botui`.

If one of them is wrong, a popup **System mismatch** covers the screen. For a transport mismatch it lists the hash and transport version of BotUI and what the system expects. For a version mismatch or a broken bundle file it says what is wrong. In every case it ends with **Please flash the latest Raccoon image.**

Tap **Acknowledge** to continue. BotUI does not quit, it is the only screen on the robot. But the `raccoon-server` refuses to run programs until the mismatch is fixed.

Nothing is shown when everything matches, in dev mode (`botui` is `dev` in the bundle), or when BotUI does not run on a Raccoon device. [Settings → Versions]({{< ref "/05-bot-ui/03-settings.md#app-status" >}}) shows the bundle's values. The result of the check is also written to `/run/raccoon/botui.json`, which `raccoon doctor` shows. Background: [Transport contract]({{< ref "/06-advanced/03-transport.md" >}}).

## Errors and Warnings from the Robot {#error-messages}

Services on the robot send a message for the user on the transport channel `messages/error` or `messages/warn`. Each message has a **title** and a **text** (the `message_t` type). BotUI shows it as a dialog with one button, **Acknowledge**:

- An **error** has a red header with a crossed circle and the word **Error**, and a red button.
- A **warning** has a yellow header with a warning triangle and the word **Warning**, and a yellow button.

Below the header the dialog shows the title in bold and the text, centred. A long text scrolls. Use these messages to find the cause when a program fails: for example the STM32 reader reports a defective IMU (**IMU not working**) or a control loop that takes too long (**Slow control loop**), and the camera service reports a camera that cannot be opened (**Camera problem**).

- Only **one** dialog is open at a time. A message that arrives meanwhile waits and opens after you acknowledge. At most three messages wait, when more arrive the oldest waiting one is dropped.
- A message with the same kind and title as the one on screen, or as one that waits, is dropped. A fault that repeats with changing numbers in the text therefore shows one dialog.
- Every message also goes into the BotUI log.

## Ethernet Cable {#ethernet-cable}

The robot reports when a network cable is plugged in or pulled out, and BotUI asks what to do. It only reacts to a *change*: a cable that was already in when BotUI started does not ask, and neither does one that stays plugged in after you answered "Not now".

**Cable plugged in** (and Ethernet mode is off):

> **Ethernet cable connected**
> Do you want to switch to Ethernet Mode?
> Wi-Fi and the hotspot will be turned off.

Tap **Switch** to change the mode, or **Not now**.

**Cable pulled out while in Ethernet mode**: Wi-Fi is off in this mode, so the robot would be unreachable. The popup cannot be dismissed, you have to choose:

> **Ethernet cable unplugged**
> Which mode do you want to switch to?

**WiFi** returns to Wi-Fi mode, **Hotspot** starts the robot's hotspot. Nothing changes until you tap.

While the switch runs, a message "Switching to … Mode…" is shown. Switching can take more than ten seconds (for example while the robot waits for an IP address). The result follows as a success or error message. More about the modes: [Settings → Network]({{< ref "/05-bot-ui/03-settings.md#network" >}}).

## Messages at the Bottom {#messages-at-the-bottom}

Results of actions (a Wi-Fi connection, "Start failed", a saved hostname, "Resetting STM32…") are shown as a small badge at the bottom of the screen. It fades in, stays for about three seconds (longer for some) and fades out. It is **dark grey** for information, **green** for success and **red** for errors. Only one badge shows at a time; a new one replaces the old.
