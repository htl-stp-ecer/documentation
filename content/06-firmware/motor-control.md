---
title: "Motor Control"
author: "Tobias Madlberger"
date: 2026-03-22
draft: false
weight: 3
---

## PWM Generation

Each DC motor is driven by an H-bridge. The STM32 generates a PWM signal for the enable pin of the H-bridge and drives two direction pins (D0, D1) to control direction.

Four timer peripherals generate the PWM signals:

| Timer | Motors | Channels | PWM frequency |
|---|---|---|---|
| TIM1 | Motor 0 (CH1), Motor 1 (CH2), Motor 2 (CH3) | PA8, PA9, PA10 | ~25 kHz |
| TIM8 | Motor 3 (CH1) | PC6 | ~25 kHz |

**PWM frequency calculation for TIM1/TIM8:**

- APB2 clock = 90 MHz (HCLK/2)
- TIM1/TIM8 input clock = 180 MHz (2× APB2 because APB2 prescaler ≠ 1)
- Prescaler = 18 − 1 = 17
- Timer frequency = 180 MHz / 18 = 10 MHz
- Period = 400 − 1 = 399
- PWM frequency = 10 MHz / 400 = **25 kHz**

The compare register (`__HAL_TIM_SET_COMPARE`) accepts values from 0 (always off) to 399 (always on). This is `MOTOR_MAX_DUTYCYCLE`. The PWM duty cycle in percent is `(duty / 399) × 100`.

**Direction control:**

The H-bridge direction pins map as follows:

| D0 | D1 | Effect |
|---|---|---|
| LOW | LOW | Coast (motor floats) |
| HIGH | LOW | Counter-clockwise (CCW) |
| LOW | HIGH | Clockwise (CW) |
| HIGH | HIGH | Short brake (motor windings shorted) |

Direction is set by `motor_setDirection()` which writes to the GPIO pins directly using HAL. Changing direction does not automatically stop the motor; the duty cycle remains unchanged until explicitly set.

## Back-EMF (BEMF) Measurement

The Wombat uses back-EMF rather than quadrature encoders for position feedback. This is an unusual design choice. When a brushed DC motor spins, it generates a voltage proportional to speed (back-EMF). By briefly stopping the PWM and sampling the voltage across the motor terminals, the STM32 can measure motor velocity.

Each motor has two dedicated ADC pins connected to the motor terminals (the high and low sides of the H-bridge output). Back-EMF is the differential: `BEMF = ADC_high − ADC_low`.

**ADC2 channel assignments (BEMF):**

| Channel | GPIO | Motor |
|---|---|---|
| ADC2_IN0 | PA0 | Motor 0 BEMF high |
| ADC2_IN1 | PA1 | Motor 0 BEMF low |
| ADC2_IN2 | PA2 | Motor 1 BEMF high |
| ADC2_IN3 | PA3 | Motor 1 BEMF low |
| ADC2_IN4 | PA4 | Motor 2 BEMF high |
| ADC2_IN5 | PA5 | Motor 2 BEMF low |
| ADC2_IN6 | PA6 | Motor 3 BEMF high |
| ADC2_IN7 | PA7 | Motor 3 BEMF low |

ADC2 is configured for 12-bit resolution, software-triggered, 8 conversions per sequence, 84 cycles per channel sample time. DMA2 stream 2 transfers the 8 results to `adc_dma_bemf_buffer[8]`.

### BEMF Measurement Timing

The BEMF measurement cycle is driven by TIM6 (`HAL_TIM_PeriodElapsedCallback`):

1. Every `BEMF_SAMPLING_INTERVAL` (5000 µs = 200 Hz), `stop_motors_for_bemf_conv()` is called.
2. This cuts all motor PWM drive (direction pins set to OFF) and transitions state to `WAITING_TO_START`.
3. After `BEMF_CONVERSION_START_DELAY_TIME` (500 µs), `startBemfReading()` is called.
4. This triggers `HAL_ADC_Start_DMA(&hadc2, ...)` and transitions state to `CONVERSION_ONGOING`.
5. When ADC2 completes, `HAL_ADC_ConvCpltCallback` fires. State transitions to `CONVERSION_DONE`.
6. `processBEMF()` computes the differential readings, applies a low-pass filter, updates `motor_data.position`, and then calls `update_motor()` for each channel.
7. `update_motor()` applies the current control mode (PWM / MAV / MTP) to regenerate the PWM command, which restores motor drive.

The 500 µs delay between cutting PWM and sampling is necessary because the motor winding inductance and any snubber capacitance on the H-bridge output must settle before the ADC reading is meaningful.

### BEMF Processing

```c
bemfRawReadings[0] = adc_dma_bemf_buffer[3] - adc_dma_bemf_buffer[2]; // motor 0
bemfRawReadings[1] = adc_dma_bemf_buffer[1] - adc_dma_bemf_buffer[0]; // motor 1
bemfRawReadings[2] = adc_dma_bemf_buffer[7] - adc_dma_bemf_buffer[6]; // motor 2
bemfRawReadings[3] = adc_dma_bemf_buffer[5] - adc_dma_bemf_buffer[4]; // motor 3
```

Note the channel ordering within each motor pair (e.g., buffer indices 3 and 2 for motor 0) is hardware-specific and reflects the physical wiring of the H-bridge outputs.

Each raw reading is passed through a **first-order IIR low-pass filter**:

```c
filtered = alpha * newValue + (1.0f - alpha) * previousValue;
// alpha = 0.2f
```

With α = 0.2, this is a relatively aggressive filter that rejects high-frequency switching noise but also somewhat attenuates the actual velocity signal at high speeds. If the filtered value exceeds 1700 (an error guard), the reading is discarded.

**Dead zone:** BEMF values with absolute value ≤ 8 are not accumulated into the position counter. This prevents slow drift when the motor is nominally stopped.

### Position Accumulation

Each BEMF cycle, the filtered reading (if outside the dead zone) is added to `motor_data.position[ch]`. This makes the position counter a running integral of BEMF, not a true encoder count. The unit of position is therefore "BEMF ticks" — not radians, not millimetres. The `KinematicsConfig.ticks_to_rad[4]` field in the SPI protocol provides the per-motor conversion factor from BEMF ticks to radians of wheel rotation.

Position counters are never reset at the firmware level by the main loop. Reset is accomplished by the Pi: the `stm32-data-reader` process maintains software offsets (`positionOffsets_[port]`) and applies them when reading `rx->motor.position[i]`.

## PID Control

The firmware implements a discrete-time PID controller without a derivative filter (the derivative term is just the first difference of the error). The `PidController` structure holds state for one motor:

```c
typedef struct {
    float kP;
    float kI;
    float kD;
    float iMax;    // Maximum integral contribution
    float outMax;  // Output saturation limit
    float prevErr;
    float iErr;    // Integral accumulator
} PidController;
```

The update function implements positional PID with integral clamping:

```c
pErr  = goal - current;
iErr += pErr;
dErr  = pErr - prevErr;

iTerm = kI * iErr;
if (iTerm > iMax)  { iTerm = iMax;  iErr = iMax  / kI; }
if (iTerm < -iMax) { iTerm = -iMax; iErr = -iMax / kI; }

cmd = kP * pErr + iTerm + kD * dErr;
cmd = clamp(cmd, -outMax, outMax);
```

The integral clamping is applied to the *contribution* rather than the raw accumulator, which avoids the issue where back-calculating the accumulator from a saturated term gives an incorrect value when `kI` changes.

**Default velocity PID gains:**
- `kP = 1.22`, `kI = 0.045`, `kD = 0.0`
- `iMax = 399` (full duty), `outMax = 399`

**Default position PID gains:**
- `kP = 0.01`, `kI = 0.0`, `kD = 0.015`
- `iMax = 399`, `outMax = 399`

These are starting points. The optimal values depend on the motor, load, and battery voltage. The Pi can override them at any time via the `motorPidSettings` block in the `RxBuffer` combined with the appropriate update flag.

## Motor Operating Modes

`update_motor()` is called once per BEMF cycle per motor. It reads `rxBuffer.motorControlMode`, extracts the 3-bit mode for the relevant channel, and implements the corresponding behaviour:

### `MOT_MODE_OFF` (0)
Direction pins both LOW, duty cycle 0. Motor coasts.

### `MOT_MODE_PASSIV_BREAK` (1)
Direction pins both HIGH, duty cycle 0. Both motor terminals are shorted through the H-bridge, providing regenerative braking.

### `MOT_MODE_PWM` (2)
Direct open-loop PWM. `motorTarget[ch]` is the signed duty cycle (negative = reverse). The duty is passed to `applyMotorOutput()` which sets direction and calls `motor_setDutycycle()`. The range is −399 to +399.

### `MOT_MODE_MAV` — Move At Velocity (3)
Closed-loop velocity control using the velocity PID. The BEMF filtered reading is the process variable; `motorTarget[ch]` is the setpoint (in BEMF ticks per 5 ms, approximately). The PID output is the signed PWM duty.

```c
int32_t pidOut = pid_update(&pidControllers[ch], target, bemf_filtered);
applyMotorOutput(ch, pidOut);
```

### `MOT_MODE_MTP` — Move To Position (4)
Cascaded position + velocity control. The outer loop is a proportional-derivative controller on position error; its output is a velocity setpoint. The inner loop is the velocity PID:

```c
int32_t velTarget = pid_update(&posPidControllers[ch], goalPos, currentPos);
// Clamp velTarget to motorTarget[ch] (speed limit)
if (speedLimit > 0) velTarget = clamp(velTarget, -speedLimit, speedLimit);
int32_t pidOut = pid_update(&pidControllers[ch], velTarget, bemf_filtered);
applyMotorOutput(ch, pidOut);
```

When `|goalPos - currentPos| <= MTP_DONE_THRESHOLD` (50 BEMF ticks), bit `ch` of `motor_data.done` is set. The Pi reads this flag and uses it to determine when a `moveToPosition` command has completed.

### Mode Change Handling

When the control mode changes between BEMF cycles, both PID controllers for that motor are reset (`prevErr = 0, iErr = 0`) to prevent integral windup carry-over from a previous command. The done flag for that motor is also cleared.

## Servo Control

Four servo outputs are generated by TIM3 and TIM9. These timers run at 1 MHz (prescaler = 90) with period 20 000, giving a 50 Hz PWM with 1 µs resolution — exactly the standard RC servo signal.

| Timer | Servos | GPIO pins |
|---|---|---|
| TIM3 CH2 | Servo 1 | PC7 |
| TIM3 CH3 | Servo 0 | PC8 |
| TIM9 CH1 | Servo 3 | PE5 |
| TIM9 CH2 | Servo 2 | PE6 |

A dedicated 6 V regulator powers the servo rail. The firmware controls the regulator's enable pin (`SERVO_6V0_ENABLE_Pin`, PE10). When all servos are fully disabled, the 6 V supply is cut. When any servo transitions to enabled state, the supply is first raised, then the PWM channel is started.

The `update_servo_cmd()` function runs at 10 Hz from the main loop. Servo position is specified in timer ticks (600 = 0°, 2600 = 180°, 600 + degrees × 10 = position). The `stm32-data-reader` converts user-facing degrees to this scale before writing to `rxBuffer.servoPos[port]`.

The 10 Hz update rate is deliberately slow. Updating servos every millisecond can cause jitter when the SPI bus is transferring large buffers and the timer compare register is written mid-cycle.
