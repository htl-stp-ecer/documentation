---
title: "Getting Started"
author: "Tobias Madlberger, Mario Scholze"
date: 2026-11-15
draft: false
weight: 1
description: "From a flashed SD card to a robot that drives: set up, connect, configure and run your first mission."
aliases:
  - /04-raccoon-cli/00-quick-start/
  - /00-quick-start/
---

# Getting Started

This section takes you from an empty SD card to a robot that drives. Work through the pages in order; each one ends with a link to the next.

## The zero-to-running-robot journey

```mermaid
flowchart TD
    A([Flash SD card]) --> B([Power on & network])
    B --> C([Create project])
    C --> D([Connect to robot])
    D --> E([Update])
    E --> F([Configure hardware])
    F --> G([raccoon run])
    G --> H([Write missions])
    H --> G

    click A "/00-getting-started/01-flash-the-sd-card/" "Flash the SD card"
    click B "/00-getting-started/02-power-on-and-network/" "Power on and network"
    click C "/00-getting-started/03-create-your-project/" "Create your project"
    click D "/00-getting-started/04-connect-and-update/" "Connect to the robot"
    click E "/00-getting-started/04-connect-and-update/" "Update"
    click F "/00-getting-started/05-configure-your-hardware/" "Configure your hardware"
    click G "/00-getting-started/06-run-it/" "Run it"
    click H "/01-programming-guide/01-basics/06-missions/" "Missions"

    style A stroke:#853585
    style G stroke:#27ae60
    style H stroke:#27ae60
```

The loop at the end is your normal development cycle: write code, run it on the robot, observe, refine. Everything else (flash, connect, update) is one-time setup.

## What you need

- Wombat controller with RaccoonOS flashed to the SD card
- Battery pack
- DC motors wired to motor ports (2 for a differential drivetrain, 4 for mecanum)
- A computer with an internet connection (Windows, macOS or Linux)
- **USB keyboard** — needed once to enter WiFi password on the Wombat

## The steps

1. [Flash the SD card](/00-getting-started/01-flash-the-sd-card/)
2. [Power on and connect to a network](/00-getting-started/02-power-on-and-network/)
3. [Create your project](/00-getting-started/03-create-your-project/)
4. [Connect to the robot and update](/00-getting-started/04-connect-and-update/)
5. [Configure your hardware](/00-getting-started/05-configure-your-hardware/)
6. [Run it and test basic motion](/00-getting-started/06-run-it/)
7. [How Raccoon works](/00-getting-started/07-how-raccoon-works/): the concepts behind the project
8. [Your first robot program](/00-getting-started/08-first-program/)

## What comes next

Your robot is running. Here's where to go from here:

| Topic | Where |
|-------|-------|
| Make it drive accurately | [Calibration]({{< ref "/01-programming-guide/03-calibration/01-calibration.md" >}}) |
| Add sensors, servos, and other hardware | [Robot Definition]({{< ref "/01-programming-guide/01-basics/05-robot-definition.md" >}}) — edit `raccoon.project.yml` |
| Writing real missions | [Missions]({{< ref "/01-programming-guide/01-basics/06-missions.md" >}}) |
| Stop conditions, chaining, timing | [Stop Conditions]({{< ref "/01-programming-guide/02-driving/03-stop-conditions.md" >}}) |
| Sensors, servos, drive system | [Programming Guide]({{< ref "/01-programming-guide/_index.md" >}}) |
| Configure sensor positions visually | [Web IDE]({{< ref "/04-web-ide/_index.md" >}}) — run with `raccoon web` |
| All CLI commands explained | [raccoon-cli reference]({{< ref "/03-raccoon-cli/_index.md" >}}) |
| What you can do from the touchscreen | [BotUI]({{< ref "/05-bot-ui/_index.md" >}}) |
