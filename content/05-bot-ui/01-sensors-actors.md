---
title: "Sensors & Actors"
author: "Jakob Schlögl, Mario Scholze"
date: 2026-11-16
draft: false
weight: 2
---

# Sensors & Actors

Sensors & Actors is the diagnostic and manual-control hub of BotUI. Use it to check that a sensor works, to see what a value really looks like over time, to spin a motor or move a servo by hand, and to look at the health of the Pi. Everything on these screens is live.

## How the Data Gets Here

BotUI subscribes to the sensor channels on the [transport]({{< ref "/06-advanced/transport/_index.md" >}}) and pushes the values into Riverpod providers, so the widgets rebuild by themselves. Nothing is requested on demand: whatever `stm32-data-reader` publishes is what you see. Commands (motor power, servo angle, …) go the other way over the same transport.

Every screen follows the same drill-down: pick a category, pick a port, arrive at a screen for that kind of sensor. The back arrow goes up one level.

```mermaid
graph TD
    SEL["Sensor Selection<br/>(category tiles)"]
    SEL --> ANA["Analog 0–5"]
    SEL --> DIG["Digital 0–10"]
    SEL --> MOT["Motor 0–3"]
    SEL --> SRV["Servo 0–3"]
    SEL --> IMU["IMU"]
    SEL --> CAM["Camera"]
    SEL --> SYS["System"]
    SEL --> CALIB["Calib Board"]

    ANA --> GRAPH["Graph screen"]
    DIG --> GRAPH
    MOT --> MOTOR["Motor screen"]
    SRV --> SERVO["Servo screen"]
    IMU --> GRAPH
    IMU --> QUAT["Orientation screen"]
    SYS --> HEALTH["System Health"]
    HEALTH --> HG["Metric graph"]
    HEALTH --> DISK["Disk Usage"]
```

## Sensor Selection

The first screen is a grid of category tiles. The tile for a category with exactly one sensor (Camera, System, Heading) opens that sensor directly, without a list in between.

| Tile | What it opens |
|------|---------------|
| **Analog** | Ports 0–5, each a graph (0–4095) |
| **Digital** | Ports 0–10 as indicator tiles |
| **Motor** | Ports 0–3, each a motor screen |
| **Servo** | Ports 0–3, each a servo screen |
| **IMU** | Gyro, Accel, Magneto, Orientation, Heading |
| **Camera** | The live camera picture |
| **System** | CPU, RAM, disk, temperatures, battery, uptime |
| **Calib Board** | [Calibration Board]({{< ref "/05-bot-ui/04-calibration-board.md" >}}); always shown, grey while no board is connected |

### IMU

All IMU measurements are behind one **IMU** tile. Inside, each measurement is a tile (Gyro, Accel and Magneto have a graph per axis X/Y/Z). The top bar of the IMU screens shows the IMU die temperature and the accuracy of the sensor fusion for the measurement you are looking at (gyro, accel, magneto or orientation).

### Digital Ports

Digital ports are shown as a grid of two rows. Ports 0–4 are on the top row, ports 5–9 on the bottom row, and port 10 stands alone in the right column, labelled **Built-In Button**. A tile shows its state live: a filled circle means the port is pressed / HIGH, an empty circle means LOW. Tap a tile to open the graph of that port.

## Graph Screens

Analog, digital and IMU axes open a scrolling time series: newest value on the right, the graph moves left.

| Sensor | Range of the Y axis |
|--------|--------------------|
| Analog | 0 – 4095 (raw ADC) |
| Digital | 0 – 1 |
| Gyro X / Y / Z | −180 – 180 |
| Accel X / Y / Z | −10 – 10 |
| Magneto X / Y / Z | −256 – 256 |
| Heading | 0 – 360 |

- The graph is sampled every 20 ms and keeps the last **250 samples** (5 s) by default. A thin second line is a moving average over the last 10 samples.
- The **pause** button in the top bar freezes the graph so you can read it. Press it again to continue.
- The blue button next to it switches between **Fixed** (the range from the table above) and **Auto Scale** (fits the graph to the visible data). Use Auto Scale for small changes, for example a gyro at rest.
- The strip below the graph shows the **current** value and the **average**. Tap it to expand: **Min**, **Max**, **Median**, **Std** (standard deviation), a distribution chart of the visible samples, and a **Samples** slider (50 to 1000) that sets how long the graph history is.

## Orientation

**IMU → Orientation** shows the orientation from the quaternion of the IMU as three live curves: **Roll** (red), **Pitch** (green) and **Yaw** (blue), with their current values in degrees above the plot. The top bar shows the IMU temperature and accuracy.

Use it to check that the IMU is mounted the way you think, or that the filter has settled after a reboot. For the calibration board's own IMU there is a [separate screen]({{< ref "/05-bot-ui/04-calibration-board.md" >}}) with an artificial horizon.

## System Health {#system-health}

The **System** tile opens seven cards in two columns. Colored cards show the severity at a glance.

| Card | Shows | Green | Orange | Red |
|------|-------|-------|--------|-----|
| **CPU** | Load in % | up to 60 % | 60–85 % | over 85 % |
| **RAM** | Used / total MB | up to 60 % | 60–85 % | over 85 % |
| **Disk** | Used / total GB | up to 60 % | 60–85 % | over 85 % |
| **CPU Temp** | SoC temperature | up to 50 °C | 50–70 °C | over 70 °C |
| **IMU Temp** | IMU temperature | up to 50 °C | 50–70 °C | over 70 °C |
| **Battery** | Voltage, two decimals | always green | | |
| **Uptime** | Time since boot, e.g. `3h 12m` | grey | | |

Tap a card for more: **CPU**, **RAM** and **Battery** open a graph of that value (same controls as the sensor graphs), **CPU Temp** and **IMU Temp** open one temperature graph with both curves, and **Disk** opens **Disk Usage**. Uptime has no detail screen.

**Disk Usage** scans the directories on the SD card (this takes a moment, a message tells you so) and shows a chart of where the space is used, and how much is free. Look here first if the robot reports a full disk.

## Camera

The **Camera** tile shows the live picture from `raccoon-cam` and draws the detections of the active detector (such as colored blobs) on top of it. The bottom of the screen shows the frame size, the frames per second, and the number of detections. Until the first frame arrives it shows "Waiting for camera frames…" and the channel it listens on, which is the first thing to check when the picture stays empty.

BotUI only displays the picture. The camera is configured with the [raccoon-lib camera API]({{< ref "/01-programming-guide/09-camera/04-status.md" >}}) and `raccoon-cam.service` is managed under [Settings → Services]({{< ref "/05-bot-ui/03-settings.md#services" >}}).

## Motor Screen

A motor port opens a screen with a **mode sidebar** on the left and the control on the right.

| Mode | Control |
|------|---------|
| **POWER** | Circular slider from −100 to +100 (PWM duty in percent) |
| **VEL** | Circular slider from −1500 to +1500 (encoder ticks per second, closed loop) |
| **POS** | Number pad for a target position in encoder ticks, with a velocity selector |
| **GRAPH** | Live plot of back-EMF or position |

**Sliders.** Drag the handle clockwise to increase the value. While the handle moves, the command is sent at most about 30 times per second.

**Position.** Type the target on the number pad (up to 7 digits), flip the sign with `+/−`, set the approach velocity with the arrows (steps of 100, from 0 to 5000), and tap **Go**. The **Relative** switch decides whether the number is an absolute target or a distance from the current position.

**Graph.** A toggle switches between **BEMF** and **position**, sampled at 10 Hz (the last 250 samples). In velocity mode the target velocity is drawn as a reference line on the BEMF graph.

**Status bar.** Below the control, the screen always shows the current **BEMF** and **POS** (encoder position) and a **DONE** chip that lights up when a move-to-position has finished (hidden in graph mode).

### Stop Buttons

Four buttons are always visible at the bottom, whatever the mode:

| Button | What it does |
|--------|--------------|
| **BRAKE** (red) | Passive brake: shorts the motor windings. The motor resists turning without using current, but can still creep. |
| **HOLD** (orange) | Active brake: commands a velocity of 0 and lets the PID loop hold it. This uses current. |
| **OFF** (grey) | Coast: no current, the motor spins freely. |
| **Reset POS** (dark grey) | Sets the encoder counter to 0. |

The motor list also has a full-width **Stop All Motors** button that sets the power of all four motors to 0.

## Servo Screen

A servo port opens a large arc slider with a readout of the commanded angle (`CMD`), the angle reported by the servo (`ACT`), and the current servo mode.

- **Normal range:** 0° to 180°. Moving the handle sends the new position.
- **Danger mode:** the **Danger** button widens the range to −50° … 360° and shows it in red. Angles outside 0–180° can damage the servo or your mechanism, so use it only when you know the hardware allows it. Turning Danger off again clamps the angle back to 0–180°.
- **Fully Disable** cuts the power to the servo; it goes limp and the angle reads 0° again.

The servo list has a **Disable All Servos** button that does this for all four ports.

### Shutdown Guard

When the firmware has motors or servos latched off (after a watchdog trip or a user-initiated shutdown, see [System Popups]({{< ref "/05-bot-ui/07-system-popups.md#hardware-shutdown" >}})), opening a motor or servo port first asks:

> **Motors Disabled** — Shutdown flags are enabled. Motors cannot be controlled until shutdown is disabled.

**Disable** clears the shutdown flag and continues to the screen, **Cancel** goes back. The same dialog says "Servos" for servo ports. Without this guard, commands would be acknowledged but nothing would move.
