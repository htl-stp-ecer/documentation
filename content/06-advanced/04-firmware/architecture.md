---
title: "Architecture Overview"
author: "Tobias Madlberger, Mario Scholze"
date: 2026-11-22
draft: false
weight: 1
---

## Mental model — why two processors?

The Wombat robot is controlled by two processors working in a carefully defined partnership, not by one processor doing everything.

The **Raspberry Pi** is a Linux computer. Linux is excellent at networking, Python execution, vision inference, user interfaces, and any task where a few milliseconds of scheduling jitter is acceptable. It is fundamentally unsuited to hard real-time work: the scheduler can preempt any task at any moment, and even a high-priority process can be delayed by kernel activity, IRQ coalescing, or memory pressure.

The **STM32F427** is a bare-metal ARM Cortex-M4F microcontroller. It runs no operating system. Its NVIC interrupt controller fires timer and DMA interrupts within nanoseconds of their programmed time. It can make timing guarantees that Linux simply cannot.

The key constraint that makes this split mandatory is the back-EMF (BEMF) position tracking cycle. Every 1250 µs the firmware must stop one motor, wait exactly 500 µs for the back-EMF signal to settle (motor coasting, PWM switching noise dying), then trigger an ADC conversion. If any step in that sequence is delayed by even a few hundred microseconds, the ADC samples PWM switching noise rather than the true back-EMF, and position tracking degrades or breaks completely. The BEMF cycle is not a "nice to have" — it is the foundation of every closed-loop motor mode (MAV, MTP, chassis velocity). The STM32 guarantees it; Linux on the Pi cannot.

The only shared boundary between the two processors is the **SPI2 link**. The Pi is the SPI master: it initiates every transfer, writes commands into the `RxBuffer`, and reads sensor data out of the `TxBuffer`. The STM32 is the SPI slave: it fills `TxBuffer` continuously with the latest sensor snapshot and applies received `RxBuffer` commands in the next control cycle.

## End-to-end architecture

```mermaid
graph TD
    subgraph HW["Physical Hardware"]
        DC["4x DC Motors\nTIM1/TIM8 PWM ~25kHz\nBEMF via ADC2"]
        SV["4x Servos\nTIM3/TIM9 50Hz\n600-2600µs pulse"]
        AN["6x Analog Sensors\n+ Battery voltage\nADC1 12-bit DMA"]
        DG["11x Digital Inputs\nGPIO polling"]
        MPU["MPU-9250 IMU\nSPI3 (PC10-12)\nDMP 50Hz fusion"]
    end

    subgraph STM32["STM32F427 — Hard Real-Time (180MHz, no OS)"]
        TIM6["TIM6 — 1µs system tick\nBEMF scheduler\nanalog output timer"]
        BEMF["BEMF subsystem\nbemf.c\n200Hz per motor, round-robin"]
        MOTOR["Motor state machine\nmotor.c\nOFF/BRAKE/PWM/MAV/MTP/CHASSIS"]
        PID["Velocity PID\nPID.c\nper-motor, dt-explicit"]
        ADC1s["Analog + Battery\nadcPorts-batteryVoltage.c\n250Hz oversampling"]
        IMUs["IMU acquisition + fusion\nimu.c / imu_data.c\n50Hz, quaternion + heading"]
        ODOM["Odometry\nodometry.c\nBEMF + IMU heading\nmidpoint integration"]
        SPI2s["SPI2 slave\nDMA1 Stream3/4 circular\nTxBuffer → Pi, RxBuffer ← Pi"]
        UART3s["USART3 debug\n115200 8N1\nhb #N heartbeat every 5s"]
    end

    subgraph PI["Raspberry Pi — Linux (user-space C++)"]
        SpiReal["SpiReal / SpiMock\nhardware/SpiReal.cpp\n/dev/spidev*, 20 MHz"]
        DevCtrl["DeviceController\nservices/DeviceController.cpp\nmaintains RxBuffer state"]
        DataPub["DataPublisher\nservices/DataPublisher.cpp\npublishes sensor→ transport, gated 50Hz"]
        CmdSub["CommandSubscriber\nservices/CommandSubscriber.cpp\ntransport→RxBuffer command routing"]
        MotWD["MotorWatchdog\nservices/MotorWatchdog.cpp\nheartbeat timeout → HW shutdown"]
        SysMon["SystemMonitor\nservices/SystemMonitor.cpp\nPi CPU temp → transport 1Hz"]
        UartMon["UartMonitor\nservices/UartMonitor.cpp\ntails USART3 debug output"]
        LCMBr["LcmBroker\nmessaging/LcmBroker.cpp\ntyped pub/sub wrapper"]
    end

    subgraph TRANSPORT["raccoon-transport (shared memory transport bus)"]
        SHM["raccoon_ring\nshared memory\n/dev/shm"]
        CH["channels.yml\nchannel table: names, types,\nring properties"]
    end

    subgraph LIB["Python Layer (raccoon-lib)"]
        PYHAL["raccoon-lib HAL\nmotor / servo / sensor API"]
        MISSION["User mission code\nsequential / parallel steps"]
    end

    HW --> STM32
    STM32 --> HW

    SPI2s -->|"TxBuffer (sensors)\nDMA circular\nTRANSFER_VERSION=22"| SpiReal
    SpiReal -->|"RxBuffer (commands)"| SPI2s

    UART3s -.->|"debug lines\n[stp] hb #N ..."| UartMon

    SpiReal --> DevCtrl
    DevCtrl --> DataPub
    DataPub --> LCMBr
    LCMBr --> SHM

    SHM --> LCMBr
    LCMBr --> CmdSub
    CmdSub --> DevCtrl
    DevCtrl --> SpiReal

    CmdSub --> MotWD
    MotWD --> DevCtrl

    SysMon --> LCMBr
    UartMon --> LCMBr

    SHM --> PYHAL
    PYHAL --> SHM
    PYHAL --> MISSION
    MISSION --> PYHAL
```

## Responsibility split

### What the STM32 owns

The STM32 owns everything that must happen at a precise time, every time, with no jitter.

| Responsibility | Rate | Source file | Peripheral |
|---|---|---|---|
| Motor PWM generation (4 motors) | ~25 kHz | `Actors/motor.c` | TIM1 ch1-3, TIM8 ch1 |
| Servo PWM generation (4 servos) | 50 Hz | `Actors/servo.c` | TIM3, TIM9 |
| BEMF round-robin sample cycle | 800 Hz (200 Hz/motor) | `Sensors/bemf.c` | ADC2, DMA1 |
| Motor PID control loop | 200 Hz (per motor, BEMF-triggered) | `Actors/motor.c`, `Data_structures/PID.c` | — |
| Analog sensor oversampling | 250 Hz output | `Sensors/adcPorts-batteryVoltage.c` | ADC1, DMA |
| Digital input scanning | Every SPI callback | `Sensors/digitalPorts.c` | GPIO |
| IMU acquisition + DMP fusion | 50 Hz | `Sensors/IMU/imu.c` | SPI3 |
| Odometry integration | ~200 Hz (BEMF-paced) | `Sensors/odometry.c` | — |
| SPI slave interface to Pi | Continuous DMA | `Communication/communication_with_pi.c` | SPI2 |
| Flash storage of IMU calibration (disabled) | – | `Storage/flash_cal.c` | Internal flash |

The STM32 does **not** run user code, path planning, or vision. Its job is sensor acquisition, actuator control, and data buffering.

### What the Pi owns

The Pi owns everything that is not timing-critical. It treats the STM32 as a peripheral.

| Responsibility | Service / file |
|---|---|
| SPI master transfer | `hardware/SpiReal.cpp` |
| Sensor data transport publish | `services/DataPublisher.cpp` |
| Command routing (transport → STM32) | `services/CommandSubscriber.cpp` |
| STM32 version probe on startup | `Application.cpp` (`spi_probe_version()`) |
| Motor watchdog (heartbeat timeout) | `services/MotorWatchdog.cpp` |
| STM32 UART debug log forwarding | `services/UartMonitor.cpp` |
| Pi CPU temperature publish | `services/SystemMonitor.cpp` |
| transport message bus management | `messaging/LcmBroker.cpp` |
| User mission code execution | raccoon-lib Python API |
| Vision inference, kinematics planning | raccoon-lib |

## Layered architecture

```mermaid
graph TB
    subgraph L4["Layer 4 — Mission / User Code"]
        USR["Python mission scripts\nraccoon-lib HAL"]
    end
    subgraph L3["Layer 3 — Message Bus (raccoon-transport)"]
        LCM2["raccoon_ring\ntyped channels (channels.yml)\nretained + reliable delivery"]
    end
    subgraph L2["Layer 2 — Pi Bridge (stm32-data-reader, wombat namespace)"]
        APP["Application\n(orchestrator, lifecycle)"]
        SVC["Services: DataPublisher, CommandSubscriber,\nDeviceController, MotorWatchdog,\nSystemMonitor, UartMonitor"]
        HAL2["Hardware HAL: SpiReal/SpiMock\nLcmBroker (transport wrapper)"]
    end
    subgraph L1["Layer 1 — SPI Wire Protocol"]
        BUF["pi_buffer.h\nTxBuffer / RxBuffer packed structs\nTRANSFER_VERSION = 22"]
    end
    subgraph L0["Layer 0 — STM32 Firmware"]
        FW["Actors: motor.c, servo.c\nSensors: bemf.c, imu.c, odometry.c\nHardware: timer.c, dma.c, gpio.c\nData_structures: PID.c, filter.c"]
    end

    L4 <-->|"transport publish/subscribe\nraccoon/* channels"| L3
    L3 <-->|"transport pub/sub"| L2
    L2 <-->|"SPI TransmitReceive DMA"| L1
    L1 <-->|"physical SPI2 bus\nPB12-PB15"| L0
```

The layering is strict: the Pi bridge layer (L2) is the only component that touches the SPI protocol (L1). raccoon-lib never reads the raw buffer; it always talks through transport channels. This isolation means the SPI protocol can evolve (version number bumps) without touching user code.

## The SPI protocol boundary

The file `shared/spi/pi_buffer.h` is the **single source of truth** for the wire protocol. It is compiled into both the STM32 firmware and the Pi bridge; any change must be made exactly once and both sides must be reflashed/rebuilt together. The `TRANSFER_VERSION` field (currently `21`) is checked on every transfer — a mismatch is logged and triggers a reflash warning.

```
TxBuffer (STM32 → Pi):                   RxBuffer (Pi → STM32):
  transferVersion  uint8_t                 transferVersion  uint8_t
  updateTime       uint32_t (µs)           updates          uint32_t (flags)
  motor            MotorData               systemShutdown   uint8_t
    .bemf[4]       int32_t                 motorControlMode uint16_t (3 bits/motor)
    .position[4]   int32_t                 motorTarget[4]   int32_t
                                           chassisVelocity[3] float
  analogSensor[6]  int16_t                 motorGoalPosition[4] int32_t
  batteryVoltage   int16_t                 servoMode        uint8_t
  digitalSensors   uint16_t               servoPos[4]      uint16_t
  imu              ImuData                 motorPidSettings MotorPidSettings
  odometry         OdometryData            kinematics       KinematicsConfig
                                           featureFlags     uint8_t
```

Both structs are `__attribute__((packed))`. The DMA transfer length is `max(sizeof(TxBuffer), sizeof(RxBuffer))` — the longer one dictates the transfer size so the SPI slave never under-reads. See the [SPI Protocol](/06-advanced/04-firmware/spi-protocol/) page for the full wire contract.

## Startup sequence

**STM32 side:** after reset the firmware sets up the clock (PLL 180 MHz), the peripherals, then starts the continuous ADC1 sampling, then the 1 µs system timer (TIM6) and only then arms the SPI2 slave DMA (`initPiCommunication()`), initialises the motor PIDs and sets up the IMU. The order matters: ADC1 must run before TIM6 so the analog accumulators have data on the first interrupt. The full sequence is in [Firmware Runtime and Scheduling]({{< ref "/06-advanced/04-firmware/firmware-runtime.md" >}}).

**Pi side:** `stm32-data-reader` opens the transport and the UART monitor, resets the STM32, opens SPI, probes `TRANSFER_VERSION` (21) and subscribes to the command channels before it enters the main loop. The steps, including the automatic reflash on a version mismatch, are in [Pi Bridge Internals]({{< ref "/06-advanced/04-firmware/pi-bridge-internals.md" >}}) and [Build and Flash]({{< ref "/06-advanced/04-firmware/build-flash.md" >}}).

## Main loop cadence

The Pi-side main loop runs every 5 ms (`config_.mainLoopDelay`): it drains the transport, updates the motor watchdog, does one SPI transfer, and publishes the new sensor data. The steps are listed in [Pi Bridge Internals]({{< ref "/06-advanced/04-firmware/pi-bridge-internals.md" >}}).

The STM32's motor control loop runs **independently** of the Pi's main loop. It is triggered by the ADC2 conversion-complete interrupt (`HAL_ADC_ConvCpltCallback`), which fires approximately every 1250 µs per motor. The SPI transfer is therefore an asynchronous read of a continuously-updated snapshot, not a synchronous request/response.

## File and component map

### STM32 firmware (`stm32-data-reader/firmware/Firmware/src/`)

```
main.c                         — entry point, peripheral init sequence, main loop
stm32f4xx_it.c                 — ISR table (SPI, DMA, ADC callbacks)
stm32f4xx_hal_msp.c            — HAL MSP init/deinit (DMA channel wiring)

Actors/
  motor.c                      — motor state machine (OFF/BRAKE/PWM/MAV/MTP/CHASSIS)
  pid.c                        — velocity + position PID update (dt-explicit)
  servo.c                      — servo CCR update (50Hz shadow register)

Communication/
  communication_with_pi.c      — TxBuffer/RxBuffer globals, initPiCommunication()
  spi.c                        — SPI2 (Pi link) + SPI3 (IMU) init, TxRxCpltCallback
  usart.c                      — USART3 init (debug serial to Pi)

Data_structures/
  PID.c                        — PID controller struct + update function
  filter.c                     — lowPassFilter(), simple single-pole IIR

Hardware/
  dma.c                        — DMA controller init (channels + streams)
  gpio.c                       — all GPIO pin init (motor direction, SPI, IMU CS)
  timer.c                      — TIM6 ISR: BEMF scheduler, analog output timer
  timerInit.c                  — TIM1/3/6/8/9 hardware init

Sensors/
  adcInit.c                    — ADC1 (analog ports) + ADC2 (BEMF) hardware init
  adcPorts-batteryVoltage.c    — analog oversampling accumulator, 250Hz output
  bemf.c                       — BEMF acquisition: stop→wait 500µs→ADC→filter→integrate
  digitalPorts.c               — digital GPIO read, 11-bit mask
  odometry.c                   — dead-reckoning: BEMF velocity + IMU heading, slip detection
  IMU/
    imu.c                      — high-level IMU read/write + orientation matrix apply
    imu_calibration.c          — MPU-9250 self-test, bias computation
    imu_data.c                 — ImuData struct population from MPL output
    imu_setup.c                — DMP firmware load, MPL init, 50Hz sensor fusion
    MPU9250.c                  — SPI3 register read/write (raw driver)
    mpu9250_dmp.c              — DMP firmware blob management
    mpu9250_hal.c              — HAL SPI3 wrapper for MPU9250.c

Storage/
  flash_cal.c                  — IMU calibration save/load stubs (no-ops)

Utility/
  utillity.c                   — doEveryXuSeconds / doAfterXuSeconds macros
```

### Pi bridge (`stm32-data-reader/src/wombat/`)

```
Application.cpp                — top-level orchestrator: lifecycle, main loop, health check
core/
  Logger.cpp                   — spdlog wrapper; routes errors to the transport error channel
  Result.cpp                   — Result<T> success/failure monad

hardware/
  Spi.cpp                      — C-linkage SPI helpers: open, reset, probe version
  SpiReal.cpp                  — production: ioctl SPI_IOC_MESSAGE, 20 MHz
  SpiMock.cpp                  — unit-test: returns synthetic sensor data

messaging/
  LcmBroker.cpp                — typed publish/subscribe over raccoon-transport

services/
  DataPublisher.cpp            — sensor→ transport publish; rate gates (50Hz) + noise epsilon
  CommandSubscriber.cpp        — transport command channels → DeviceController calls
  DeviceController.cpp         — owns RxBuffer state, smooth servo interpolation
  MotorWatchdog.cpp            — heartbeat timeout → setShutdown; recovery on re-feed
  SystemMonitor.cpp            — Pi CPU temperature from sysfs → transport
  UartMonitor.cpp              — tails USART3; detects [stp] hb heartbeat marker
```

### Shared protocol (`stm32-data-reader/shared/spi/`)

```
pi_buffer.h                    — TxBuffer, RxBuffer, all sub-structs, TRANSFER_VERSION,
                                 update flag bits, motor mode enum, feature flag bits
                                 (compiled into both firmware and Pi bridge)
```

### Transport (`raccoon-transport/`)

```
channels.yml                   — the channel table: every channel with its message type
                                 and ring properties (slots, size, reliable, retained)
cpp/include/raccoon/ChannelTable.h — generated from it: channel names as constants and functions
                                 (for example channels::hardware::motor::cmd::power(port))
```

## Motor control modes

The `motorControlMode` field in `RxBuffer` packs 3 bits per motor (motors 0–3 occupy bits 0–11). There are six modes: `MOT_MODE_OFF` (coast), `MOT_MODE_PASSIV_BRAKE`, `MOT_MODE_PWM` (open loop), `MOT_MODE_MAV` (move at velocity), `MOT_MODE_MTP` (move to position) and `MOT_MODE_CHASSIS` (body-frame chassis velocity). The table, the state machine and the behaviour of each mode are on [Motor Control]({{< ref "/06-advanced/04-firmware/motor-control.md" >}}).

## transport channel taxonomy

Every channel is an entry of the channel table (`channels.yml` in raccoon-transport). A channel is named by its path, for example `hardware/motor/0/cmd/power`. The naming convention:
- Channels with a `cmd` segment carry **commands** (imperative, never deduplicated).
- All other channels carry **values / telemetry** (may be rate-limited or deduplicated).

Key channel groups:

| Group | Example channels | Direction |
|---|---|---|
| Motor telemetry | `hardware/motor/N/state/power`, `/position`, `hardware/motor/N/state/bemf` | STM32 → Pi → transport |
| Motor commands | `hardware/motor/N/cmd/power`, `.../cmd/velocity`, `.../cmd/position`, `.../cmd/stop` | transport → Pi → STM32 |
| Chassis | `hardware/chassis/cmd/velocity` | transport → Pi → STM32 |
| Servo | `hardware/servo/N/state/position`, `/mode` | STM32 → Pi → transport |
| Servo commands | `hardware/servo/N/cmd/position`, `.../cmd/mode`, `.../cmd/smooth` | transport → Pi → STM32 |
| IMU | `hardware/imu/state/gyro`, `.../accel`, `.../quaternion`, `.../heading` | STM32 → transport |
| Odometry | `hardware/odometry/state/pos_x`, `/pos_y`, `/heading`, `/vx`, `/vy`, `/wz` | STM32 → transport |
| Odometry cmds | `hardware/odometry/cmd/reset`, `hardware/kinematics/cmd/config` | transport → Pi → STM32 |
| Analog/Digital | `hardware/analog/N/state/value`, `hardware/digital/N/state/value` | STM32 → transport |
| System | `hardware/watchdog/cmd/heartbeat`, `hardware/latch/cmd/engaged`, `hardware/latch/state/flags` | bidirectional |
| Feature flags | `hardware/feature/cmd/bemf_active`, `hardware/feature/state/bemf_active` | transport ↔ Pi |

## Glossary

**BEMF (Back-EMF)**
The voltage a motor generates when it is freewheeling (not driven). Proportional to motor angular velocity. The firmware samples it by briefly stopping the motor, waiting 500 µs for settling, then running an ADC conversion. Used as the velocity feedback signal for MAV and MTP modes.

**TxBuffer**
The packed C struct (`pi_buffer.h`) that the STM32 DMA-streams to the Pi on every SPI transfer. Contains sensor readings: motor BEMF and position, analog sensors, battery voltage, digital inputs, IMU data, and odometry.

**RxBuffer**
The packed C struct that the Pi DMA-writes to the STM32 on every SPI transfer. Contains actuator commands: motor control modes and targets, servo positions, PID settings, kinematics config, and feature flags.

**TRANSFER_VERSION**
An 8-bit integer (`21` as of this writing) in both buffer headers. Checked by the STM32 SPI callback on every transfer and by the Pi reader on startup. A mismatch means the Pi binary and the STM32 firmware are from different protocol revisions and must be rebuilt together.

**`updateFlags`**
An 8-bit bitmask inside `RxBuffer.updates` (and mirrored into `volatile uint8_t updateFlags` in the STM32 firmware). Bits signal which fields of `RxBuffer` have been newly written and need to be processed by the STM32 main loop. Examples: `PI_BUFFER_UPDATE_KINEMATICS` (bit 4), `PI_BUFFER_UPDATE_ODOM_RESET` (bit 5).

**MAV (Move At Velocity)**
Motor control mode `0b011`. The Pi sets `motorTarget[ch]` to the desired BEMF velocity (raw ticks/s units). The STM32 runs a velocity PID loop using the filtered BEMF reading as feedback. Requires BEMF to be enabled.

**MTP (Move To Position)**
Motor control mode `0b100`. The Pi sets `motorGoalPosition[ch]` (BEMF tick count) and `motorTarget[ch]` (speed limit). The firmware cruises at the speed limit, ramps the velocity down linearly over the last 40 ticks, feeds it through the velocity PID and, once within `MTP_DONE_THRESHOLD = 3` ticks of the goal, brakes and **holds** the position: if the motor is pushed more than `MTP_HOLD_RELEASE = 8` ticks away it is driven back. MTP stays active until another mode is commanded.

**CHASSIS mode**
Motor control mode `0b101`. All four motors are set to this mode and the Pi writes a body-frame velocity command `[vx (m/s), vy (m/s), wz (rad/s)]` to `chassisVelocity[]`. The STM32 converts this to per-wheel rad/s using the stored `KinematicsConfig.fwd_matrix`, then runs the per-motor velocity PID. The chassis velocity loop closes entirely on-MCU, with no SPI round-trip in the control path.

**FEATURE_BEMF_DISABLE**
Feature flag bit 0 in `RxBuffer.featureFlags`. When set, the BEMF sampling cycle stops, BEMF values are zeroed, and MAV/CHASSIS modes are blocked at both the Pi guard (`setBemfEnabled`) and the firmware (`motor.c` BEMF-disable guard). PWM and MTP (position-based) modes remain usable. Called "speed mode" because it trades position accuracy for simpler open-loop operation.

**DMP (Digital Motion Processor)**
InvenSense's on-chip processor inside the MPU-9250 that runs sensor fusion (gyro + accel + compass) and produces a calibrated orientation quaternion at 50 Hz. The STM32 loads the DMP firmware blob over SPI3 during `setupImu()` and reads results via `readImu()` in the main loop.

**`raccoon_ring`**
The shared-memory transport of `raccoon-transport`: one ring file `/dev/shm/raccoon-rings/<channel>` per channel, with a futex wake on every publish. All processes (stm32-data-reader, raccoon-lib, camera, UI) subscribe and publish through it, without network and without a broker. See [Transport]({{< ref "/06-advanced/03-transport.md" >}}).

**MotorWatchdog**
A Pi-side safety mechanism in `MotorWatchdog.cpp`. raccoon-lib publishes a heartbeat message to `hardware/watchdog/cmd/heartbeat` periodically. If the watchdog does not see a heartbeat within its timeout, it calls `setShutdown(true)`, which sets `RxBuffer.systemShutdown = SHUTDOWN_MOTOR` and pushes it to the STM32. The STM32 `sanitizeMotorCommandsForShutdown()` function (in `spi.c`) then zeroes all motor commands on the next SPI callback.

**`microSeconds`**
A `volatile uint32_t` incremented in the TIM6 ISR every 1 µs (`timer.c`). Used as the system timestamp throughout the firmware: BEMF scheduling (`doEveryXuSeconds`), PID dt measurement, odometry dt, and `TxBuffer.updateTime`.

**KinematicsConfig**
A struct sent once from raccoon-lib to the Pi reader to the STM32 at startup. Contains the 3×4 inverse kinematics matrix (wheel speeds → body velocity), the 4×3 forward kinematics matrix (body velocity → wheel speeds), per-motor `ticks_to_rad` calibration, and per-motor BEMF zero-offset `bemf_offset`. Required for CHASSIS mode and STM32-side odometry.

**`Result<T>`**
A success/failure monad used throughout the Pi bridge C++ code (`core/Result.h`). Every service function returns `Result<void>` or `Result<T>`. Failure values carry an error string. The `Application` main loop catches failures and either logs/continues or triggers a fatal shutdown.

## Related pages

- [Firmware Runtime and Scheduling](/06-advanced/04-firmware/firmware-runtime/) — interrupt hierarchy, TIM6 ISR, super-loop task table, real-time hazards
- [SPI Protocol](/06-advanced/04-firmware/spi-protocol/) — full wire format, struct fields, transfer timing
- [Data Pipeline](/06-advanced/04-firmware/data-pipeline/) — end-to-end timing from physical signal to Python
- [Pi Bridge Internals](/06-advanced/04-firmware/pi-bridge-internals/) — `Application` lifecycle, `SpiReal`/`SpiMock`, `DeviceController`, `raccoon_ring` SHM transport
- [Motor Control](/06-advanced/04-firmware/motor-control/) — BEMF cycle, PID internals, MTP profile, chassis loop
- [Sensor Reading](/06-advanced/04-firmware/sensors/) — ADC1, BEMF ADC2, IMU DMP pipeline, digital ports
- [IMU Stack](/06-advanced/04-firmware/imu/) — MPU-9250 hardware layer, DMP, eMPL fusion pipeline, orientation frames
- [Robot Services and systemd](/06-advanced/04-firmware/robot-services-and-systemd/) — MotorWatchdog, service topology
- [Build and Flash](/06-advanced/04-firmware/build-flash/) — compiling, flashing, and deploying
