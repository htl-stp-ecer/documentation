---
title: "Programs"
date: 2024-01-01
draft: false
weight: 3
---

# Programs

The Programs section lets you run and calibrate robot programs directly from the touchscreen.

---

## Navigating to Programs

From the dashboard, tap the **Programs** tile.

You will see a list of all programs (projects) available on the robot.

> **[PICTURE: Program selection screen with list of available programs]**

---

## Running a Program

1. Tap the program you want to run
2. A menu appears with available actions — tap **Run**
3. The execution screen opens showing the program's output in real time

> **[PICTURE: Program execution screen with scrolling log output]**

To stop a running program before it finishes, tap the **Stop** button.

---

## Calibrating from the Screen

Some programs support a calibration mode. If the calibration option appears:

1. Tap the program
2. Tap **Calibrate** instead of Run
3. The calibration interface appears — follow any on-screen instructions

This is equivalent to running `raccoon calibrate` from the command line.

---

## Program Output

While a program runs, its output (print statements and log messages) is shown in a scrollable log on the screen. After the program finishes, the log stays visible until you navigate away.

---

## Uploading Programs

Programs are uploaded from your laptop using `raccoon sync` or `raccoon run`. You cannot create or edit programs from the touchscreen — editing always happens on your laptop and changes are pushed to the robot via raccoon.
