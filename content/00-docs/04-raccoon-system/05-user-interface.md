---
title: "User Interface (botui)"
date: 2024-01-01
draft: false
weight: 6
---

# User Interface -- StpVelox (botui)

StpVelox is a Flutter application running on the robot's 800x480 touchscreen. It provides real-time sensor monitoring, program execution, Wi-Fi management, and device settings. It runs directly on the Raspberry Pi via flutter-pi (a custom Flutter embedder that doesn't require X11).

## Main Screens

### Dashboard

The home screen with three main tiles:
- **Sensors & Actors** -- View real-time sensor data
- **Programs** -- Browse and run robot programs
- **Settings** -- Configure device, Wi-Fi, calibration

### Program Execution

1. **Program Selection** -- Grid of available programs (discovered from `~/programs/`)
2. **Program Action** -- Choose to "Run" or "Calibrate"
3. **Arguments Input** -- If the program accepts arguments, an overlay collects them
4. **Terminal Output** -- Real-time program output via an embedded xterm terminal
5. **Controls** -- Start, Stop, long-press for control menu

Programs run via a pseudoterminal (PTY), capturing full stdout/stderr with terminal control sequences preserved.

### Sensors & Actors

Real-time sensor visualization organized by category:

| Category | Sensors |
|----------|---------|
| **IMU** | Accelerometer, Gyroscope, Magnetometer, Quaternion, Accuracy |
| **Analog** | Ports 0-5 (12-bit ADC values) |
| **Digital** | Digital input ports |
| **Motors** | Position, power, BEMF, done flags (ports 0-3) |
| **Servos** | Position and status (ports 0-3) |
| **System** | Battery voltage, CPU temperature |

Each sensor subscribes to its LCM channel and updates in real-time. Graphs and gauges provide visual feedback.

### Wi-Fi Management

Three network modes:
- **Client Mode** -- Connect to external Wi-Fi networks (scan, select, enter password)
- **Access Point Mode** -- Robot acts as a Wi-Fi hotspot (configurable name, password, channel)
- **LAN Only Mode** -- Ethernet only, no Wi-Fi

Features: network scanning, saved networks, WPA2-Enterprise support, manual SSID entry, device info (IP, MAC, hostname).

All networking uses Linux NetworkManager via `nmcli` commands.

### Settings

- **Touch Calibration** -- Calibrate the touchscreen with a transformation matrix (persisted across reboots)
- **Screen Rotation** -- Configure display orientation
- **Service Status** -- Monitor systemd services with log viewer
- **Screensaver** -- Enable/disable idle animation (robot face)
- **Battery Monitoring** -- Low-battery warnings at 2.0-5.8V with auto-shutdown after 15 seconds

## Dynamic UI System

One of the most powerful features: the robot's running program can send UI definitions to the touchscreen at runtime.

**How it works:**
1. A running program publishes a `screen_render_t` LCM message with a JSON UI definition
2. The UI receives it and navigates to the Dynamic UI screen
3. `WidgetDecoder` converts the JSON into Flutter widgets
4. User interactions (slider changes, button clicks) are sent back via `screen_render_answer_t`

**Supported widget types:**
- Text input, numeric input, sliders, buttons
- Circular sliders, numeric keypads
- Sensor value displays, graphs
- Status badges, icons, light indicators
- Robot driving animations, tables

This means calibration screens, setup wizards, and debug interfaces can be created entirely from your robot program -- no need to modify the Flutter app.

**Example flow:**
```
Robot Program → LCM "libstp/screen_render" → botui renders widgets
User interacts → LCM "libstp/screen_render/answer" → Robot Program receives response
```

## Communication

All hardware data flows through LCM. The UI subscribes to sensor channels like:

```
libstp/analog/{port}/value         → Analog sensor readings
libstp/digital/{port}/value        → Digital inputs
libstp/gyro/gyro_value             → Gyroscope data
libstp/motor/{port}/position       → Motor position
libstp/battery/voltage             → Battery voltage
libstp/screen_render               → Dynamic UI definitions
```

The custom `lcm-dart` package (in `packages/lcm-dart/`) provides LCM bindings for Dart with UDP multicast support.

## Easter Eggs

- **Flappy Wombat** -- A Flappy Bird clone controlled by digital sensor port 10
- **Tilt Maze** -- A ball maze controlled by the gyroscope/accelerometer
- **Robot Face Screensaver** -- Animated mascot shown when idle

## Building and Deploying

```bash
# Generate code (Riverpod providers, LCM types, Freezed classes)
dart run build_runner build

# Build for Pi (ARM64)
flutterpi_tool build --arch=arm64 --cpu=pi3 --release

# Deploy
./deploy.sh    # Syncs to Pi and restarts flutter-ui.service
```

## flutter-pi (The Embedder)

flutter-pi is a custom C application that runs Flutter directly on the Raspberry Pi's framebuffer using DRM/KMS -- no X11 or Wayland required. It provides:

- Direct GPU rendering via OpenGL ES or Vulkan
- Raw input handling (touchscreen, keyboard)
- Platform channels for GPIO, SPI, and serial access
- GStreamer integration for video/audio
- LCM plugin for robotics communication

This is what makes it possible to run a smooth Flutter UI on an embedded system.
