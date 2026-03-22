---
title: "SPI Communication Protocol"
author: "Tobias Madlberger"
date: 2026-03-22
draft: false
weight: 2
---

## Overview

The STM32 and Raspberry Pi communicate exclusively over SPI2. Every transaction is a full-duplex exchange: the Pi sends an `RxBuffer` (commands to the STM32) while simultaneously receiving a `TxBuffer` (sensor data from the STM32). Both buffers are raw packed C structs with no framing, no length field, and no checksum — the only integrity mechanism is a `transferVersion` field and a parity bit in the update-flags word.

The canonical shared definition of both structs lives in:

```
stm32-data-reader/shared/spi/pi_buffer.h
```

This file is compiled into the `stm32-data-reader` process on the Pi and is mirrored (with minor version differences) in `Firmware-Stp/Firmware/include/Communication/pi_buffer_struct.h`. Both sides must agree on `TRANSFER_VERSION` (currently `15` in the shared header) or the STM32 ignores incoming commands.

## SPI Physical Layer

| Parameter | Value |
|---|---|
| Peripheral | SPI2 (STM32 pins PB12–PB15) |
| STM32 role | Slave |
| Pi role | Master |
| Mode | CPOL=0, CPHA=0 (Mode 0) |
| Data width | 8-bit |
| Bit order | MSB first |
| NSS | Hardware (PB12) |
| DMA | Circular, both TX and RX (DMA1 stream 3/4, channel 0) |
| Interrupt priority | Highest (preempt 0, sub 0) |

The DMA runs in **circular mode**, which means that after each transfer of `BUFFER_LENGTH_DUPLEX_COMMUNICATION` bytes the DMA automatically restarts and fires `HAL_SPI_TxRxCpltCallback`. The transfer size is the larger of `sizeof(TxBuffer)` and `sizeof(RxBuffer)`, so both sides always transfer the same number of bytes.

## TxBuffer (STM32 → Pi)

The `TxBuffer` contains all sensor readings that the STM32 exposes. It is declared `__attribute__((packed))` to eliminate alignment padding and ensure byte-exact layout on both ARM and aarch64/x86.

```c
typedef struct __attribute__((packed)) TxBuffer_tag {
    uint8_t   transferVersion;   // Must match TRANSFER_VERSION
    uint32_t  updateTime;        // Microsecond timestamp (from TIM6)

    MotorData motor;             // BEMF readings, positions, done flags

    int16_t   analogSensor[6];   // 12-bit ADC readings, ports 0–5
    int16_t   batteryVoltage;    // 12-bit ADC reading, ADC1 channel 10
    uint16_t  digitalSensors;    // Bits 0–9: DIN0–DIN9, bit 10: onboard button

    ImuData   imu;               // Full IMU fusion output

    OdometryData odometry;       // World-frame position/velocity (if configured)
} TxBuffer;
```

### MotorData

```c
typedef struct __attribute__((packed)) {
    int32_t bemf[4];      // Filtered instantaneous BEMF (arbitrary units)
    int32_t position[4];  // Accumulated BEMF ticks (odometer)
    uint8_t done;         // Bit N set when motor N reached its position goal
} MotorData;
```

### ImuData

```c
typedef struct __attribute__((packed)) {
    SensorData    gyro;          // World-frame angular velocity (rad/s × scaling)
    SensorData    accel;         // World-frame acceleration (m/s²)
    SensorData    compass;       // Raw magnetometer counts (AK8963)
    SensorData    linearAccel;   // World-frame linear acceleration (gravity removed)
    SensorData    accelVelocity; // Integrated linear velocity (experimental)
    QuaternionData dmpQuat;      // DMP 6-axis quaternion (w, x, y, z)
    float         heading;       // Heading in degrees (0–360, CW from North)
    float         temperature;   // IMU die temperature (°C)
} ImuData;
```

Each `SensorData` carries a `{x, y, z}` float vector and an `int8_t accuracy` (0 = least accurate, 3 = most accurate), matching the InvenSense MPL accuracy levels.

### OdometryData

```c
typedef struct __attribute__((packed)) {
    float pos_x;   // meters, world frame
    float pos_y;   // meters, world frame
    float heading; // radians, CCW-positive (ENU convention)
    float vx;      // m/s, body frame
    float vy;      // m/s, body frame
    float wz;      // rad/s, body frame
} OdometryData;
```

Odometry is only meaningful once the Pi has sent a `KinematicsConfig` (see below). Until then, all odometry fields are zero.

## RxBuffer (Pi → STM32)

```c
typedef struct __attribute__((packed)) {
    uint8_t   transferVersion;    // Must match TRANSFER_VERSION
    uint32_t  updates;            // Bitmask of one-shot update flags
    uint8_t   systemShutdown;     // Bit 0: disable servos, bit 1: disable motors
    uint16_t  motorControlMode;   // 3 bits per motor (motors 0–3)
    int32_t   motorTarget[4];     // PWM duty / velocity setpoint / speed limit
    int32_t   motorGoalPosition[4]; // Absolute target position (MTP mode)
    uint8_t   servoMode;          // 2 bits per servo (servos 0–3)
    uint16_t  servoPos[4];        // Servo PWM value in timer ticks (600–2600)
    MotorPidSettings motorPidSettings; // Full PID configuration block
    int8_t    imuGyroOrientation[9];   // Row-major 3×3 orientation matrix
    int8_t    imuCompassOrientation[9];
    KinematicsConfig kinematics;  // Inverse kinematics matrix + tick-to-rad
} RxBuffer;
```

### Motor Control Mode Encoding

`motorControlMode` packs 3-bit mode values for four motors into a 16-bit word. Motor `n` occupies bits `[3n+2 : 3n]`:

| Mode value | Name | Behaviour |
|---|---|---|
| `0b000` | `MOT_MODE_OFF` | PWM off, H-bridge pins LOW (coast) |
| `0b001` | `MOT_MODE_PASSIV_BRAKE` | H-bridge pins both HIGH (short brake) |
| `0b010` | `MOT_MODE_PWM` | Direct duty cycle, `motorTarget[n]` is duty (0–399) |
| `0b011` | `MOT_MODE_MAV` | Velocity PID, `motorTarget[n]` is BEMF-tick velocity setpoint |
| `0b100` | `MOT_MODE_MTP` | Position PID, `motorGoalPosition[n]` is target, `motorTarget[n]` caps speed |

### Servo Mode Encoding

`servoMode` packs 2-bit values for four servos into a single byte:

| Mode value | Name | Behaviour |
|---|---|---|
| `0` | `SERVO_FULLY_DISABLED` | PWM stopped, 6 V rail may be cut |
| `1` | `SERVO_DISABLED` | PWM stopped, 6 V rail remains on |
| `2` | `SERVO_ENABLED` | PWM active at position `servoPos[n]` |

If all four servos are `SERVO_FULLY_DISABLED` the firmware cuts the 6 V servo power rail by driving `SERVO_6V0_ENABLE_Pin` low. This saves power and prevents servo jitter when no servos are in use.

### Update Flags

The `updates` field in the `RxBuffer` is a bitmask of one-shot commands. The STM32 reads this field on every SPI completion and acts on bits that are set. Bit 7 (value `0x80`) is a **parity bit** — the firmware checks whether `rxBuffer.updates` is odd (parity bit set implies the lower 7 bits contain an even number of set bits; the Pi must encode this correctly) before trusting the update flags.

| Bit | Constant | Effect |
|---|---|---|
| 0 | `PI_BUFFER_UPDATE_MOTOR_PID_SPEED` | Copy `motorPidSettings` into the velocity PID controllers |
| 1 | `PI_BUFFER_UPDATE_MOTOR_PID_POS` | Copy `motorPidSettings` into the position PID controllers |
| 2 | `PI_BUFFER_UPDATE_IMU_ORIENTATION` | Apply new gyro/compass orientation matrices to the MPL |
| 3 | `PI_BUFFER_UPDATE_SAVE_IMU_CAL` | (Reserved — save IMU calibration) |
| 4 | `PI_BUFFER_UPDATE_KINEMATICS` | Load new `KinematicsConfig` for odometry |
| 5 | `PI_BUFFER_UPDATE_ODOM_RESET` | Reset odometry accumulators to zero |
| 7 | `PI_BUFFER_UPDATE_PARITY_BIT` | Parity check bit |

### Shutdown Safety

If `systemShutdown & SHUTDOWN_MOTOR` (bit 1) is set in the `RxBuffer`, the STM32 firmware calls `motors_forceOff()` immediately in the SPI completion callback, before any main-loop processing. This is the primary hardware safety interlock: the Pi sets this bit on process exit, and the STM32 guarantees motors stop within one SPI cycle (< 1 ms at normal SPI speeds) even if the Pi process crashes.

## SPI Interrupt Handling

The SPI completion callback (`HAL_SPI_TxRxCpltCallback`) runs at interrupt priority 0 (highest possible). On every completion:

1. Timestamps `txBuffer.updateTime` with the current microsecond counter.
2. Reads digital inputs and writes them to `txBuffer.digitalSensors`.
3. Validates `rxBuffer.transferVersion`. If it does not match `TRANSFER_VERSION`, commands are silently ignored.
4. Validates the parity bit in `rxBuffer.updates`. If valid, copies the flags into `updateFlags` for main-loop processing.
5. Calls `sanitizeMotorCommandsForShutdown()` to enforce the motor shutdown flag immediately.

The DMA then automatically restarts the transfer for the next cycle.

## BEMF Calibration in the Protocol

The shared header previously included per-motor BEMF calibration fields (`bemfScale`, `bemfOffset`, `nominalVoltageAdc`) in the `RxBuffer`. These have been removed in `TRANSFER_VERSION 15` in favour of the `KinematicsConfig` approach where the Pi sends the full wheel-geometry configuration once at startup. Check `stm32-data-reader/shared/spi/pi_buffer.h` for the current definitive layout.
