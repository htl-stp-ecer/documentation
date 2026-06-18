---
title: "Sensors & Actors"
author: "Jakob Schlögl"
date: 2026-06-18
draft: false
weight: 2
---

# Sensors & Actors

The Sensors & Actors screen is the diagnostic and manual-control hub of BotUI. Tap its tile on the Dashboard to open the sensor-selection screen, which presents a grid of tiles — one per sensor group (or per individual sensor when only one exists in a group). Every tile routes to a dedicated screen appropriate to that sensor type: a time-series graph, a radial control, a system health dashboard, or a 3D visualisation.

## Sensor-Selection Screen

When you open Sensors & Actors you land on a grid of category tiles. The categories that appear depend on what sensors are detected at runtime:

| Tile label | What it opens |
|---|---|
| **Analog** | Category list of analog ports 0–5 (graph, range 0–4095) |
| **Digital** | Category list of digital ports 0–10 (live HIGH/LOW indicator tiles) |
| **Motor** | Category list of motor ports 0–3 (radial control screen) |
| **Servo** | Category list of servo ports 0–3 (arc slider screen) |
| **IMU** | IMU sub-selection screen (Gyro, Accel, Magneto, Heading, Orientation) |
| **Camera** | Live camera viewer |
| **System** | System Health screen (CPU, RAM, Disk, temperatures, battery, uptime) |
| **Calib Board** | Calibration Board sub-menu (external USB-C board) |

### IMU grouping

All IMU sub-sensors — Gyro, Accel (accelerometer), Magneto (magnetometer), Orientation (quaternion), and Heading — are grouped behind a single **IMU** tile. The tile only appears when at least one IMU sensor exists. Tapping it opens an intermediate selection screen (`ImuSelectionScreen`) where you pick the specific measurement you want.

Source: `botui/lib/features/sensors/presentation/screens/sensor_selection_screen.dart:18-98`

### Sensor tile count

When a category contains exactly one sensor, BotUI navigates directly to that sensor's screen without showing the intermediate category list.

---

## Graph Views

Tapping a graph-capable sensor opens a time-series chart. The x-axis shows elapsed time in seconds; the y-axis shows the measured value. All graph views scroll from right to left as new samples arrive.

Graph views are available for the following sensor types:

| Sensor | Y-axis range | Unit |
|---|---|---|
| Analog (per port) | 0 – 4095 | raw ADC |
| Digital (per port) | 0 – 1 | HIGH/LOW |
| Gyro X / Y / Z | −180 – 180 | ° / s |
| Accel X / Y / Z | −10 – 10 | m/s² |
| Magneto X / Y / Z | −256 – 256 | µT |
| Heading | 0 – 360 | ° |

**Temperature and Battery are not separate graph-view categories on this screen.** They are part of the System Health screen (see below).

Source: `botui/lib/features/sensors/data/datasource/sensors_remote_data_source.dart:58-193`

---

## Orientation (Quaternion) — 3D Visualisation

Tapping **IMU → Orientation** opens `QuaternionScreen`, which shows a real-time 3D orientation visualisation driven by the IMU's quaternion output rather than a flat time-series graph. The AppBar of this screen displays the current IMU calibration accuracy and IMU die temperature, updated live.

Use this screen when you need to inspect the sensor-fusion output visually — for example to verify that an IMU mounting is correct or that the Madgwick filter has converged after a reboot.

Source: `botui/lib/features/sensors/presentation/screens/quaternion_screen.dart`

---

## System Health Screen

The **System** tile opens `SystemHealthScreen`, a dashboard of seven metric cards laid out in a 2-column grid. Each card shows the current value, a colour-coded indicator, and (for CPU, RAM) a circular progress ring.

| Card | What it shows | Colour thresholds |
|---|---|---|
| **CPU** | Processor utilisation (%) | Green < 60 %, Orange 60–85 %, Red > 85 % |
| **RAM** | Used / Total MB | Green < 60 %, Orange 60–85 %, Red > 85 % |
| **Disk** | Used / Total GB, routes to Disk Usage detail | Green < 60 %, Orange 60–85 %, Red > 85 % |
| **CPU Temp** | SoC die temperature (°C) | Green < 50 °C, Orange 50–70 °C, Red > 70 °C |
| **IMU Temp** | BNO/ICM IMU die temperature (°C) | Same thresholds as CPU Temp |
| **Battery** | Supply voltage (V, two decimal places) | Green (no thresholds applied by default) |
| **Uptime** | System uptime formatted as `Nh Mm` | Blue-grey (informational) |

Tapping the CPU, RAM, CPU Temp, IMU Temp, or Battery card opens a scrolling time-series graph for that metric. Tapping Disk opens a dedicated disk-usage breakdown screen.

Source: `botui/lib/features/sensors/presentation/screens/system_health_screen.dart`

---

## Motor Control

Tapping a motor port opens `SensorMotorScreen`, which provides a sidebar of four control modes on the left and the active control surface on the right.

### Motor Mode Sidebar

| Mode label | Icon | What it does |
|---|---|---|
| **POWER** | Lightning bolt | Radial slider, −100 to +100 (dimensionless PWM duty) |
| **VEL** | Speedometer | Radial slider, −1500 to +1500 (ticks/s) |
| **POS** | Pin | Numeric keypad for target position in encoder ticks, with velocity selector |
| **GRAPH** | Line chart | Live BEMF and position graph (see below) |

Source: `botui/lib/features/sensors/presentation/widgets/motor_mode_sidebar.dart`

### Power and Velocity Modes — Radial Slider

Both Power and Velocity use a **circular (radial) slider** widget (`MotorRadialSlider`), not a linear slider. Dragging the handle clockwise increases the value; counterclockwise decreases it. Commands are published at up to ~30 Hz while the handle is moving.

The status bar at the bottom of the screen shows the current **BEMF** (back-EMF value in raw ticks), current **POS** (encoder position), and a done indicator that turns green when a move-to-position command has completed.

### Position Mode — Keypad Entry

In POS mode a numeric keypad is displayed. Enter the target encoder-tick position, optionally toggle negative with the `+/−` key, and adjust approach velocity with the up/down buttons (steps of 100, clamped 0–5000). A **Relative** toggle switches from absolute move (`motorPositionCommand`) to relative move (`motorRelativeCommand`, a signed delta added to the current position). Tap **Go** to send the command.

### Graph Mode — BEMF and Position

Switching to GRAPH opens a rolling time-series plot sampled at 10 Hz. The chart can show either BEMF or position over time; a toggle at the top switches between them. The target velocity is overlaid as a reference line when in velocity mode.

### Bottom Action Buttons

Regardless of which mode is selected, four action buttons are always visible at the bottom of the screen:

| Button | Colour | Behaviour |
|---|---|---|
| **BRAKE** | Red | Passive brake — publishes `motorModeCommand` with value 1, which shorts the motor windings on the STM32 (MotorControlMode::PassiveBrake). Requires no current; the motor will resist rotation but may still creep. |
| **HOLD** | Orange | Active brake — sends `motorVelocityCommand(0)`. The STM32 PID loop actively drives the motor to maintain zero velocity; consumes current. |
| **OFF** | Grey | Coast — publishes `motorModeCommand` with value 0 (MotorControlMode::Off). No current; the motor spins freely. |
| **Reset POS** | Dark grey | Publishes `motorPositionResetCommand`, zeroing the encoder counter on the STM32 to 0. |

Source: `botui/lib/features/sensors/presentation/screens/sensor_motor_screen.dart:179-435`

### Motor Shutdown Guard

If the firmware's shutdown flags are active for motors (reported on the `SHUTDOWN_STATUS` LCM channel), navigating to any motor port shows a **warning dialog** instead of opening the control screen directly:

```
Motors Disabled
Shutdown flags are enabled. Motors cannot be controlled
until shutdown is disabled.

[ Cancel ]  [ Disable ]
```

Tapping **Disable** calls the shutdown-status service to clear the motor-shutdown flag, then proceeds to the control screen. Tapping **Cancel** returns to the category list without modifying any state.

This guard prevents inadvertent motor commands when the hardware safety-kill has been triggered — for example after a MotorWatchdog timeout.

Source: `botui/lib/features/sensors/presentation/screens/sensor_category_screen.dart:63-88`

### Stop All Motors Button

The Motor category screen (the list of motor-port tiles) shows a full-width **Stop All Motors** button at the bottom. Tapping it publishes `motorPowerCommand(i, 0)` for all four motor ports simultaneously (i = 0–3).

Source: `botui/lib/features/sensors/presentation/screens/sensor_category_screen.dart:139-153`

---

## Servo Control

Tapping a servo port opens `SensorServoScreen`, which displays a large circular arc slider. The slider's centre readout shows:

- The currently commanded angle (`CMD N.N°`), sourced from the last command seen on the LCM channel
- The actual reported servo angle (`ACT N.N°`), from the STM32 feedback
- The current servo mode name (e.g. `position`, `fullyDisabled`)

### Normal Mode

In normal mode the arc spans **0° to 180°**. Dragging the handle sends `servoPositionCommand` reliably. The STM32 moves the servo to the commanded angle and feeds back the actual position.

### Danger Mode

Tapping the **Danger** button in the bottom bar toggles Danger Mode. When active:

- The arc expands to **−50° to 360°**, shown in red
- Angle values outside 0–180° are displayed in red to signal risk of mechanical damage
- Toggling off again clamps the current angle back to 0–180° and sends the clamped position

Use Danger Mode only if you need to drive a servo beyond its standard range and have confirmed the hardware can support it.

### Bottom Buttons

| Button | Behaviour |
|---|---|
| **Fully Disable** | Publishes `servoModeCommand` with `ServoMode.fullyDisabled`, cutting power to the servo coil. The angle display resets to 0°. |
| **Danger** / **Danger ON** | Toggles Danger Mode (see above). |

Source: `botui/lib/features/sensors/presentation/screens/sensor_servo_screen.dart`

### Servo Shutdown Guard and Disable All

The same shutdown-guard dialog that exists for motors also applies to servos. If the servo-shutdown flag is active, attempting to open a servo port shows the dialog with "Servos Disabled" instead of "Motors Disabled".

The Servo category screen also has a **Disable All Servos** button at the bottom that publishes `servoModeCommand(i, fullyDisabled)` for all four servo ports.

Source: `botui/lib/features/sensors/presentation/screens/sensor_category_screen.dart:46-153`

---

## Digital Sensor Tiles

The Digital category uses a compact 5-column grid rather than the standard 2-column grid used by other categories. Each tile displays the port name and uses a colour indicator:

- **Green** — digital input reads LOW (0)
- **Red** — digital input reads HIGH (1)

Tapping a tile opens the standard graph view for that port (0–1 range).

---

## Camera Viewer

The **Camera** tile opens a live video stream viewer sourced from the raccoon camera service. No additional controls are shown on the sensor screen; camera configuration is done through Settings → Camera.
