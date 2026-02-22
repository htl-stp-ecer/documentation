---
title: "Communication (LCM)"
date: 2024-01-01
draft: false
weight: 7
---

# Communication -- LCM Channels and Protocols

All components in the Raccoon system communicate via LCM (Lightweight Communications and Marshalling) -- a UDP multicast publish-subscribe messaging system. This page documents every channel and message type.

## What is LCM?

LCM is a lightweight IPC (inter-process communication) library designed for robotics. Key properties:

- **UDP multicast** on address `239.255.76.67:7667`
- **Publish-subscribe** -- any process can publish or subscribe to any channel
- **Type-safe** -- messages are defined in `.lcm` files and compiled to language-specific code
- **Low latency** -- minimal overhead, suitable for real-time sensor data
- **Decoupled** -- publishers and subscribers don't need to know about each other

## Message Types

All message types are defined in the `lcm-messages` repository and compiled for C++, Python, and Dart.

| Type | Fields | Usage |
|------|--------|-------|
| `scalar_i8_t` | `int8_t value`, `int64_t timestamp` | Small integers (sensor accuracy 0-3) |
| `scalar_i32_t` | `int32_t value`, `int64_t timestamp` | Integers (analog values, motor positions) |
| `scalar_f_t` | `float value`, `int64_t timestamp` | Floats (battery voltage, temperature) |
| `vector3f_t` | `float x, y, z`, `int64_t timestamp` | 3D vectors (gyro, accel, magnetometer) |
| `quaternion_t` | `float w, x, y, z`, `int64_t timestamp` | Orientation quaternion |
| `screen_render_t` | `string screen_name, entries`, `int64_t timestamp` | Dynamic UI definitions (JSON) |
| `screen_render_answer_t` | `string screen_name, value, reason`, `int64_t timestamp` | UI interaction responses |
| `yolo_frame_t` | `int width, height, num_boxes`, `yolo_box_t[] boxes` | Vision detection results |
| `string_t` | `string value` | Error messages |

## Sensor Channels (Published by stm32-data-reader)

### IMU Data

| Channel | Type | Description |
|---------|------|-------------|
| `libstp/gyro/value` | `vector3f_t` | Gyroscope (rad/s) |
| `libstp/accel/value` | `vector3f_t` | Accelerometer (m/s^2) |
| `libstp/mag/value` | `vector3f_t` | Magnetometer (uT) |
| `libstp/linear_accel/value` | `vector3f_t` | Gravity-subtracted acceleration |
| `libstp/accel_velocity/value` | `vector3f_t` | Integrated acceleration velocity |
| `libstp/imu/quaternion` | `quaternion_t` | Orientation quaternion |
| `libstp/imu/temp/value` | `scalar_f_t` | IMU temperature (C) |

### IMU Accuracy (throttled to every 15 seconds)

| Channel | Type | Values |
|---------|------|--------|
| `libstp/gyro/accuracy` | `scalar_i8_t` | 0=uncalibrated, 3=fully calibrated |
| `libstp/accel/accuracy` | `scalar_i8_t` | 0-3 calibration level |
| `libstp/mag/accuracy` | `scalar_i8_t` | 0-3 calibration level |
| `libstp/imu/quaternion_accuracy` | `scalar_i8_t` | 0-3 calibration level |

### Motor Data (per port 0-3)

| Channel | Type | Description |
|---------|------|-------------|
| `libstp/motor/{port}/value` | `scalar_i32_t` | Current BEMF reading (speed) |
| `libstp/motor/{port}/position` | `scalar_i32_t` | Accumulated position (BEMF ticks) |
| `libstp/motor/{port}/done` | `scalar_i32_t` | 1 if position goal reached |
| `libstp/bemf/{port}/value` | `scalar_i32_t` | Raw BEMF value |

### Analog Sensors (ports 0-5)

| Channel | Type | Description |
|---------|------|-------------|
| `libstp/analog/{port}/value` | `scalar_i32_t` | 12-bit ADC reading (0-4095) |

### Digital Sensors (ports 0-15)

| Channel | Type | Description |
|---------|------|-------------|
| `libstp/digital/{port}/value` | `scalar_i32_t` | 0 or 1 (active low with pull-up) |

### System

| Channel | Type | Description |
|---------|------|-------------|
| `libstp/battery/voltage` | `scalar_f_t` | Battery voltage (V) |
| `libstp/cpu/temp/value` | `scalar_f_t` | Raspberry Pi CPU temperature (C) |

## Command Channels (Subscribed by stm32-data-reader)

### Motor Commands (per port 0-3)

| Channel | Type | Effect |
|---------|------|--------|
| `libstp/motor/{port}/power_cmd` | `scalar_i32_t` | Set PWM duty (-400 to +400) |
| `libstp/motor/{port}/stop_cmd` | `scalar_i32_t` | Stop motor (0=coast, 1=brake) |
| `libstp/motor/{port}/velocity_cmd` | `scalar_i32_t` | Set velocity target (PID) |
| `libstp/motor/{port}/position_cmd` | `vector3f_t` | x=velocity limit, y=goal position |
| `libstp/motor/{port}/pid_cmd` | `vector3f_t` | x=kP, y=kI, z=kD |

### BEMF Commands (per port 0-3)

| Channel | Type | Effect |
|---------|------|--------|
| `libstp/bemf/{port}/reset_cmd` | `scalar_i32_t` | Reset accumulated position |
| `libstp/bemf/{port}/scale_cmd` | `scalar_f_t` | Set BEMF scale factor |
| `libstp/bemf/{port}/offset_cmd` | `scalar_f_t` | Set BEMF offset |
| `libstp/bemf/nominal_voltage_cmd` | `scalar_i32_t` | Set nominal battery ADC |

### Servo Commands (per port 0-3)

| Channel | Type | Effect |
|---------|------|--------|
| `libstp/servo/{port}/position_cmd` | `scalar_i32_t` | Set position (0-2047) |
| `libstp/servo/{port}/mode` | `scalar_i8_t` | 0=fully disabled, 1=disabled, 2=enabled |

### System Commands

| Channel | Type | Effect |
|---------|------|--------|
| `libstp/system/shutdown_cmd` | `scalar_i32_t` | Disable all motors and servos at firmware level |
| `libstp/system/dump_request` | `scalar_i32_t` | Request diagnostic dump |

### UI Channels

| Channel | Type | Direction |
|---------|------|-----------|
| `libstp/screen_render` | `screen_render_t` | Program -> UI (send UI definition) |
| `libstp/screen_render/answer` | `screen_render_answer_t` | UI -> Program (user interaction) |

### Vision Channels

| Channel | Type | Description |
|---------|------|-------------|
| `libstp/yolo/frame` | `yolo_frame_t` | Object detection bounding boxes |

## SPI Protocol

The SPI link between the STM32 and Pi uses a fixed-size duplex buffer. Key parameters:

| Parameter | Value |
|-----------|-------|
| Speed | 20 MHz |
| Mode | SPI Mode 1 (CPOL=0, CPHA=1) |
| Transfer size | ~500 bytes each direction |
| Transfer rate | ~1 kHz (continuous circular DMA) |
| Protocol version | 6 (must match on both sides) |
| Error protection | Even parity on update flags |

Version mismatches trigger automatic retry with STM32 reset after 3 failures.

## Required System Services

For LCM to work on a single machine, loopback multicast must be enabled:

```bash
# Enabled by lcm-loopback-multicast.service
ip link set lo multicast on
ip route replace 224.0.0.0/4 dev lo
```

This service is automatically installed and started by the stm32-data-reader deployment.
