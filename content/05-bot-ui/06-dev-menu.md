---
title: "Dev Menu"
author: "Jakob Schlögl, Mario Scholze"
date: 2026-11-16
draft: false
weight: 7
---

# Dev Menu

The Dev Menu is the emergency panel of BotUI. It has the few actions you need when something is stuck: stop the running program, restart the UI, reboot the robot, reset the STM32. It also hides two small games.

It works everywhere, also while a program is running and while a [dynamic screen]({{< ref "/05-bot-ui/05-dynamic-screens.md" >}}) covers the display.

## Opening It

**Hold the built-in button (button 10) for 2 seconds.** The Dev Menu opens on top of whatever is on the screen. The back arrow in its top bar closes it again.

It is not a normal screen but an overlay above everything else, even above a program's dynamic screen. That is on purpose: a program that is stuck on its own screen can always be stopped from here.

The button is ignored while Flappy Wombat or Tilt Maze is open, because the games use it.

## Tiles

| Tile | What it does |
|------|--------------|
| **Stop Program** | Cancels the program that is running on the robot. Red while something runs, grey and inactive otherwise. |
| **Restart UI** | Restarts BotUI (`systemctl restart flutter-ui.service`). The screen goes dark for a moment. |
| **Reboot Robot** | Reboots the Pi right away. There is no confirmation, unlike **Settings → System → Reboot**. |
| **Flappy Wombat** | Game, see below |
| **Tilt Maze** | Game, see below |
| **Reset STM32** | Runs `/home/pi/flash_files/reset_coprocessor.sh`, which restarts the STM32 coprocessor. Use it when motors, servos or sensors stop answering. |

### Stop Program

Stop Program asks the `raccoon-server` what is running right now and cancels exactly that. It does not matter whether the program was started on the robot, from your laptop with `raccoon run`, or before BotUI was restarted. The tile checks the server every 2 seconds while the menu is open, so it lights up as soon as a program starts.

If the program cannot be stopped, a message "Could not stop the program (see log)" appears at the bottom. After a stop the menu closes.

BotUI never stops a program by itself, not when you leave the program screen and not when the UI restarts. Stopping is always an action in this menu or a `raccoon` command.

## Flappy Wombat

A Flappy-Bird game with a wombat. The built-in button is the only control: press it to flap, and fly through the gaps in the pipes. The score counts the pipes, and your high score is kept on the robot. A press starts the game, and after a crash a press starts the next round.

## Tilt Maze

A ball in a maze that you steer by tilting the robot. It reads the orientation from the IMU, so it works while you hold the robot in your hands.

1. Hold the robot level and tap **Calibrate & Start**. This sets the current roll and pitch as the zero position.
2. Tilt the robot to roll the ball to the exit.
3. When you reach it, **Maze Complete!** appears with **Play Again** and **Recalibrate**.

During the game, **New Maze** makes another maze, **Calibrate** sets the zero position again and **Reset** puts the ball back at the start. If there is no orientation data from the IMU yet, the game waits and shows "Waiting for IMU…". A chip shows whether the IMU is live and the current pitch and roll.
