---
title: "Screenshots"
author: "Mario Scholze"
date: 2026-11-17
draft: false
weight: 9
---

# Screenshots

BotUI can take a screenshot of its own display. You do not need a laptop for this, only the built-in button.

## Taking a Screenshot

**Click the built-in button (button 10) three times quickly**, within about one second. A short badge appears at the bottom of the display:

> Saved Screenshot as 2026-11-17_14-32-05.png

The badge disappears after three seconds. It is not part of the screenshot. If saving fails, the badge says **Screenshot failed** instead, and the reason is written to the [log]({{< ref "/05-bot-ui/03-settings.md#logs" >}}).

A screenshot shows exactly what BotUI draws, including the camera image, the [Dev Menu]({{< ref "/05-bot-ui/06-dev-menu.md" >}}) and a program's [dynamic screen]({{< ref "/05-bot-ui/05-dynamic-screens.md" >}}). It is 800×480 pixels.

The triple-click does not work in the two games of the Dev Menu (Flappy Wombat and Tilt Maze), because they use the button as their own input.

## Allowing and Blocking Screenshots

The tile **Settings → Display → Screenshots** decides when the triple-click works. Tap it to cycle through three modes: Always → Idle Only → Never → Always.

| Tile label | Triple-click, no program running | Triple-click, program running |
|------------|----------------------------------|-------------------------------|
| **Screenshots: Always** | Takes a screenshot | Takes a screenshot |
| **Screenshots: Idle Only** | Takes a screenshot | Ignored |
| **Screenshots: Never** | Ignored | Ignored |

Details:

- **Always** is the default. It also works while a program runs and over a program's [dynamic screen]({{< ref "/05-bot-ui/05-dynamic-screens.md" >}}), which is useful to document what a program shows.
- **Idle Only** is for robots where a stray triple-click could disturb a run. "A program is running" means the same as for the [Dev Menu]({{< ref "/05-bot-ui/06-dev-menu.md" >}})'s **Stop Program** tile: a program started on the robot itself, or any command the `raccoon-server` reports as running, for example one started from your laptop with `raccoon run`. If the server cannot be reached, BotUI assumes that nothing is running.
- **Never** switches the feature off completely. Use it where nobody should be able to capture the display, for example at a competition.

An ignored triple-click shows nothing on the display. It is only noted in the [log]({{< ref "/05-bot-ui/03-settings.md#logs" >}}). The Flappy Wombat and Tilt Maze games never take screenshots, whatever the mode.

The choice is kept after a reboot.

## Where the Files Are

The images are saved as PNG in `/home/pi/screenshots/`. The file name is the date and time: `YYYY-MM-DD_HH-MM-SS.png`. The folder is created on the first screenshot. BotUI never deletes old screenshots by itsself.
To view them in BotUI, navigate to `Settings → Screenshots`.

To copy them to your computer:

```bash
scp -r pi@<robot>:/home/pi/screenshots .
```

The files will be copied into a new folder called `screenshots` in the current working directory.
