---
title: "Firmware"
author: "Tobias Madlberger"
date: 2026-06-18
draft: false
weight: 7
---

The Wombat robot uses a two-processor architecture. A Raspberry Pi handles high-level logic, vision, networking, and user code. An STM32F427 microcontroller handles everything that requires hard real-time guarantees: motor PWM generation, back-EMF sampling, closed-loop motor control, sensor ADC scanning, and IMU data acquisition. This split is not optional — the Linux scheduler on the Pi cannot provide the microsecond-level timing that back-EMF based position tracking requires.

This section documents the firmware running on the STM32 and the full data pipeline connecting it to user Python code.

## Sections

- [Architecture Overview](architecture/) — what each processor does and why
- [SPI Communication Protocol](spi-protocol/) — the shared-memory duplex buffers between Pi and STM32
- [Motor Control](motor-control/) — PWM generation, back-EMF measurement, PID loops, operating modes
- [Sensor Reading](sensors/) — analog ports, digital ports, battery voltage, IMU
- [Data Pipeline](data-pipeline/) — the full path from physical signal to Python API
- [Build and Flash](build-flash/) — how to compile and program the firmware
- [Robot Services And systemd](robot-services-and-systemd/) — the long-lived Pi-side units and how they fit together

## Source Repositories

| Repository | Location |
|---|---|
| STM32 firmware | `stm32-data-reader/firmware/` |
| Pi-side SPI bridge | `stm32-data-reader/` |
| raccoon-transport (LCM wrapper) | `stm32-data-reader/raccoon-transport/` |
| Shared SPI protocol header | `stm32-data-reader/shared/spi/pi_buffer.h` |

> **Note:** The firmware previously lived in a separate `Firmware-Stp/` directory at the repository root. It has been merged into `stm32-data-reader/firmware/`. Any path references to `Firmware-Stp/` in older notes or scripts are stale and will not work.
