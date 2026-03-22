---
title: "Build and Flash"
author: "Tobias Madlberger"
date: 2026-03-22
draft: false
weight: 6
---

## Toolchain

The firmware is compiled with the **ARM Embedded GCC** toolchain targeting the Cortex-M4F with hardware floating-point:

| Tool | Package (Debian/Ubuntu) |
|---|---|
| Compiler | `arm-none-eabi-gcc` |
| Assembler | `arm-none-eabi-as` |
| Linker | `arm-none-eabi-ld` (via gcc) |
| Object copy | `arm-none-eabi-objcopy` |
| Size reporter | `arm-none-eabi-size` |

Install on Ubuntu/Debian:

```bash
sudo apt install gcc-arm-none-eabi binutils-arm-none-eabi
```

CMake >= 3.24 is also required.

## Build System

The firmware uses CMake. The top-level `CMakeLists.txt` is at `Firmware-Stp/CMakeLists.txt`. It sets the target MCU family (`STM32F427xx`), defines the HSE oscillator frequency (`HSE_VALUE = 24000000` — note: the board uses the internal HSI oscillator, not HSE; the HSE define is legacy), and includes the libraries subdirectory.

The application sources are compiled by `Firmware-Stp/Firmware/CMakeLists.txt`, which globs all `.c` files from each subdirectory and links against:
- `stm32f4xx` — the STM32 HAL library
- `mpl_prebuilt` — the InvenSense Motion Processing Library (binary blob)
- `motion_driver` — the InvenSense MPU-9250 DMP firmware loader

### Compiler Flags

```
-mcpu=cortex-m4    # Target CPU
-mthumb            # Thumb-2 instruction set
-mfloat-abi=hard   # Hardware FPU
-mfpu=fpv4-sp-d16  # VFPv4 single-precision
-O2                # Optimisation (Release build)
-Wall              # All warnings
-gdwarf-2          # Debug information format
```

The linker script is `Firmware-Stp/linker/STM32F427VITx_FLASH.ld`, which defines the memory regions (flash at 0x08000000, RAM at 0x20000000) and places the vector table at the flash origin.

### Build Steps

```bash
cd Firmware-Stp
mkdir -p build
cd build
cmake .. -DCMAKE_BUILD_TYPE=Release
make -j$(nproc)
```

The output files are generated in `build/Firmware/`:
- `wombat.elf` — ELF binary with debug symbols
- `wombat.bin` — flat binary for flashing
- `wombat.hex` — Intel HEX format
- `wombat.map` — linker map file
- `wombat.lss` — extended listing with interleaved source

CMake also runs `arm-none-eabi-size -B wombat.elf` to print the flash and RAM usage.

## Flashing

### Via ST-Link (recommended)

The Wombat board exposes an SWD (Serial Wire Debug) header connected to an ST-Link programmer or any compatible SWD probe. Use `openocd`:

```bash
openocd -f interface/stlink.cfg \
        -f target/stm32f4x.cfg \
        -c "program build/Firmware/wombat.elf verify reset exit"
```

Or with `st-flash`:

```bash
st-flash write build/Firmware/wombat.bin 0x08000000
```

### Via DFU (USB, no debugger needed)

The STM32F427 has a built-in USB DFU bootloader in system memory. To enter DFU mode, hold BOOT0 high at reset. Then:

```bash
sudo apt install dfu-util
dfu-util -d 0483:df11 -a 0 -s 0x08000000:leave -D build/Firmware/wombat.bin
```

### Verifying the Flash

After flashing, open a serial terminal on the UART3 pins (PB10/PB11) at 115200 baud. The firmware does not print a startup banner by default, but the `stm32-data-reader` on the Pi can forward UART output to the application log when `uart.enabled = true` is set in its configuration.

A running STM32 can also be verified by observing the `txBuffer.updateTime` field via the `stm32-data-reader` log, which prints IMU values every 500 SPI cycles. If the timestamp increments, the STM32 is alive.

## Building stm32-data-reader (Pi-side bridge)

The `stm32-data-reader` is a separate CMake project that runs on the Raspberry Pi (aarch64):

```bash
cd stm32-data-reader
mkdir -p build
cd build
cmake .. -DCMAKE_BUILD_TYPE=Release
make -j$(nproc)
```

It depends on:
- **LCM** (Lightweight Communications and Marshalling) — the underlying transport library
- **raccoon-transport** — the message schema library (included as a subdirectory or installed)
- **spdlog** — logging

The build produces a single binary `stm32-data-reader` which should be run as a daemon on the robot:

```bash
./stm32-data-reader
```

A mock SPI mode is available for development without hardware:

```bash
cmake .. -DUSE_SPI_MOCK=ON
```

The mock mode generates synthetic sensor data and does not require `/dev/spidev`.

## Interrupt Priority Table

Understanding the interrupt priority hierarchy is important for debugging timing issues. Higher preempt priority = lower number = can interrupt a lower-priority ISR.

| ISR | Preempt | Sub | Purpose |
|---|---|---|---|
| SPI2 | 0 | 0 | Pi SPI completion (safety-critical) |
| DMA1 Stream 3 (SPI2 RX) | 0 | 1 | SPI2 DMA RX |
| DMA1 Stream 4 (SPI2 TX) | 0 | 2 | SPI2 DMA TX |
| DMA1 Stream 0 (SPI3 RX) | 1 | 1 | IMU SPI3 DMA RX |
| SPI3 | 1 | 0 | IMU SPI completion |
| DMA1 Stream 5 (SPI3 TX) | 1 | 2 | IMU SPI3 DMA TX |
| ADC (ADC2) | 2 | 0 | BEMF ADC completion |
| ADC (ADC2) | 2 | 3 | BEMF DMA completion |
| ADC (ADC1) | 2 | 4 | Analog sensor completion |
| DMA2 Stream 0 (ADC1) | 2 | 1 | Analog sensor DMA |
| DMA2 Stream 2 (ADC2) | 2 | 0 | BEMF DMA |
| TIM6 | 3 | 0 | 1 µs system tick + scheduling |

The SPI2 completion ISR runs at the highest priority to ensure that new Pi commands are processed with minimum latency and the shutdown flag is enforced immediately. The BEMF ADC runs at lower priority so the SPI ISR can always preempt a BEMF processing routine if a new Pi command arrives during BEMF sampling.

## Modifying the Firmware

### Adding a New Sensor

1. Add ADC channel configuration in `adcInit.c` (for analog sensors) or GPIO initialisation in `gpio.c` (for digital sensors).
2. Add reading/processing logic in the appropriate `Sensors/` file.
3. Add a field to `TxBuffer` in `pi_buffer_struct.h` (STM32 side) and the corresponding field in `stm32-data-reader/shared/spi/pi_buffer.h` (shared header). Both must stay in sync.
4. Populate the new field before the main loop calls `updatingAnalogValuesInSpiBuffer()`.
5. In `stm32-data-reader`, unpack the field in `SpiReal::readSensorData()` and add a publish call in `DataPublisher`.
6. Increment `TRANSFER_VERSION` in both `communication_with_pi.h` and `pi_buffer.h` so stale Pi processes are rejected.

### Changing PID Gains

Default gains are in `pid.c`:

```c
#define PID_DEFAULT_P  1.22f
#define PID_DEFAULT_I  0.045f
#define PID_DEFAULT_D  0.000f
```

These are applied at startup. They can be overridden at runtime by sending a `motorPidSettings` block via the SPI protocol without reflashing. From libstp Python:

```python
motor.set_pid(kp=1.5, ki=0.05, kd=0.0)
```

This publishes to `libstp/motor/N/pid_cmd`, which `CommandSubscriber` picks up and forwards to the STM32 via the SPI `updates` bitmask.

### Changing BEMF Timing

The BEMF cycle parameters are in `bemf.h`:

```c
#define BEMF_SAMPLING_INTERVAL           5000  // µs
#define BEMF_CONVERSION_START_DELAY_TIME  500  // µs
```

Reducing `BEMF_SAMPLING_INTERVAL` increases the position tracking update rate but also increases the fraction of time the motors are switched off for sampling, which reduces maximum effective torque. Reducing `BEMF_CONVERSION_START_DELAY_TIME` risks reading residual PWM switching noise rather than the true back-EMF. Both parameters must be chosen together for the specific H-bridge hardware used on the Wombat.
