---
title: "Firmware"
date: 2024-01-01
draft: false
weight: 3
---

# Firmware Layer

The firmware layer consists of two components: the **STM32 firmware** running on the microcontroller, and the **stm32-data-reader** running on the Raspberry Pi. Together they handle all real-time hardware interaction.

## STM32 Firmware (Firmware-Stp)

### Overview

The STM32 firmware is a bare-metal C application running on the STM32F427VIT6 (Cortex-M4, 180 MHz). It handles all time-critical operations: motor PID control, BEMF sensing, IMU fusion, analog/digital sensor reading, and servo control.

**Key characteristics:**
- No RTOS -- interrupt-driven super-loop design
- 200 Hz motor control loop via BEMF feedback
- 1 kHz analog sensor sampling via DMA
- 50 Hz IMU quaternion fusion (MPU9250 with DMP)
- 20 MHz SPI slave communication with the Raspberry Pi

### Motor Control

Each of the 4 motor ports supports 5 control modes:

| Mode | Description |
|------|-------------|
| OFF | Motor coasting, no power |
| PASSIVE_BRAKE | Short-circuit braking |
| PWM | Direct duty cycle control (0-399) |
| MAV (Move At Velocity) | PID-controlled velocity using BEMF feedback |
| MTP (Move To Position) | Cascaded PID (position outer loop, velocity inner loop) |

**PID Architecture (MAV mode):**
- Single velocity PID controller
- Default gains: kP=1.22, kI=0.045, kD=0.0
- Runs at 200 Hz (tied to BEMF measurement cycle)
- Anti-windup with back-calculation

**PID Architecture (MTP mode):**
- Cascaded dual PID: position loop outputs velocity target for inner loop
- Position gains: kP=0.01, kI=0.0, kD=0.015
- Done detection: `|goalPos - currentPos| <= 50` BEMF ticks

**PID gains can be tuned at runtime** -- the Pi sends new gains via SPI, and they take effect immediately.

### BEMF Measurement Cycle

Back-EMF is how the firmware measures motor speed and position without encoders. Every 5ms:

1. All motors stop briefly (direction pins set to OFF)
2. 500us later, ADC2 starts a differential measurement (BEMF_HIGH - BEMF_LOW per motor)
3. Results are low-pass filtered (alpha=0.2)
4. Position is accumulated: `if |filtered_bemf| > 8 → add to position counter`
5. Motors resume with PID output

This 200 Hz cycle provides continuous velocity and position feedback.

### IMU (MPU9250)

- Connected via SPI3 (master mode)
- Uses InvenSense DMP (Digital Motion Processor) for on-chip sensor fusion
- Outputs: gyroscope (rad/s), accelerometer (m/s^2), magnetometer (uT), quaternion orientation
- 50 Hz update rate for quaternion
- 10 Hz compass sampling
- Self-calibration at startup

### SPI Protocol (STM32 <-> Pi)

Both sides maintain matching buffer structures (`pi_buffer_struct.h`). A version field (currently `TRANSFER_VERSION = 6`) ensures compatibility.

**TX Buffer (STM32 -> Pi):** Sensor telemetry
- Motor BEMF readings, accumulated positions, done flags
- 6 analog sensor channels
- Battery voltage
- Digital inputs (10 ports + button)
- Full IMU data (9-axis + quaternion)

**RX Buffer (Pi -> STM32):** Commands
- Motor control modes and targets
- Servo modes and positions
- BEMF calibration factors
- PID gain updates
- Shutdown flags

**Important:** Both `pi_buffer_struct.h` files (in the firmware and in stm32-data-reader) must be byte-identical. A parity check on the update flags protects against SPI corruption.

### Building and Flashing

```bash
# Build with Docker (cross-compilation for ARM)
cd Firmware-Stp
./build.sh

# Deploy to Pi and flash STM32
./deploy.sh
```

The deploy script copies the binary via SCP and flashes the STM32 over SSH.

---

## STM32 Data Reader

### Overview

The stm32-data-reader is a C++20 application running on the Raspberry Pi. It bridges the STM32's SPI interface with the LCM messaging system, making all sensor data available to any LCM subscriber.

### What It Does

**Every ~1ms (main loop):**
1. Performs a full-duplex SPI transfer at 20 MHz with the STM32
2. Extracts sensor data from the received buffer
3. Publishes changed values to LCM channels
4. Processes incoming LCM commands
5. Writes commands into the SPI transmit buffer for the next transfer
6. Reads and publishes Raspberry Pi CPU temperature

### Architecture

```
┌──────────────────────────────────────────────────────────┐
│                  stm32-data-reader                        │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ SpiReal     │  │ DataPublisher│  │CommandSubscriber│  │
│  │ /dev/spi0.0 │──│ Sensor→LCM   │  │ LCM→Commands   │  │
│  └─────────────┘  └──────────────┘  └────────────────┘  │
│         │              │                    │             │
│  ┌──────▼──────────────▼────────────────────▼──────────┐ │
│  │              DeviceController                        │ │
│  │    Motor state, Servo state, SPI read/write         │ │
│  └─────────────────────┬────────────────────────────────┘ │
│                        │                                  │
│  ┌─────────────────────▼────────────────────────────────┐ │
│  │              LcmBroker                                │ │
│  │    UDP multicast 239.255.76.67:7667                  │ │
│  └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

### Change Detection

The DataPublisher only publishes values that have actually changed since the last cycle. This reduces LCM traffic significantly. IMU accuracy values are throttled to one publish every 15 seconds.

### Battery Monitoring

Battery voltage is read from the STM32's ADC with an 11x voltage divider. The data reader applies an exponential moving average filter (alpha=0.0001) for smooth readings.

### Building and Deploying

```bash
cd stm32-data-reader

# Build with Docker (ARM64 cross-compilation)
./build.sh

# Deploy to Pi
./deploy.sh
```

The data reader runs as a systemd service (`stm32_data_reader.service`) that auto-starts on boot and depends on `lcm-loopback-multicast.service` for LCM routing.

### Testing Without Hardware

Build with the SPI mock for local development:

```bash
cmake .. -DUSE_SPI_MOCK=ON
```

This simulates sensor data, allowing you to test the LCM pipeline without a physical STM32.
