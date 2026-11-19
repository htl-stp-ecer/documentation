---
title: "hardware.yml"
author: "Tobias Madlberger, Mario Scholze"
date: 2026-11-19
draft: false
weight: 10
description: "The sensor config file: how entries are declared, the required button entry and the special entries."
---

# hardware.yml

`config/hardware.yml` declares every sensor on the robot. Motors and servos are merged in from their own files, so the codegen sees one flat namespace. Each key becomes an attribute on the generated `Defs` class, and the key must be a valid Python identifier.

```yaml
# config/hardware.yml
_motors: !include-merge 'motors.yml'
_servos: !include-merge 'servos.yml'

button:
  type: DigitalSensor
  port: 10

front_left_ir_sensor:
  type: IRSensor
  port: 0

front:
  type: SensorGroup
  left: front_left_ir_sensor
  right: front_right_ir_sensor
```

The two `_` keys are merge anchors: the loader consumes them and they do not become attributes. How `!include-merge` works is on [Config Structure → Includes]({{< ref "/01-programming-guide/01-basics/03-config-structure.md#includes" >}}). Motors are described in [Motor config]({{< ref "/01-programming-guide/03-actors/02-motors/01-motor-config.md" >}}), servos in [Servos in servos.yml]({{< ref "/01-programming-guide/03-actors/01-servos/01-servos-yml.md" >}}).

## Entry types

| `type` | Page |
|--------|------|
| `IRSensor` | [IR Sensors]({{< ref "/01-programming-guide/04-sensors/02-ir-sensors.md" >}}) |
| `SensorGroup` | [Sensor Groups]({{< ref "/01-programming-guide/04-sensors/03-sensor-groups.md" >}}) |
| `DigitalSensor` | [Digital Sensors and Buttons]({{< ref "/01-programming-guide/04-sensors/04-digital-sensors.md" >}}) |
| `AnalogSensor`, `ETSensor` | [Analog and ET Sensors]({{< ref "/01-programming-guide/04-sensors/05-analog-and-et-sensors.md" >}}) |
| `Motor`, `Servo` | in `motors.yml` and `servos.yml`, see above |

## Entries with a special meaning

### `button`

Every project must define an entry named `button` of type `DigitalSensor`. Steps like `wait_for_button()` use it as the confirmation input, and the code generator rejects a project without it. The Wombat's built-in button is on port `10`.

```yaml
button:
  type: DigitalSensor
  port: 10
```

### `imu`

An `imu` entry is always generated, even when it is not listed. If you list it, extra keys are passed to the `Imu()` constructor.

```yaml
imu:
  type: IMU
```

### `wait_for_light_sensor`

The name `wait_for_light_sensor` is reserved for the start-lamp sensor. See [Wait for Light]({{< ref "/01-programming-guide/01-basics/11-wait-for-light.md" >}}) for the keys it accepts.

## `Defs.analog_sensors`

The codegen collects every analog-type sensor (`AnalogSensor`, `IRSensor`, `ETSensor`) into the `Defs.analog_sensors` list. By default, [`collect_ir_set`]({{< ref "/01-programming-guide/05-calibration/03-collect-ir.md" >}}) samples all `IRSensor` entries in that list. Pass `sensors=[...]` to limit it, for example to leave out the start-lamp sensor.
