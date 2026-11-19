---
title: "Getting Started"
author: "Tobias Madlberger, Mario Scholze"
date: 2026-11-19
draft: false
weight: 1
description: "From a flashed SD card to a robot that drives: set up, connect, configure, run a test mission and write your first program."
---

# Getting Started

This section takes you from an empty SD card to a robot that drives. Work through the pages in order; each one ends with a link to the next.

## The zero-to-running-robot journey

```mermaid
flowchart TD
    A([Flash the SD card]) --> B([Set up the robot])
    B --> C([Create a project])
    C --> D([Connect to and update the robot])
    D --> E([Configure your hardware])
    E --> F([Run the program])
    F --> G([Your first program])
    G --> F

    click A "/00-getting-started/01-flash-the-sd-card/"
    click B "/00-getting-started/02-set-up-the-robot/"
    click C "/00-getting-started/03-create-a-project/"
    click D "/00-getting-started/04-connect-and-update/"
    click E "/00-getting-started/05-configure-your-hardware/"
    click F "/00-getting-started/06-run-the-program/"
    click G "/00-getting-started/07-your-first-program/"

    style A stroke:#853585
    style F stroke:#27ae60
    style G stroke:#27ae60
```

The loop at the end is your normal development cycle: write code, run it on the robot, observe, refine. Everything else (flash, connect, update) is one-time setup.

## What you need

- Wombat Controller
- A 8GB SD card with no data on it you wouldn't wanna lose
- Battery pack
- A computer with an internet connection (Windows, Linux or macOS)
- **USB keyboard** — needed once in Step 2 (Set up the robot)
- DC motors wired to motor ports (2 for a differential drivetrain, 4 for mecanum)

## The steps

1. [Flash the SD card](/00-getting-started/01-flash-the-sd-card/)
2. [Set up the robot](/00-getting-started/02-set-up-the-robot/)
3. [Create a project](/00-getting-started/03-create-a-project/)
4. [Connect to and update the robot](/00-getting-started/04-connect-and-update/)
5. [Configure your hardware](/00-getting-started/05-configure-your-hardware/)
6. [Run the program](/00-getting-started/06-run-the-program/)
7. [Your first program](/00-getting-started/07-your-first-program/)

## What comes next

Your robot is running. Here's where to go from here:

| Topic | Where |
|-------|-------|
| Make it drive accurately | [Calibration]({{< ref "/01-programming-guide/05-calibration/_index.md" >}}) |
| Add sensors, servos, and other hardware | [Robot Definition]({{< ref "/01-programming-guide/01-basics/06-robot-definition.md" >}}) — edit `raccoon.project.yml` |
| Writing real missions | [Missions]({{< ref "/01-programming-guide/01-basics/07-missions.md" >}}) |
| Stop conditions, chaining, timing | [Until Conditions]({{< ref "/01-programming-guide/02-driving/03-until-conditions.md" >}}) |
| Sensors, servos, drive system | [Programming Guide]({{< ref "/01-programming-guide/_index.md" >}}) |
| Configure sensor positions visually | [WebIDE]({{< ref "/04-web-ide/_index.md" >}}) — run with `raccoon web` |
| All CLI commands explained | [raccoon-cli reference]({{< ref "/03-raccoon-cli/_index.md" >}}) |
| What you can do from the touchscreen | [BotUI]({{< ref "/05-bot-ui/_index.md" >}}) |
