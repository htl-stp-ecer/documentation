---
title: "SPI Communication Protocol"
author: "OpenAI Codex"
date: 2026-05-28
draft: false
weight: 2
---

# SPI Communication Protocol

The canonical SPI protocol definition lives in:

```text
stm32-data-reader/shared/spi/pi_buffer.h
```

That header is the real source of truth for the wire contract between the Pi-side `stm32-data-reader` process and the STM32 firmware.

## Core model

Every SPI exchange is full duplex:

- the Pi sends an `RxBuffer` to the STM32
- the Pi simultaneously receives a `TxBuffer` from the STM32

The naming is from the STM32's perspective:

- `RxBuffer`: what the STM32 receives from the Pi
- `TxBuffer`: what the STM32 transmits back

The buffers are packed structs with no framing or length prefix. The protocol relies on struct agreement and a shared transfer version.

## Current transfer version

The current shared header defines:

```c
#define TRANSFER_VERSION 19
```

If you see docs or code comments talking about `15`, they are stale.

## Version mismatch behavior

This is not just a passive compatibility check anymore.

Current Pi-side behavior in `Spi.cpp`:

- if a transfer returns the wrong `transferVersion`
- the Pi logs the mismatch
- then automatically runs the firmware reflash script
- reopens SPI
- retries the transfer
- exits fatally only if mismatch persists after reflash

That means protocol mismatch is treated as a repairable deployment problem first, not just as a silent ignore case.

## Frame sizing

The wire transfer length is:

```c
#define BUFFER_LENGTH_DUPLEX_COMMUNICATION \
  ((sizeof(TxBuffer) < sizeof(RxBuffer)) ? sizeof(RxBuffer) : sizeof(TxBuffer))
```

So each transaction always transfers the size of the larger buffer, regardless of which direction owns more data.

## `TxBuffer` (STM32 → Pi)

Current layout:

```c
typedef struct __attribute__ ((packed)) TxBuffer_tag
{
    uint8_t transferVersion;
    uint32_t updateTime;
    MotorData motor;
    int16_t analogSensor[6];
    int16_t batteryVoltage;
    uint16_t digitalSensors;
    ImuData imu;
    OdometryData odometry;
} TxBuffer;
```

High-level meaning:

- transfer version and timing
- motor telemetry
- analog and digital sensor state
- IMU data
- STM32-computed odometry

## `MotorData`

```c
typedef struct __attribute__ ((packed))
{
    int32_t bemf[4];
    int32_t position[4];
    uint8_t done;
} MotorData;
```

Meaning:

- `bemf[4]`: instantaneous filtered BEMF reading per motor
- `position[4]`: accumulated BEMF tick position
- `done`: bit `N` set when motor `N` reached its position target

## `ImuData`

Current layout includes:

- `gyro`
- `accel`
- `compass`
- `linearAccel`
- `accelVelocity`
- `dmpQuat`
- `heading`
- `temperature`

The shared header is the authoritative field order and should be consulted directly when changing bindings or decoders.

## `OdometryData`

```c
typedef struct __attribute__ ((packed))
{
    float pos_x;
    float pos_y;
    float heading;
    float vx;
    float vy;
    float wz;
} OdometryData;
```

Conventions in the shared header:

- `pos_x`, `pos_y`: meters in world frame
- `heading`: radians, CCW-positive
- `vx`, `vy`, `wz`: body-frame velocity

## `RxBuffer` (Pi → STM32)

Current layout:

```c
typedef struct __attribute__ ((packed))
{
    uint8_t transferVersion;
    uint32_t updates;
    uint8_t systemShutdown;
    uint16_t motorControlMode;
    int32_t motorTarget[4];
    int32_t motorGoalPosition[4];
    uint8_t motorPositionReset;
    uint8_t servoMode;
    uint16_t servoPos[4];
    MotorPidSettings motorPidSettings;
    int8_t imuGyroOrientation[9];
    int8_t imuCompassOrientation[9];
    KinematicsConfig kinematics;
    uint8_t featureFlags;
} RxBuffer;
```

Two fields that older docs often miss:

- `motorPositionReset`
- `featureFlags`

Those are part of the live protocol and must not be ignored in protocol descriptions.

## Update flags

Current `updates` bitmask constants:

| Bit | Constant | Purpose |
|---|---|---|
| `0x01` | `PI_BUFFER_UPDATE_MOTOR_PID_SPEED` | Update motor velocity PID settings |
| `0x02` | `PI_BUFFER_UPDATE_MOTOR_PID_POS` | Update motor position PID settings |
| `0x04` | `PI_BUFFER_UPDATE_IMU_ORIENTATION` | Apply IMU orientation matrices |
| `0x08` | `PI_BUFFER_UPDATE_SAVE_IMU_CAL` | Save IMU calibration |
| `0x10` | `PI_BUFFER_UPDATE_KINEMATICS` | Apply kinematics config |
| `0x20` | `PI_BUFFER_UPDATE_ODOM_RESET` | Reset odometry |
| `0x40` | `PI_BUFFER_UPDATE_MOTOR_POS_RESET` | Reset motor position counters |
| `0x80` | `PI_BUFFER_UPDATE_FEATURE_FLAGS` | Apply runtime feature flags |

Older docs that describe a parity bit here are stale relative to the current shared header.

## Shutdown flags

Current shutdown bits:

| Bit | Constant | Meaning |
|---|---|---|
| `0x01` | `SHUTDOWN_SERVO` | shutdown servo subsystem |
| `0x02` | `SHUTDOWN_MOTOR` | shutdown motor subsystem |

## Feature flags

Current runtime opt-in feature flags:

| Bit | Constant | Meaning |
|---|---|---|
| `0x01` | `FEATURE_BEMF_DISABLE` | disable BEMF-based feedback, used for Speed Mode |

This is operationally important because it changes what motor command modes are valid.

## Motor control mode packing

The shared header defines:

```c
#define MOTOR_CONTR_MOD_LENGTH 3
```

So `motorControlMode` packs four 3-bit motor modes into one word.

Current modes:

| Value | Constant | Meaning |
|---|---|---|
| `0b000` | `MOT_MODE_OFF` | motor off |
| `0b001` | `MOT_MODE_PASSIV_BRAKE` | passive brake |
| `0b010` | `MOT_MODE_PWM` | explicit PWM duty |
| `0b011` | `MOT_MODE_MAV` | move at velocity |
| `0b100` | `MOT_MODE_MTP` | move to position |

## Kinematics payload

`KinematicsConfig` now contains:

- `inv_matrix[3][4]`
- `ticks_to_rad[4]`
- `fwd_matrix[4][3]`

That means the STM32 receives both:

- inverse kinematics mapping
- forward kinematics mapping
- encoder calibration

The comment in the header also makes clear that the forward matrix is used for per-wheel slip analysis.

## Speed Mode interaction

`Spi.cpp` contains a safety guard:

- if `FEATURE_BEMF_DISABLE` is active
- and a motor is commanded in `MOT_MODE_MAV`
- the Pi side rejects that command and throws

Reason:

- with BEMF disabled, the firmware has no encoder-tick feedback
- velocity PID cannot safely close the loop in that mode

So Speed Mode is not just a higher-level library flag. It changes which SPI command combinations are legal.

## Practical implications

- protocol docs must be derived from `pi_buffer.h`, not from memory
- transfer-version mismatch now triggers auto-reflash behavior
- `updates` is a true feature/update bitmask in the current shared header
- runtime feature flags are part of the live wire contract
- speed mode changes valid motor-command semantics at the SPI boundary

## Related files

- shared header: [pi_buffer.h](/media/tobias/TobiasSSD/projects/Botball/raccoon/stm32-data-reader/shared/spi/pi_buffer.h)
- Pi SPI implementation: [Spi.cpp](/media/tobias/TobiasSSD/projects/Botball/raccoon/stm32-data-reader/src/wombat/hardware/Spi.cpp)
