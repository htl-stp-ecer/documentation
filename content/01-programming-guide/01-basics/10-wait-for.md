---
title: "Wait For"
author: "Tobias Madlberger, Mario Scholze"
date: 2026-11-19
draft: false
weight: 100
description: "The wait_for steps: pause a sequence until a condition, time, button, sensor or the start lamp."
---

# Wait For

The `wait_for_*` steps pause a sequence until something happens. They do not move the robot. Use them to hold the program until a sensor, a button, a time or a condition is met.

| Step | Waits until |
|------|-------------|
| `wait_for(condition)` | the [until condition]({{< ref "/01-programming-guide/02-driving/03-until-conditions.md" >}}) is true |
| `wait_for_seconds(seconds)` | the time has passed |
| `wait_for_button(message)` | the button on the robot is pressed |
| `wait_for_digital(sensor, pressed=True)` | a [digital sensor]({{< ref "/01-programming-guide/04-sensors/04-digital-sensors.md" >}}) reads the given state |
| `wait_until_distance(cm)` | the robot has driven the given distance since the step began. Use it in a `parallel(...)` branch next to a drive step |
| `wait_for_checkpoint(seconds)` | the mission clock reaches the given time, see [Synchronizing Two Robots]({{< ref "/06-advanced/08-runtime-and-tooling/04-synchronizing-robots.md" >}}) |
| `wait_for_light(...)` | the start lamp turns on, see [Wait for Light]({{< ref "/01-programming-guide/01-basics/11-wait-for-light.md" >}}) |
| `wait_for_background(name)` | a background step has finished, see [Parallel and Background]({{< ref "/01-programming-guide/01-basics/08-parallel-and-background.md" >}}) |

## `wait_for`

`wait_for` takes any condition you could also pass to `.until(...)` on a motion step and blocks until it is true. It polls the condition at 50 Hz. Conditions are combined with `|`, `&` and `+`. The full list of conditions and how to combine them is on [Until Conditions]({{< ref "/01-programming-guide/02-driving/03-until-conditions.md" >}}).

```python
# Wait until the front-left IR sensor sees black
wait_for(on_black(Defs.front.left))

# Wait for black or a 5-second timeout
wait_for(on_black(Defs.front.left) | after_seconds(5))
```

## `wait_for_seconds`

Pauses for a fixed time. Nothing else is commanded, and other tasks such as odometry keep running.

```python
seq([
    set_motor_power(Defs.arm_motor, 100),
    wait_for_seconds(2.5),
    motor_brake(Defs.arm_motor),
])
```

## `wait_for_button`

Shows a message on the BotUI and waits until the robot's button is pressed. Use it to let the operator confirm that the robot is placed correctly.

```python
wait_for_button("Place the robot at the start position")
```

## `wait_for_digital`

Waits until a digital sensor reads the wanted state. `pressed=True` (default) waits for a high reading, `pressed=False` for a low one.

```python
wait_for_digital(Defs.arm_down_limit)                  # until pressed
wait_for_digital(Defs.arm_down_limit, pressed=False)   # until released
```
