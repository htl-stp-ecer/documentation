---
title: "Custom Steps"
author: "Tobias Madlberger"
date: 2026-06-18
draft: false
weight: 10
---

# Custom Steps

## Concept: When to Write Custom Steps

The built-in step library covers the most common competition needs — line following, wall alignment, servo presets, motor control. Custom steps fill the gaps: mechanisms without limit switches, scan-while-driving routines, heading-hold controllers, project-specific DSL wrappers.

There are three approaches, in order of complexity:

1. **Function-based steps** (recommended) — a regular Python function that returns a composition of existing steps. No class needed.
2. **Class-based steps** — extend `Step` for steps with their own async logic.
3. **Motion steps** — extend `MotionStep` for tight 100 Hz control loops (PID controllers, sensor servoing).

```mermaid
flowchart TD
    Q{What does the step need?}
    Q -->|"Reuse existing steps in a named pattern"| A[Function-based step\nReturn seq() / parallel()]
    Q -->|"Custom async logic: scanning, waiting, sampling"| B[Step class\n_execute_step()]
    Q -->|"100 Hz control loop: PID, sensor servoing"| C[MotionStep class\non_update() returning bool]
    A --> D[Import and call\nlike any built-in]
    B --> D
    C --> D
```

## Function-Based Custom Steps (Recommended)

The simplest way to create a reusable step: write a function that returns a composition of existing steps.

### Example: Lower a Container Motor

From the Ecer2026 ConeBot — a motor-driven container that moves down until a limit switch is hit:

```python
# src/steps/cone_container_steps.py
from raccoon import *
from src.hardware.defs import Defs


def down_cone_container() -> Sequential:
    return seq([
        set_motor_velocity(Defs.cone_container_motor, -100),
        wait_for_digital(Defs.cone_arm_down_button),
        motor_passive_brake(Defs.cone_container_motor),
    ])
```

Use it in a mission like any other step:

```python
from src.steps.cone_container_steps import down_cone_container

class M020CollectMission(Mission):
    def sequence(self) -> Sequential:
        return seq([
            drive_forward(20),
            down_cone_container(),    # Your custom step
            drive_backward(10),
        ])
```

### Example: Motor-Timed Mechanism (No Limit Switch)

When a mechanism is too simple to justify limit switches, use `set_motor_velocity()` + `wait_for_seconds()` + `motor_passive_brake()` wrapped in a named function. Adapted from the Ecer2026 ConeBot:

```python
def down_cone_container_timed():
    return seq([
        set_motor_velocity(Defs.cone_container_motor, velocity=-1700),
        wait_for_seconds(0.4),
        motor_passive_brake(Defs.cone_container_motor),
        drive_forward(cm=10),
        set_motor_velocity(Defs.cone_container_motor, velocity=1700),
        wait_for_seconds(0.2),
        motor_passive_brake(Defs.cone_container_motor),
    ])
```

The velocity of `-1700` is in raw BEMF ticks — check your motor's `ticks_to_rad` calibration to convert to real units. Time-based control is the right trade-off when the mechanical stroke is consistent and sensor wiring is impractical.

### Example: Grab and Lift

A reusable step that grabs an object and lifts it:

```python
def grab_and_lift(delay: float = 0.2) -> Sequential:  # you can use args just like in a function
    return seq([
        Defs.claw.open(),
        Defs.arm.down(),
        wait_for_seconds(delay),       # Wait for arm to settle
        Defs.claw.closed(),
        wait_for_seconds(delay),       # Wait for claw to grip
        Defs.arm.up(),
    ])

def drop_object() -> Sequential:
    return seq([
        Defs.arm.down(),
        Defs.claw.open(),
        wait_for_seconds(0.3),
        Defs.arm.up(),
    ])
```

> **Remember:** Passing a number to a `ServoPreset` method like `Defs.claw.closed(120)` sets the servo *speed* in degrees per second — it does **not** add a delay. Use `wait_for_seconds()` when you need to pause between actions.

### Example: Wall-Align-and-Mark Pattern

A common competition pattern — align against a wall and mark the heading as reference:

```python
def align_and_mark() -> Sequential:
    return seq([
        wall_align_backward(accel_threshold=0.3),
        mark_heading_reference(),
    ])
```

## Registering Steps for WebIDE Discovery: `@dsl`

If you want your step function to appear in the BotUI step palette (and in API reference listings), decorate it with `@dsl`:

```python
from raccoon import *
from raccoon.step.annotation import dsl


@dsl(tags=["custom", "arm"])
def grab_and_lift(delay: float = 0.2) -> Sequential:
    return seq([...])
```

Steps without `@dsl` still work perfectly in mission code — they're just invisible to the discovery system. Use `@dsl` for steps you want other team members to find in the UI; leave it off for internal helpers.

> **`@dsl(hidden=True)`** registers the step for metadata purposes but hides it from the palette. Useful for UIStep subclasses that are invoked programmatically, not by drag-and-drop.

## Class-Based Custom Steps

For steps that need custom logic, extend the `Step` base class directly.

> **Never use threads or `time.sleep()` in steps.** The SDK is single-threaded by design and not thread-safe. Always use `await asyncio.sleep()` to wait. See [Advanced Topics]({{< ref "11-advanced" >}}) for why this matters.

### The Step Interface

Add `@dsl_step` to your class so the code generator creates a factory function and builder for it (see [Steps DSL]({{< ref "04-steps" >}}) for how this works):

```python
from raccoon import Step, GenericRobot
from raccoon.step.annotation import dsl_step


@dsl_step(tags=["custom"])
class MyCustomStep(Step):
    def __init__(self, value: float = 1.0) -> None:
        super().__init__()
        self._value = value

    def _generate_signature(self) -> str:
        """Return a unique string identity for this step instance.

        Required on every Step subclass. The framework uses this string
        as the key in the timing database — if two different steps share
        the same signature, their timing records are merged and anomaly
        detection becomes unreliable. Include all parameters that
        materially change behavior.
        """
        return f"MyCustomStep(value={self._value:.2f})"

    async def _execute_step(self, robot: GenericRobot) -> None:
        """Called once when the step runs. Must be async."""
        # Your logic here
        pass

    def required_resources(self) -> frozenset[str]:
        """Return hardware resources this step uses (for parallel safety)."""
        return frozenset()  # e.g., frozenset({"drive", "servo:0"})
```

The `@dsl_step` decorator generates:
- `MyCustomStepBuilder` — a builder class with fluent setters for every `__init__` parameter
- `my_custom_step()` — a `snake_case` factory function you call in missions

> **`_generate_signature()` is required.** The base class provides a fallback that returns `self.__class__.__name__`, but that means every instance of your step — regardless of parameters — shares the same timing bucket. If you have, say, `drive_forward(10)` and `drive_forward(50)` both using the default signature, the timing system thinks they are the same step and mixes their measurements. Always override it to include the parameters that distinguish different instances.

If you don't need a generated builder (e.g., the step has no parameters), you can use `@dsl` instead to just register it for discovery without code generation:

```python
from raccoon.step.annotation import dsl

@dsl(tags=["custom"])
class SimpleStep(Step):
    def _generate_signature(self) -> str:
        return "SimpleStep()"

    async def _execute_step(self, robot: GenericRobot) -> None:
        # ...
        pass
```

### `_execute_step` vs `run_step`

When wrapping a built-in step inside a custom step's `_execute_step`, there are two ways to call it:

| Method | When to use |
|--------|------------|
| `await step.run_step(robot)` | The outer step; calls timing instrumentation and resource validation |
| `await step._execute_step(robot)` | When wrapping from *inside* a custom step — skips timing and resource re-validation |

Use `_execute_step` when you are implementing a higher-level step that drives a built-in step as an internal implementation detail — you don't want the inner step to also emit timing records or validate resources a second time. The Ecer2026 PackingBot uses this pattern in its `EtScanAlign` step:

```python
async def _execute_step(self, robot) -> None:
    scan_step = turn_left(self.scan_degrees, self.speed)
    sample_task = asyncio.create_task(sample_loop())
    try:
        await scan_step._execute_step(robot)   # not run_step — no double instrumentation
    finally:
        sampling = False
        await sample_task
```

### Concurrent Sensor Sampling with `asyncio.create_task()`

Custom steps that need to sample a sensor *while* another step runs use `asyncio.create_task()` to start a background sampling loop, then `await` the inner step, and clean up in a `finally` block. This is the three-phase **scan / analyze / act** pattern:

```python
import asyncio
from raccoon import Step, GenericRobot
from raccoon.step.annotation import dsl_step


@dsl_step(tags=["sensor"])
class EtScanAlign(Step):
    """Turn while sampling a distance sensor, find the object center,
    then rotate to face it."""

    def __init__(self, scan_degrees: float = 90, speed: float = 0.4, threshold: float = 1500):
        super().__init__()
        self.scan_degrees = scan_degrees
        self.speed = speed
        self.threshold = threshold
        self._samples: list[tuple[float, float]] = []

    def _generate_signature(self) -> str:
        return f"EtScanAlign(deg={self.scan_degrees}, spd={self.speed:.1f})"

    async def _execute_step(self, robot: GenericRobot) -> None:
        self._samples = []
        sampling = True

        # Sampling closure — runs concurrently with the turn step
        async def sample_loop():
            while sampling:
                heading = robot.defs.imu.get_heading()
                value = robot.defs.et_sensor.read()
                self._samples.append((heading, value))
                await asyncio.sleep(0.01)

        # Phase 1: Scan — turn while sampling
        scan_step = turn_left(self.scan_degrees, self.speed)
        sample_task = asyncio.create_task(sample_loop())
        try:
            await scan_step._execute_step(robot)   # inner step
        finally:
            sampling = False
            await sample_task   # drain the last sample

        # Phase 2: Analyze — find object center from samples
        target = self._find_center()
        if target is None:
            return

        # Phase 3: Act — turn to face the object
        current = robot.defs.imu.get_heading()
        # ... compute error and turn ...

    def required_resources(self) -> frozenset[str]:
        return frozenset({"drive"})
```

*(Adapted from the Ecer2026 PackingBot's `EtScanAlign`.)*

The key pattern: `asyncio.create_task()` starts the sampling loop concurrently with `_execute_step`; the `finally:` block guarantees the task is stopped and drained even if the inner step raises an exception.

### Example: Wait Until Sensor Threshold

```python
import asyncio
from raccoon import Step, GenericRobot, AnalogSensor
from raccoon.step.annotation import dsl_step


@dsl_step(tags=["sensor", "wait"])
class WaitForAnalogRange(Step):
    """Wait until an analog sensor reads within a specified range."""

    def __init__(self, sensor: AnalogSensor, min_value: float, max_value: float, poll_hz: int = 50) -> None:
        super().__init__()
        self.sensor = sensor
        self.min_value = min_value
        self.max_value = max_value
        self.poll_interval: float = 1.0 / poll_hz

    def _generate_signature(self) -> str:
        return f"WaitForAnalogRange(min={self.min_value}, max={self.max_value}, hz={int(1/self.poll_interval)})"

    async def _execute_step(self, robot: GenericRobot) -> None:
        while True:
            value = self.sensor.read()
            if self.min_value <= value <= self.max_value:
                return
            await asyncio.sleep(self.poll_interval)
```

Because of `@dsl_step`, the code generator produces a `wait_for_analog_range()` factory function. You use it like any built-in step:

```python
# Generated factory function — same parameters as __init__
seq([
    wait_for_analog_range(Defs.light_sensor, min_value=1000, max_value=2000),
    drive_forward(25),
])

# Or use the builder pattern for chaining
wait_for_analog_range(Defs.light_sensor, min_value=1000, max_value=2000).skip_timing()
```

## Custom Motion Steps (100 Hz Loop)

For steps that need a tight control loop, use `MotionStep` as your base. It provides a fixed-rate update loop. The default rate is **100 Hz** — controlled by the class attribute `hz: int = 100`. Override it in your subclass to use a different rate (e.g. `hz = 50` for slower control loops that don't need full 100 Hz precision):

```python
from raccoon import GenericRobot
from raccoon.step.annotation import dsl_step
from raccoon.step.motion.motion_step import MotionStep


@dsl_step(tags=["motion", "custom"])
class DriveUntilBump(MotionStep):
    """Drive forward until the IMU detects a collision."""

    hz = 100  # Update rate in Hz — override to change (e.g. hz = 50)

    def __init__(self, speed: float = 0.3, accel_threshold: float = 0.5) -> None:
        super().__init__()
        self.speed = speed
        self.accel_threshold = accel_threshold

    def _generate_signature(self) -> str:
        return f"DriveUntilBump(speed={self.speed:.2f}, accel_threshold={self.accel_threshold:.2f})"

    def on_start(self, robot: GenericRobot) -> None:
        """Called once before the loop starts."""
        self.drive = robot.drive

    def on_update(self, robot: GenericRobot, dt: float) -> bool:
        """Called every tick (1/hz seconds). Return True when done."""
        self.drive.set_desired_velocity(self.speed, 0, 0)

        accel = abs(robot.defs.imu.get_accel()[0])
        if accel > self.accel_threshold:
            return True   # Done — hit something
        return False       # Keep going

    def on_stop(self, robot: GenericRobot) -> None:
        """Called after the loop ends. Default: hard stop."""
        robot.drive.hard_stop()

    def required_resources(self) -> frozenset[str]:
        return frozenset({"drive"})
```

This generates `drive_until_bump(speed=0.3, accel_threshold=0.5)` with `.speed()` and `.accel_threshold()` builder methods.

The `hz` class attribute controls how often `on_update` is called. The framework targets `1/hz` seconds between calls; `dt` in `on_update` is the actual elapsed time since the previous call (in seconds) so you can use it for integration. Common values:

| `hz` | Interval | When to use |
|------|---------|------------|
| `100` (default) | 10 ms | Tight motion control, fast sensor loops |
| `50` | 20 ms | Slower control loops, vision-based feedback |
| `25` | 40 ms | Very slow processes (e.g., temperature sensors) |

### Real Example: HoldHeading — A MotionStep that Never Finishes

The most instructive real-world `MotionStep` is the Ecer2026 ConeBot's `HoldHeading`, which continuously corrects the robot's heading to maintain a fixed bearing. It is designed to run inside `parallel()` and never finish on its own (it returns `False` from `on_update` always) — the parallel block ends when the sibling step finishes.

```python
import math
from raccoon.foundation import ChassisVelocity
from raccoon.robot.heading_reference import HeadingReferenceService
from raccoon.step.motion.motion_step import MotionStep
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from raccoon.robot.api import GenericRobot


class HoldHeading(MotionStep):
    """Continuously corrects angular velocity to maintain a fixed heading.
    Designed for use inside parallel() — it never finishes on its own."""

    def __init__(self, target_deg: float = 0.0, kp: float = 5.0) -> None:
        super().__init__()
        self._target_deg = target_deg
        self._kp = kp

    def _generate_signature(self) -> str:
        return f"HoldHeading(target={self._target_deg:.1f}, kp={self._kp})"

    def on_start(self, robot: "GenericRobot") -> None:
        # Fetch the built-in heading reference service
        self._service = robot.get_service(HeadingReferenceService)
        # Read the robot's PID config for clamping
        self._max_w = robot.motion_pid_config.angular.max_velocity

    def on_update(self, robot: "GenericRobot", dt: float) -> bool:
        error_deg = self._service.compute_turn(self._target_deg)
        error_rad = math.radians(error_deg)
        w = self._kp * error_rad
        w = max(-self._max_w, min(self._max_w, w))
        robot.drive.set_velocity(ChassisVelocity(0, 0, w))
        robot.drive.update(dt)
        return False   # never finishes — always runs until parallel() cancels it

    def required_resources(self) -> frozenset[str]:
        return frozenset({"drive"})
```

Usage:

```python
parallel(
    hold_heading(target_deg=0, kp=5.0),  # keeps heading at 0° while sibling runs
    seq([
        drive_forward(50),
        turn_left(90),
    ]),
)
```

This example shows five patterns at once:
- Accessing a built-in service via `robot.get_service(HeadingReferenceService)`
- Reading motion config from inside a step: `robot.motion_pid_config.angular.max_velocity`
- Setting drive velocity directly: `robot.drive.set_velocity(ChassisVelocity(vx, vy, wz))`
- Advancing the drive model: `robot.drive.update(dt)` — required every tick when calling `set_velocity` directly
- Returning `False` always — the "never-finish, use in parallel" design

The `TYPE_CHECKING` import guard prevents a circular import: the `HoldHeading` class only needs `GenericRobot` for type annotations, not at runtime.

### Project-Level `@dsl_step` Codegen

Teams can apply raccoon's own `@dsl_step` decorator to project-owned step classes and run `raccoon codegen` to generate the corresponding `*_dsl.py` builder file. Mission code imports from that generated file, exactly as it does for raccoon's built-in steps.

The Ecer2026 ClawBot demonstrates this pattern — `src/steps/line_follow.py` defines a family of custom step classes with `@dsl_step`, and `src/steps/line_follow_dsl.py` next to it is the auto-generated output:

```python
# src/steps/line_follow.py  (hand-written)
from raccoon.step.annotation import dsl_step

@dsl_step(tags=["motion", "line-follow"])
class LateralFollowLineSingle(MotionStep):
    def __init__(self, sensor, speed: float = 1.0, side: LineSide = LineSide.RIGHT, ...):
        ...
```

```python
# src/steps/line_follow_dsl.py  (generated — DO NOT EDIT)
def lateral_follow_line_single(sensor, speed=1.0, side=LineSide.RIGHT, ...) -> ...:
    ...
```

```python
# In mission code — import from the generated file
from src.steps.line_follow_dsl import lateral_follow_line_single

class M040CollectBotguyMission(Mission):
    def sequence(self) -> Sequential:
        return seq([
            lateral_follow_line_single(
                sensor=Defs.front.left,
                speed=-0.6,
                side=LineSide.LEFT,
                kp=0.4,
            ).until(after_cm(30)),
        ])
```

## Resource Declarations

When you create class-based steps, declare what hardware resources they use. This enables the framework to validate parallel blocks — if two steps use the same resource, they can't run in parallel.

Resource format: `"<type>"` or `"<type>:<qualifier>"`

```python
def required_resources(self):
    return frozenset({
        "drive",          # Uses the drive system
        "motor:2",        # Uses motor port 2
        "servo:0",        # Uses servo port 0
        "servo:*",        # Uses ALL servos (wildcard)
    })
```

## Organizing Custom Steps

Keep custom steps in `src/steps/`:

```
src/
├── steps/
│   ├── arm_steps.py           # Arm-related custom steps
│   ├── grabber_steps.py       # Grabber operations
│   └── alignment_steps.py     # Custom alignment routines
└── missions/
    └── m010_mission.py          # Imports from steps/
```

Function-based steps can reference `Defs` directly (they're coupled to your robot's hardware). If you want portable steps that work across robots, accept hardware as parameters:

```python
# Portable: works with any servo
from raccoon import ServoPreset

def grab_with(claw_preset: ServoPreset, arm_preset: ServoPreset) -> Sequential:
    return seq([
        claw_preset.open(),
        arm_preset.down(),
        wait_for_seconds(0.2),
        claw_preset.closed(),
        arm_preset.up(),
    ])

# Usage:
grab_with(Defs.claw, Defs.arm)
```

## Related Pages

- **[Steps DSL]({{< ref "04-steps" >}})** — how `@dsl_step`, `@dsl`, and code generation work
- **[Missions]({{< ref "03-missions" >}})** — using custom steps inside missions with `seq()`, `parallel()`, `background()`
- **[Advanced Topics]({{< ref "11-advanced" >}})** — asyncio threading model, monkey-patching, robot services
