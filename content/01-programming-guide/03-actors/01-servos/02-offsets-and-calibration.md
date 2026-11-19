---
title: "Servo Offsets and Calibration"
author: "Tobias Madlberger, Mario Scholze"
date: 2026-11-19
draft: false
weight: 20
description: "Servo offsets, calibrating them with raccoon calibrate servos, finding angles and the limits of the hardware."
---

# Servo Offsets and Calibration

An offset absorbs a mechanical difference once, so the angles in your positions keep describing the mechanism.

## Offset

`offset` shifts every position of a servo by a fixed number of degrees:

```yaml
claw_servo:
  type: Servo
  port: 2
  offset: 5        # adds 5 degrees to every position
  positions:
    closed: 135
    open: 30
```

This is useful when replacing a broken servo. A new servo mounted on the same shaft may land a few teeth off from the original, causing all positions to be shifted by the same amount. Since all positions are just angle values, adding a constant offset shifts every position by the same amount — no need to re-tune each angle individually.

**Real-world use: mechanical assembly compensation.** The clawbot's shoulder servo is mounted with an unavoidable 22.4-degree physical offset due to how the joint spline engages at assembly time. Rather than adjusting every named position by 22.4 degrees, the team used `offset=22.4`:

```yaml
# config/servos.yml (adapted from the clawbot)
arm_sholder:
  type: Servo
  port: 1
  offset: 22.4      # Compensates for spline engagement offset at assembly
  positions:
    max_down: 195.3
    _0deg: 169.2
    p90deg: 69
    max_up: 20
```

This way all named angles describe the arm's actual joint angle, and the hardware reality is absorbed in `offset` — no magic-number subtraction sprinkled through mission code.


> **Tip:** When choosing your servo angles, try to avoid values very close to 0 or 180. Keeping some margin (e.g. 10–170) leaves room to apply a positive or negative offset when a servo needs to be swapped at competition — without hitting the physical limits.

## Calibrate offsets with the CLI

`raccoon calibrate servos` moves a servo to one of its positions and lets you correct it live, then writes the result into the `offset` of that servo in `config/servos.yml`. It needs a connected robot and works on servos that have `positions`.

1. Pick a servo, then one of its positions. The servo moves to `position + offset`.
2. Move it with the up and down arrow keys. The left and right arrow keys change the step between 0.5, 1 and 2 degrees.
3. Press Enter when the mechanism sits where this position should be. The change is added to the stored `offset`.
4. Press Esc or Ctrl+C to leave without saving the current servo.

## Finding angles

To find the right angle values for each position:

1. Open **BotUI → Sensors & Actors** on the robot's touchscreen
2. Use the servo slider to move the servo manually
3. Note the angle when it's in the position you want
4. Enter that angle in your `ServoPreset` positions

Repeat for each named position. The angles depend on how the servo is mounted — there's no universal "up" or "down" angle.

If you are probing the safe range of a mechanism:

1. start conservatively, away from hard stops
2. approach limits in small increments
3. listen for buzzing or stalling
4. back off and keep margin instead of using the absolute maximum travel

Do not assume that because one servo tolerated `190` degrees, the replacement one will too.

## What the software allows and the hardware tolerates

This distinction matters a lot:

- the software servo API accepts arbitrary degree values
- the step layer does **not** clamp commands to `0..180`
- the HAL stores the exact commanded degree value and forwards it to the platform

So yes, you can command values below `0` or above `180` if your mechanism and servo happen to tolerate it.

That does **not** mean it is safe or repeatable.

### Overtravel / beyond-180 operation

Some hobby servos can physically rotate beyond the nominal `0..180` range, and some mechanisms are intentionally tuned to use that extra travel. In practice:

- two supposedly identical servos will often not tolerate the same extra travel
- end-stop behavior changes across manufacturers and even between units
- using negative angles or angles above `180` increases the risk of gear strain, buzzing, overheating, and self-damage
- replacing a servo mid-competition may invalidate all the extra-range values you tuned before

Treat overtravel as a hardware-specific calibration trick, not as a portable semantic range.

Recommended rule:

- use conservative in-range values for normal robots
- only use out-of-range values when you have physically tested that exact servo + linkage
- leave safety margin instead of tuning right against a hard stop

### Offset is not a safety system

`offset` is only a constant angle shift. It is useful when a replacement servo is mounted a few teeth differently than the old one.

It does **not** guarantee:

- safe operation near hard stops
- that two servos share the same usable overtravel
- that a servo with the same model number has the same real zero point

If you are already relying on `-10` or `195` degree style commands, a changed offset can push the mechanism into a stop much more easily.
