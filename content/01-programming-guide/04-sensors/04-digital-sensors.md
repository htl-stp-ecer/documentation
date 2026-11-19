---
title: "Digital Sensors and Buttons"
author: "Tobias Madlberger, Mario Scholze"
date: 2026-11-19
draft: false
weight: 40
description: "Declaring buttons and limit switches and using them in steps and stop conditions."
---

# Digital Sensors and Buttons

A digital sensor returns `True` when pressed and `False` when released. Use it for buttons, limit switches and bump sensors.

## Declaration

```yaml
# config/hardware.yml
button:
  type: DigitalSensor
  port: 10

arm_down_limit:
  type: DigitalSensor
  port: 0
```

`port` is the digital port. The entry named `button` is required, see [hardware.yml]({{< ref "/01-programming-guide/04-sensors/01-hardware-yml.md" >}}).

## Usage in steps

```python
# Wait until pressed
wait_for_digital(Defs.arm_down_limit, pressed=True)

# Use as stop condition
drive_forward(speed=0.5).until(on_digital(Defs.arm_down_limit))

# Wait for the Wombat button
wait_for_button()
```

The `wait_for_*` steps are explained on [Wait For Steps]({{< ref "/01-programming-guide/01-basics/10-wait-for.md" >}}), stop conditions on [Until Conditions]({{< ref "/01-programming-guide/02-driving/03-until-conditions.md" >}}).

## Example: motor with limit switch

Run a motor until it hits a limit switch:

```python
def lower_arm():
    return seq([
        set_motor_velocity(Defs.arm_motor, -100),
        wait_for_digital(Defs.arm_down_limit),
        motor_passive_brake(Defs.arm_motor),
    ])
```
