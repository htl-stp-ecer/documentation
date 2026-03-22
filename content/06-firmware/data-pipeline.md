---
title: "Data Pipeline"
author: "Tobias Madlberger"
date: 2026-03-22
draft: false
weight: 5
---

This page traces a complete data path from a physical sensor reading to a value accessed in user Python code, and a complete command path from Python code to motor movement.

## Sensor Data Path (STM32 → Python)

```
Physical sensor
      │
      ▼
STM32 ADC / GPIO / IMU
      │  (interrupt-driven, µs latency)
      ▼
txBuffer (volatile struct in STM32 RAM)
      │  (updated after each measurement cycle)
      ▼
SPI2 DMA transfer to Raspberry Pi
      │  (circular DMA, Pi polls at main-loop rate)
      ▼
stm32-data-reader: SpiReal::readSensorData()
      │  (spi_update() call in C, copies RxBuf → TxBuf,
      │   returns SensorData struct)
      ▼
stm32-data-reader: DataPublisher::publishSensorData()
      │  (serialises fields to LCM messages, publishes
      │   via raccoon::Transport)
      ▼
LCM UDP multicast (localhost)
      │
      ▼
libstp: LcmReader (background thread in C++ process)
      │  (raccoon::Transport::spinOnce, updates caches)
      ▼
LcmReader caches (mutex-protected std::unordered_map
      │   / scalar fields)
      ▼
Python binding call (e.g., motor.get_position(),
      analog.read(), imu.heading())
```

### Step 1: STM32 Hardware Layer

**Analog sensors and battery:** TIM6 ISR fires every 1 µs and counts to `ANALOG_SENSOR_SAMPLING_INTERVAL` (by default configurable). When the interval elapses, `sampleAnalogPorts()` starts ADC1 DMA. On completion, `HAL_ADC_ConvCpltCallback` sets `NEW_DATA`. The main loop then copies the 7 ADC values into `txBuffer`.

**Digital sensors:** `readDigitalInputs()` is called directly from `HAL_SPI_TxRxCpltCallback` and the result written into `txBuffer.digitalSensors`. Digital sensors are thus updated on every single SPI transaction.

**BEMF and motor state:** TIM6 ISR fires `stop_motors_for_bemf_conv()` every 5 ms. After 500 µs settle time, ADC2 DMA conversion runs. On ADC2 completion, BEMF is processed and position is accumulated. The motor control loop re-applies the PWM command. The main loop's `updatingMotorsInSpiBuffer()` copies `motor_data` into `txBuffer.motor` after checking the SPI bus is not busy.

**IMU:** Main loop calls `readImu()`. When the MPL has new fused data, `txBuffer.imu` is updated.

### Step 2: SPI Transfer

The Pi initiates SPI transactions by calling `spi_update()` in the C SPI layer (in `stm32-data-reader/src/wombat/hardware/Spi.cpp`). This performs a synchronous `ioctl(SPI_IOC_MESSAGE)` on `/dev/spidev`. The Pi sends the current `RxBuffer` (commands) while simultaneously receiving the STM32's `TxBuffer` (sensor data) in a single full-duplex transfer.

The transfer length is always `BUFFER_LENGTH_DUPLEX_COMMUNICATION` — the larger of the two struct sizes. Both ends pad with whatever was last in the struct if the other side's struct is smaller.

The Pi's `stm32-data-reader` calls `spi_update()` on every main-loop iteration. The default `mainLoopDelay` is a very short sleep to avoid 100% CPU usage while still polling as fast as possible.

### Step 3: stm32-data-reader → LCM

`SpiReal::readSensorData()` unpacks the raw `TxBuffer` into a C++ `SensorData` struct with named fields. This is where unit conversions happen:

- Battery voltage is converted from ADC counts to volts using the known 11× resistor divider and 3.3 V reference, then filtered with a 5% EMA.
- Analog sensor values are passed as raw `int16_t` counts. No physical conversion is applied in the SPI layer.
- Motor positions are adjusted by per-motor software offsets (`positionOffsets_[port]`) to implement the "reset position counter" feature without writing to the STM32.

`DataPublisher::publishSensorData()` then serialises each field as an LCM message on the raccoon transport. Key topics:

| LCM channel | Content |
|---|---|
| `libstp/gyro/value` | `vector3f_t` (rad/s) |
| `libstp/accel/value` | `vector3f_t` (m/s²) |
| `libstp/linear_accel/value` | `vector3f_t` (m/s², gravity removed) |
| `libstp/mag/value` | `vector3f_t` (raw counts) |
| `libstp/imu/quaternion` | `quaternion_t` (w, x, y, z) |
| `libstp/imu/heading` | `scalar_f_t` (degrees, retained) |
| `libstp/imu/temp/value` | `scalar_f_t` (°C) |
| `libstp/battery/voltage` | `scalar_f_t` (volts, retained) |
| `libstp/analog/N/value` | `scalar_i32_t` (raw ADC counts) |
| `libstp/digital/N/value` | `scalar_i32_t` (0 or 1) |
| `libstp/bemf/N/value` | `scalar_i32_t` (filtered ticks, retained) |
| `libstp/motor/N/position` | `scalar_i32_t` (accumulated ticks, retained) |
| `libstp/motor/N/done` | `scalar_i32_t` (0 or 1, retained) |
| `libstp/odometry/pos_x` | `scalar_f_t` (meters, retained) |
| `libstp/odometry/pos_y` | `scalar_f_t` (meters, retained) |
| `libstp/odometry/heading` | `scalar_f_t` (radians, retained) |

"Retained" channels use `publishRetained()`, which stores the last value in the raccoon retain store. A new subscriber that calls `subscribeWithRetain` immediately receives the last published value without waiting for the next SPI cycle.

### Step 4: raccoon-transport

The raccoon-transport is a thin C++ wrapper around the LCM library. LCM uses UDP multicast on localhost. The `Transport::spinOnce(0)` call pumps pending messages with zero timeout. Messages are serialised using LCM's code-generated (de)serialisers — each message type (scalar, vector3f, quaternion) has a corresponding `.lcm` schema file in `raccoon-transport/messages/types/`.

### Step 5: libstp HAL

`LcmReader` runs as a singleton with a background `listenLoop` thread. This thread calls `transport_.spinOnce(0)` continuously and updates mutex-protected caches. Each HAL class (Motor, Analog, Digital, IMU) calls the appropriate `LcmReader::read*()` method which takes the lock and returns the cached value. This means sensor reads in user code are non-blocking and always return the most recently observed value.

## Command Path (Python → STM32)

```
Python: motor.set_speed(50)
      │
      ▼
libstp::hal::motor::Motor::setSpeed()
      │  (maps percent to signed duty, applies inversion)
      ▼
LcmDataWriter::setMotor(port, duty)
      │  (publishes scalar_i32_t to libstp/motor/N/power_cmd)
      ▼
LCM UDP multicast (localhost)
      │
      ▼
stm32-data-reader: CommandSubscriber::onMotorPowerCommand()
      │  (maps percent → duty: duty = percent × 4)
      ▼
DeviceController::setMotorPwm()
      │
      ▼
SpiReal::setMotorPwm()
      │  (calls C API: set_motor_pwm(port, duty))
      ▼
C SPI layer: updates rxBuffer in Pi's memory
      │
      ▼
Next spi_update() call: Pi sends updated rxBuffer to STM32
      │  (full-duplex SPI transaction)
      ▼
STM32: rxBuffer updated by DMA
      │  (SPI completion callback fires)
      ▼
HAL_SPI_TxRxCpltCallback validates version and parity
      │
      ▼
Next BEMF cycle (≤5 ms): update_motor() reads motorControlMode
      │  and motorTarget, calls motor_setDutycycle()
      ▼
TIM1/TIM8 compare register updated
      │
      ▼
Motor PWM changes
```

### Reliable Commands

Commands that must not be lost (position targets, PID configuration, servo mode changes, shutdown) are sent with `reliableOpts` in the LCM publish call. The raccoon transport's `ReliablePublisher` layer wraps these in an envelope with a sequence number and retransmits until an ACK is received. The `stm32-data-reader`'s `CommandSubscriber` uses `reliableOpts` when subscribing to ensure it participates in the ACK protocol.

Continuous commands (motor power percentage, motor velocity) are sent without reliable delivery to avoid queuing stale commands. If a power command is dropped, the next iteration of the user's control loop sends a fresh one.

### Timestamp-Based Deduplication

The `CommandSubscriber` tracks the timestamp of the most recently applied command per channel. If a message arrives with a timestamp older than the last applied message (possible if LCM delivers messages out of order), it is silently dropped. This is the `isTimestampNewer()` check.

## Timing Budget

| Stage | Typical latency |
|---|---|
| Sensor measurement to txBuffer | 0–5 ms (BEMF-dominated) |
| SPI transfer | < 1 ms |
| stm32-data-reader main loop | < 1 ms |
| LCM UDP delivery | < 1 ms on localhost |
| LcmReader cache update | < 0.1 ms |
| Python read call | < 0.1 ms (non-blocking) |
| **Total sensor→Python** | **< 10 ms** |

Command latency follows the same path in reverse; the dominant factor is again the BEMF cycle (up to 5 ms) from when the STM32 receives the new command to when the motor output actually changes.
