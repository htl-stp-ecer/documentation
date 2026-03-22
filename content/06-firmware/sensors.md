---
title: "Sensor Reading"
author: "Tobias Madlberger"
date: 2026-03-22
draft: false
weight: 4
---

## Analog Sensor Ports

The Wombat exposes six general-purpose analog input ports (AIN0–AIN5) plus a battery voltage monitor. All seven are scanned by ADC1.

**ADC1 channel assignments:**

| Port | GPIO | ADC channel | Rank |
|---|---|---|---|
| AIN0 | PB1 | ADC1_IN9 | 1 |
| AIN1 | PC1 | ADC1_IN11 | 2 |
| AIN2 | PC2 | ADC1_IN12 | 3 |
| AIN3 | PC3 | ADC1_IN13 | 4 |
| AIN4 | PC4 | ADC1_IN14 | 5 |
| AIN5 | PC5 | ADC1_IN15 | 6 |
| Battery | PC0 | ADC1_IN10 | 7 |

ADC1 is software-triggered, scan mode, 12-bit resolution. The six sensor channels use 112-cycle sample time; the battery voltage channel uses the maximum 480-cycle sample time for best accuracy (battery ADC connects through a resistor divider with higher source impedance).

`sampleAnalogPorts()` is called periodically from the TIM6 interrupt at `ANALOG_SENSOR_SAMPLING_INTERVAL`. It calls `HAL_ADC_Start_DMA(&hadc1, ...)` which fills `analogReader.adcRaw[7]` via DMA2 stream 0.

The ADC completion callback for ADC1 sets a `NEW_DATA` flag in `analogReader.state`. The main loop's `updatingAnalogValuesInSpiBuffer()` then copies the raw counts directly into `txBuffer.analogSensor[6]` and `txBuffer.batteryVoltage` using `memcpy`, as these fields are adjacent in the struct.

**Battery voltage conversion** is performed on the Pi side in `SpiReal::readSensorData()`:

```cpp
const float stmVoltage = 3.3f;
const float voltageDividerFactor = 11.0f;
const float adcResolution = 4096.0f;
float rawVoltage = adcCount * stmVoltage * voltageDividerFactor / adcResolution;
```

A further exponential moving average filter (α = 0.05) smooths the battery voltage before it is published to LCM.

**Raw ADC values** in `txBuffer.analogSensor` are 12-bit counts (0–4095) stored as `int16_t`. Conversion to physical units (e.g., voltage or reflectance) is the responsibility of user code or libstp sensor wrappers.

## Digital Input Ports

Ten general-purpose digital inputs (DIN0–DIN9) plus the on-board button are read each SPI cycle.

**GPIO pin assignments:**

| Port | GPIO |
|---|---|
| DIN0 | PD12 |
| DIN1 | PD13 |
| DIN2 | PD14 |
| DIN3 | PD15 |
| DIN4 | PB9 |
| DIN5 | PB8 |
| DIN6 | PC9 |
| DIN7 | PE0 |
| DIN8 | PE1 |
| DIN9 | PE4 |
| Button | PB0 |

`readDigitalInputs()` iterates over all ten port pins. A pin LOW reads as 1 (logic is inverted — these inputs are typically pulled high and pulled low by the sensor). The button (PB0) uses normal logic (HIGH = pressed).

The function packs all eleven bits into a `uint16_t`, which is written to `txBuffer.digitalSensors` inside the SPI completion callback for minimum latency. The Pi reads this word and demultiplexes individual bits into separate LCM topics (`libstp/digital/0/value`, `libstp/digital/1/value`, …, `libstp/digital/10/value`).

## IMU (MPU-9250 / AK8963)

The IMU is an InvenSense MPU-9250, which integrates a 3-axis gyroscope, 3-axis accelerometer, and a 3-axis AK8963 magnetometer. It is connected to the STM32 via SPI3 (PC10 SCK, PC11 MISO, PC12 MOSI, PE2 CS0).

The firmware uses the InvenSense **eMPL** (embedded Motion Processing Library) and the MPU-9250 DMP (Digital Motion Processor) to perform sensor fusion on-chip. The DMP outputs a 6-axis quaternion (gyro + accelerometer, no magnetometer) at 50 Hz.

### Self-Test and Bias Calibration

On startup, `runImuSelfTest()` calls `mpu_run_6500_self_test()` to run the factory self-test routine. If the gyro and accelerometer pass (result bits 0 and 1 set), the function extracts the measured factory biases and pushes them into the hardware offset registers (`mpu_set_gyro_bias_reg`, `mpu_set_accel_bias_6500_reg`). This eliminates the static offset that every IMU chip has from manufacturing variation.

Note: the magnetometer self-test is not performed. The comment in the code reads: "compass is fucked since we use SPI and I am too lazy to fix invensense shit." The InvenSense library was originally written for I²C; the SPI HAL shim (`mpu9250_hal.c`) maps the library's `hal_i2c_write`/`hal_i2c_read` calls to the SPI driver. The AK8963 is on an auxiliary I²C bus inside the MPU-9250 package and is accessed through the MPU-9250's I²C master mode regardless of whether the STM32→MPU-9250 bus is I²C or SPI.

### MPL Configuration

The MPL is initialised with:

| Feature | Setting |
|---|---|
| Quaternion | Enabled (6-axis, DMP) |
| 9-axis fusion | Disabled (commented out) |
| Gyro temperature compensation | Enabled |
| Fast no-motion detection | Enabled |
| In-use auto-calibration | Enabled |
| Heading from gyro | Enabled |
| Sample rate | 50 Hz (20 ms period) |
| Compass rate | 10 Hz (100 ms period) |
| Gyro FSR | ±2000 dps (configured in `mpu9250_config.h`) |
| Accel FSR | ±2 g |
| Low-pass filter | 42 Hz |

The DMP is loaded with the firmware from InvenSense (`dmp_load_motion_driver_firmware()`), then configured to output 6-axis LP quaternion, raw accelerometer, and calibrated gyro at 50 Hz.

### Orientation Matrices

The IMU chip axes may not align with the robot body frame. The orientation matrix remaps chip axes to board axes. The default matrices in `mpu9250_config.h` are:

```c
// Gyro/accel: chip X = +E, chip Y = −N, chip Z = +D
#define IMU_GYRO_ORIENTATION_MATRIX  { 0, 1, 0,  -1, 0, 0,  0, 0, -1 }

// Compass
#define IMU_COMPASS_ORIENTATION_MATRIX { 1, 0, 0,  0, -1, 0,  0, 0, 1 }
```

The Pi can override these at runtime by setting new 3×3 signed-char matrices in `rxBuffer.imuGyroOrientation` and `rxBuffer.imuCompassOrientation` with the `PI_BUFFER_UPDATE_IMU_ORIENTATION` flag. The firmware calls `updateImuOrientation()` which re-applies the matrices to the MPL via `inv_set_gyro_orientation_and_scale` and `dmp_set_orientation`.

### Data Acquisition Loop

`readImu()` is called on every main-loop iteration. It checks whether 20 ms have elapsed since the last gyro read and 100 ms since the last compass read, then:

1. Reads raw data from the DMP FIFO (`dmp_read_fifo`), which gives gyro, accelerometer, and quaternion data as integer arrays.
2. Pushes data into the MPL (`inv_build_gyro`, `inv_build_accel`, `inv_build_quat`).
3. Reads the magnetometer separately via `mpu_get_compass_reg` and stores raw counts (compass is not fed into the MPL fusion in the current build).
4. Calls `inv_execute_on_data()` to run the MPL fusion step.
5. Calls `read_from_mpl()` to extract fused outputs.

`read_from_mpl()` computes:
- **Quaternion** (w, x, y, z) via `inv_get_quaternion_set`
- **Rotation matrix** from quaternion (for body→world transform)
- **Gyro vector** in world frame (body gyro rotated by quaternion)
- **Accelerometer vector** in world frame (scaled to m/s² by × 9.80665)
- **Linear acceleration** (gravity removed) via `inv_get_linear_accel`
- **Velocity** from integrated linear acceleration (experimental — decays with factor 0.998 per cycle to limit drift)
- **Heading** in degrees derived from the quaternion: `atan2(q1*q2 - q0*q3, q0^2 + q2^2 - 0.5)` (NB: this uses q30 fixed-point intermediate values)

When new data is available and the SPI bus is not busy, `txBuffer.imu` is updated atomically from the local `imu` struct.

### SPI3 Configuration

SPI3 is configured as master at startup with prescaler 64 (giving ~1.4 MHz), then changed to prescaler 256 during the IMU initialisation to stay within the MPU-9250's configuration register speed limit. After DMP load it can run faster, but the `changeSPIBaudRatePrescaler` call to restore a higher rate is commented out in the current code.

The SPI3 DMA (DMA1 stream 0/5) runs in normal (not circular) mode — each transaction is explicitly started by the MPU-9250 driver and completes with an interrupt.
