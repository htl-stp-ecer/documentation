# RaccoonOS Documentation Audit Report — 2026-06-18

**Date:** 2026-06-18  
**Previous audit:** 2026-05-28 (`DOCS_AUDIT_REPORT.md`)  
**Auditors:** 16 automated sub-agents + synthesis pass  
**Scope (code):** `toolchain/raccoon_cli/`, `raccoon-lib/`, `stm32-data-reader/`, `botui/`, `toolchain/web-ide/`  
**Scope (docs):** `raccoon-docs/documentation/content/**` (all sections)

---

## Executive Summary

This audit found **66 P0 issues** (code that will crash or fail if users follow the docs exactly), **53 P1/P2 backlog items** (wrong values, missing context, stale names), and **175 uncovered features** across all documentation sections. The highest-impact clusters are:

1. **Package rename drift (`libstp` → `raccoon`) is pervasive and unresolved.** The `dsl_steps.json` catalog and several doc pages still teach `from libstp import *`. Every import example in the API reference is wrong.
2. **`data/dsl_steps.json` must be regenerated.** It was generated from a pre-rename codebase: 70 entries instead of 110, every module path starts with `libstp.`, two published steps (`drive_arc`, `turn_to_heading`) are documented but removed.
3. **The odometry docs document classes that do not exist.** `FusedOdometry`, `Stm32Odometry`, `FusedOdometryConfig`, `Stm32OdometryConfig`, and `turn_to_heading()` all raise `ImportError` or `NameError` if used.
4. **`SetupMission` vs `Mission` class hierarchy.** Docs show `class M00SetupMission(Mission)` but the runtime raises `TypeError` unless `SetupMission` is used. Spread across at least five doc files.
5. **Mission numbering is 3-digit (M000/M010/M999) everywhere in the CLI; docs show 2-digit (M00/M01/M99) throughout.**
6. **Firmware: TRANSFER_VERSION is 21 (docs say 19); all LCM channel names use `raccoon/` prefix (docs use `libstp/`).**
7. **Web IDE Settings Modal docs describe five tabs; the implementation has two.** Robot, Map, and Start settings moved to separate panels.
8. **`raccoon status` is listed as a valid command but is not registered in the CLI.** Use `raccoon doctor`.

---

## P0 — Actively Misleading

Entries are grouped by documentation file. Each entry shows the wrong claim, the reality, and the source-of-truth code path.

---

### 02-programming — Project Structure & Foundations

**File:** `raccoon-docs/documentation/content/02-programming/01-project-structure.md`

| # | Wrong claim | Reality | Source of truth |
|---|-------------|---------|-----------------|
| F-001 | "Missions use a two-digit prefix (`m00`–`m99`)" | CLI uses **three-digit** zero-padded prefix: `m000`, `m010`, `m999`. Regex is `^[Mm](\d{3})`. Reserved numbers are 0 and 999. | `toolchain/raccoon_cli/project_creation.py:29` |
| F-002 | File name examples: `m01_drive_to_cone_mission.py`, setup `m00`, shutdown `m99` | Real: `m000_setup_mission.py`, `m010_first_mission.py`, `m999_shutdown_mission.py`. New missions increment by 10. | `toolchain/raccoon_cli/project_creation.py:29-30,104,108` |
| F-003 | YAML example: `M01SetupMission: setup`, `M99ShutdownMission: shutdown` | CLI generates: `M000SetupMission`, `M010…`, `M999ShutdownMission`. | `toolchain/raccoon_cli/templates/project_scaffold/src/missions/m000_setup_mission.py:6` |
| F-004 | `odometry = FusedOdometry(imu=defs.imu, kinematics=kinematics, ...)` as a class attribute in generated `robot.py` | Codegen emits `@property odometry` calling `Platform.create_odometry(self.kinematics)`. `FusedOdometry` is never imported. | `toolchain/raccoon_cli/codegen/generators/robot_generator.py:134-141` |

**File:** `raccoon-docs/documentation/content/02-programming/02-robot-definition.md`

| # | Wrong claim | Reality | Source of truth |
|---|-------------|---------|-----------------|
| F-005 | `from raccoon import IRSensor, DigitalSensor, AnalogSensor, SensorGroup` | `SensorGroup` is **not** in `raccoon.__init__`. Raises `ImportError`. Correct: `from raccoon.step.motion import SensorGroup`. | `raccoon-lib/python/raccoon/__init__.py` (SensorGroup absent); `raccoon-lib/modules/libstp-motion/python/raccoon/step/motion/__init__.py:143,183` |

**File:** `raccoon-docs/documentation/content/02-programming/00a-first-robot-program.md`

| # | Wrong claim | Reality | Source of truth |
|---|-------------|---------|-----------------|
| F-006 | YAML: `type: ServoPreset` with nested `servo: { port: 0 }` and `positions:` | `ServoPreset` is not a recognised YAML `type:` key. Codegen checks `hw_cfg.get("type") != "Servo"`. Correct YAML: `type: Servo` with `port` and `positions:` at the same level. | `toolchain/raccoon_cli/codegen/generators/defs_generator.py:239` |
| F-007 | `class M00SetupMission(Mission):` — setup mission extends `Mission` | `GenericRobot.__init__` raises `TypeError("Subclass SetupMission instead of Mission for setup missions.")` if setup_mission is not a `SetupMission` instance. | `raccoon-lib/modules/libstp-robot/python/raccoon/robot/api.py:370-374` |

---

### 02-programming — Missions, Steps & Stop Conditions

**File:** `raccoon-docs/documentation/content/02-programming/03-missions.md`

| # | Wrong claim | Reality | Source of truth |
|---|-------------|---------|-----------------|
| F-008 | `class M00SetupMission(Mission):` in "Setup Mission Pattern" | Must extend `SetupMission`. Runtime raises `TypeError`. Scaffold template already uses `SetupMission` correctly. | `raccoon-lib/modules/libstp-robot/python/raccoon/robot/api.py:370-374`; `raccoon-lib/modules/libstp-mission/python/raccoon/mission/api.py:53` |

**File:** `raccoon-docs/documentation/content/02-programming/04-steps.md`

| # | Wrong claim | Reality | Source of truth |
|---|-------------|---------|-----------------|
| F-009 | `.on_anomaly(lambda step, dt: print(f"Slow: {dt}s"))` — callback receives `(step, dt)` | `StepAnomalyCallback` is `Callable[[Step, GenericRobot], Awaitable[Any]]`. Second argument is the robot, not a duration. A lambda using `dt` as a float receives a `GenericRobot` and fails at runtime. | `raccoon-lib/modules/libstp-step/python/raccoon/step/base.py:20`; `raccoon-lib/modules/libstp-step/python/raccoon/step/step_builder.py:41-65` |

---

### 02-programming — Sensors, Drive & Odometry

**File:** `raccoon-docs/documentation/content/02-programming/06-sensors.md`

| # | Wrong claim | Reality | Source of truth |
|---|-------------|---------|-----------------|
| F-010 | `from raccoon import CamSensor` | `CamSensor` is not exported from the top-level `raccoon` package. Correct: `from raccoon.cam import CamSensor`. | `raccoon-lib/python/raccoon/__init__.py`; `raccoon-lib/modules/libstp-cam/python/raccoon/cam.py:40` |

**File:** `raccoon-docs/documentation/content/02-programming/08-odometry.md`

| # | Wrong claim | Reality | Source of truth |
|---|-------------|---------|-----------------|
| F-011 | `from raccoon import FusedOdometry, FusedOdometryConfig` with `FusedOdometryConfig(bemf_trust=1.0)` | Neither class exists anywhere in `raccoon-lib`. Raises `ImportError`. Users never construct odometry objects; the platform injects an `IOdometry` implementation. | `raccoon-lib/python/raccoon/__init__.py` (no entry) |
| F-012 | `from raccoon import Stm32Odometry` with `Stm32Odometry(imu=defs.imu, kinematics=kinematics)` | `Stm32Odometry` does not exist as a Python-importable class. Raises `ImportError`. | `raccoon-lib/python/raccoon/__init__.py` (no entry) |
| F-013 | `turn_to_heading(0)`, `turn_to_heading(-90)`, `turn_to_heading(180)` — a single function auto-selecting direction | `turn_to_heading()` does not exist. Replaced by `turn_to_heading_right(degrees)` and `turn_to_heading_left(degrees)` (both take positive degrees). Calling `turn_to_heading()` raises `NameError`. | `raccoon-lib/modules/libstp-motion/python/raccoon/step/motion/__init__.py:39-40` |
| F-014 | "Good" code example uses `turn_to_heading(0)` (same function) | Same `NameError` at runtime. | Same as F-013 |

---

### 02-programming — Servos, Calibration & Advanced

**File:** `raccoon-docs/documentation/content/02-programming/11-advanced.md`

| # | Wrong claim | Reality | Source of truth |
|---|-------------|---------|-----------------|
| F-015 | `from libstp import RobotService` | `libstp` is a deprecated compat shim emitting `DeprecationWarning`. Correct: `from raccoon.robot import RobotService`. | `raccoon-lib/python/libstp_compat/libstp/__init__.py:23`; `raccoon-lib/modules/libstp-robot/python/raccoon/robot/__init__.py:7` |
| F-016 | `import libstp.foundation as logging` | Same `libstp` shim issue. Correct: `import raccoon.foundation as logging`. | Same as F-015 |

**File:** `raccoon-docs/documentation/content/02-programming/10-calibration.md`

| # | Wrong claim | Reality | Source of truth |
|---|-------------|---------|-----------------|
| F-017 | `characterize_axes=["linear", "angular"]` | Valid axis name is `"forward"`, not `"linear"`. Passing `"linear"` silently fails during execution. Defaults are `["forward", "angular"]` for non-lateral robots. | `raccoon-lib/modules/libstp-motion/python/raccoon/step/motion/auto_tune.py:1111-1112` |

---

### 02-programming — UI Steps & Configuration Reference

**File:** `raccoon-docs/documentation/content/02-programming/12-ui-steps.md`

| # | Wrong claim | Reality | Source of truth |
|---|-------------|---------|-----------------|
| F-018 | `result = await self.show(ConfirmScreen(...))` then `if result.confirmed:` | `ConfirmScreen` is `UIScreen[bool]`; `await self.show(...)` returns a plain `bool`. `result.confirmed` raises `AttributeError`. | `raccoon-lib/modules/libstp-screen/python/raccoon/ui/screens/basic.py:60-115` |
| F-019 | `ConfirmScreen(white_value=..., black_value=...)` then `result.confirmed` | `ConfirmScreen.__init__` takes `(title, message, confirm_label, cancel_label, confirm_style, icon_name, icon_color)`. No `white_value`/`black_value` params. Raises `TypeError`. | `raccoon-lib/modules/libstp-screen/python/raccoon/ui/screens/basic.py:73-90` |

**File:** `raccoon-docs/documentation/content/02-programming/13-configuration-reference.md`

| # | Wrong claim | Reality | Source of truth |
|---|-------------|---------|-----------------|
| F-020 | `odometry:` config block with `FusedOdometry`, `ImuOdometry`, `bemf_trust`, `imu_ready_timeout_ms`, etc. as active keys | The code generator explicitly **ignores** this block with the log message: *"odometry is now platform-managed and no longer codegen-emitted."* No keys have any effect. | `toolchain/raccoon_cli/codegen/generators/robot_generator.py:76-80` |

---

### 02-programming — IMU

**File:** `raccoon-docs/documentation/content/02-programming/14-imu.md`

| # | Wrong claim | Reality | Source of truth |
|---|-------------|---------|-----------------|
| F-021 | `from raccoon import Stm32OdometryConfig` then `config = Stm32OdometryConfig()` | `Stm32OdometryConfig` does not exist. Raises `ImportError`. | `raccoon-lib/python/raccoon/__init__.py:86-158` (full `__all__` list — no such name) |

---

### 02-programming — Competition, Simulator & Algorithms

**File:** `raccoon-docs/documentation/content/02-programming/algorithms/wall-alignment.md`

| # | Wrong claim | Reality | Source of truth |
|---|-------------|---------|-----------------|
| F-022 | `from libstp import *` in usage example | No Python package named `libstp` is exposed to users. Correct: `from raccoon import *`. Raises `ModuleNotFoundError`. | `raccoon-lib/modules/libstp-*/python/raccoon/` (all step files) |

---

### 01-botui

**File:** `raccoon-docs/documentation/content/01-botui/02-programs.md`

| # | Wrong claim | Reality | Source of truth |
|---|-------------|---------|-----------------|
| F-023 | "A program provides **Start** and **Calibrate** buttons. The Calibrate button recalibrates the Wombat and saves calibration settings to a YAML file." | No Calibrate button exists. `ProgramActionScreen` has only a Start button; `ProgramScreen` has Start and Advanced buttons. Calibration is a `--no-calibrate` CLI flag in the Advanced overlay. | `botui/lib/features/program/presentation/screens/program_action_screen.dart:43-50`; `botui/lib/features/program/presentation/screens/program_screen.dart:122-131` |
| F-024 | "Two calibration modes: **Aggressive** and **Standard**" | No such calibration modes exist anywhere in the codebase. | `botui/lib/features/program/presentation/screens/program_screen.dart:232-264` |

---

### 03-web-ide

**File:** `raccoon-docs/documentation/content/03-web-ide/05-settings-modal.md`

| # | Wrong claim | Reality | Source of truth |
|---|-------------|---------|-----------------|
| F-025 | Settings Modal has **five tabs**: Project, Robot, Map, Start, Keybindings | `RobotSettingsModal` has exactly **two tabs**: Project and Keybindings. `type SettingsTab = 'project' \| 'keybindings'`. | `toolchain/web-ide/src/app/robot-settings-modal/robot-settings-modal.ts:25` |
| F-026 | "Robot Tab" (inside Settings Modal) — sensors, rotation center, drivetrain | These fields are in `RobotConfigPanel`, a standalone right-side tool panel, not in the Settings Modal. | `toolchain/web-ide/src/app/project-view/project-view.html:142-154` |
| F-027 | "Map Tab" inside Settings Modal — canvas editor for drawing lines | Map editing is `TableEditorView` in the bottom panel, toggled by a pencil icon (`title="Edit map"`). Not in the Settings Modal. | `toolchain/web-ide/src/app/project-view/project-view.html:199` |
| F-028 | "Start Tab" inside Settings Modal — X, Y, Rotation fields with table canvas click | Start pose editing is in the Table Visualization bottom panel via `startPoseEditMode` flag toggle. Not a tab in the Settings Modal. | `toolchain/web-ide/src/app/project-view/project-view.html:192-215` |
| F-029 | "Project Tab" contains: Orientation, Auto Layout, Step Indexing, **plus** sensors/rotation center/drivetrain | Project tab contains **only** Orientation, Auto Layout, and Step Indexing. Sensor/rotation/drivetrain fields are in `RobotConfigPanel`. | `toolchain/web-ide/src/app/robot-settings-modal/robot-settings-modal.html:49-139` |

**File:** `raccoon-docs/documentation/content/03-web-ide/03-flowchart-editor.md`

| # | Wrong claim | Reality | Source of truth |
|---|-------------|---------|-----------------|
| F-030 | Flowchart toolbar contains: gear icon, undo/redo, timing/table/logs panel toggles, Sim toggle, green Run button, green Device settings button | Actual flowchart toolbar (`flowchart.html:15-45`) contains **only a save-status indicator**. Settings, Undo/Redo, Timestamps → global navbar. Run/Stop/Debug → navbar run-actions. Panel toggles → project-view tool stripe. The Sim toggle is hidden (`showLegacySimulateToggle()` always returns `false`). "Green Device settings" button does not exist. | `toolchain/web-ide/src/app/project-view/flowchart/flowchart.html:13-45`; `flowchart.ts:160-162` |

---

### 04-raccoon-cli

**File:** `raccoon-docs/documentation/content/04-raccoon-cli/_index.md`

| # | Wrong claim | Reality | Source of truth |
|---|-------------|---------|-----------------|
| F-031 | `raccoon status` is listed as a valid command — "Show current connection and project info" | `raccoon status` is **not registered** in the CLI. The command exists in `commands/status.py` but is never imported in `commands/__init__.py` or added via `cli.py`. Use `raccoon doctor`. | `toolchain/raccoon_cli/cli.py:143-162`; `toolchain/raccoon_cli/commands/__init__.py` |

**File:** `raccoon-docs/documentation/content/04-raccoon-cli/04-update.md`

| # | Wrong claim | Reality | Source of truth |
|---|-------------|---------|-----------------|
| F-032 | "The GitHub CLI (`gh`) must be installed and authenticated. Install `gh`; authenticate via `gh auth login`." | `raccoon update` does **not** use the `gh` CLI at all. It uses `httpx` to call the public GitHub REST API directly. No `gh` binary is invoked anywhere. | `toolchain/raccoon_cli/version_checker.py:20-21,100-121` |

**File:** `raccoon-docs/documentation/content/04-raccoon-cli/01-create.md`

| # | Wrong claim | Reality | Source of truth |
|---|-------------|---------|-----------------|
| F-033 | Generated mission file template shows `from libstp import *` | Template uses `from raccoon import *`. `libstp` does not exist as a user-importable package. | `toolchain/raccoon_cli/templates/mission/src/missions/{{mission_snake_case}}_mission.py.jinja:1` |
| F-034 | "Opens PyCharm if available and prints SSH interpreter setup instructions" | No such behavior exists anywhere in `create.py` or `project_creation.py`. | `toolchain/raccoon_cli/commands/create.py`; `toolchain/raccoon_cli/project_creation.py` (no `pycharm` reference) |

**File:** `raccoon-docs/documentation/content/04-raccoon-cli/03-run.md`

| # | Wrong claim | Reality | Source of truth |
|---|-------------|---------|-----------------|
| F-035 | "Codegen — runs on the robot: generates `defs.py`, `defs.pyi`, and `robot.py` from your YAML config" | Codegen runs **locally on the laptop** before sync. Generated files are included in the push sync. The Pi receives pre-generated files; it never runs codegen. | `toolchain/raccoon_cli/commands/run.py:632-638` |

---

### 05-api-reference — `data/dsl_steps.json`

| # | Wrong claim | Reality | Source of truth |
|---|-------------|---------|-----------------|
| F-036 | All 70 entries have module paths starting with `libstp.` (e.g. `libstp.step.motion`) | Package was renamed to `raccoon`. All import paths must use `from raccoon.step.*`. | `raccoon-lib/docs/generate_dsl_catalog.py:83` |
| F-037 | Step `drive_arc(radius_cm, degrees, speed)` exists | `drive_arc` was removed. Replaced by `drive_arc_left` and `drive_arc_right`. Calling `drive_arc()` raises `NameError`. | `raccoon-lib/modules/libstp-motion/python/raccoon/step/motion/arc_dsl.py` |
| F-038 | Step `turn_to_heading(degrees, speed)` auto-selects CW or CCW | `turn_to_heading` was removed. Replaced by `turn_to_heading_left(degrees)` and `turn_to_heading_right(degrees)`. Raises `NameError`. | `raccoon-lib/modules/libstp-motion/python/raccoon/step/motion/heading_reference_dsl.py` |
| F-039 | `mark_heading_reference()` takes no parameters | Now takes `origin_offset_deg: float = 0.0` and `positive_direction: Literal["left", "right"] = "left"`. | `raccoon-lib/modules/libstp-motion/python/raccoon/step/motion/heading_reference_dsl.py:41` |
| F-040–F-050 | Multiple motor step example imports use wrong names: `motor_power` → `set_motor_power`; `motor_velocity` → `set_motor_velocity`; `motor_dps` → `set_motor_dps`; `motor_move_relative` → `move_motor_relative`; `motor_move_to` → `move_motor_to`; all via `from libstp.step.motor import ...` | All these aliases do not exist. Correct package is `raccoon`. | `raccoon-lib/modules/libstp-step/python/raccoon/step/motor/steps_dsl.py` |
| F-051 | Catalog contains 70 steps | Current source registers **110** public `@dsl` steps. 40 steps present in code are completely absent from the catalog. | `raccoon-lib/docs/generate_dsl_catalog.py` |

---

### 06-firmware

**File:** `raccoon-docs/documentation/content/06-firmware/spi-protocol.md`

| # | Wrong claim | Reality | Source of truth |
|---|-------------|---------|-----------------|
| F-052 | `TRANSFER_VERSION 19` | `TRANSFER_VERSION` is **21**. | `stm32-data-reader/shared/spi/pi_buffer.h:16` |
| F-053 | `RxBuffer` layout does not include `chassisVelocity` field | `RxBuffer` now contains `float chassisVelocity[3]` between `motorTarget[4]` and `motorGoalPosition[4]`. Used by `MOT_MODE_CHASSIS`. | `stm32-data-reader/shared/spi/pi_buffer.h:196-200` |

**File:** `raccoon-docs/documentation/content/06-firmware/data-pipeline.md`

| # | Wrong claim | Reality | Source of truth |
|---|-------------|---------|-----------------|
| F-054 | All LCM channels prefixed `libstp/` (e.g. `libstp/gyro/value`, `libstp/motor/N/position`) | All channels are prefixed `raccoon/` (e.g. `raccoon/gyro/value`, `raccoon/motor/0/position`). Any code subscribing to `libstp/` channels receives nothing. | `raccoon-transport/cpp/include/raccoon/Channels.h:37-197` |

**File:** `raccoon-docs/documentation/content/06-firmware/_index.md`

| # | Wrong claim | Reality | Source of truth |
|---|-------------|---------|-----------------|
| F-055 | `STM32 firmware → Firmware-Stp/` | Firmware has been merged into `stm32-data-reader/firmware/`. `Firmware-Stp/` does not exist. | `stm32-data-reader/firmware/CMakeLists.txt` |

**File:** `raccoon-docs/documentation/content/06-firmware/build-flash.md`

| # | Wrong claim | Reality | Source of truth |
|---|-------------|---------|-----------------|
| F-056 | `cd Firmware-Stp; mkdir -p build; cmake ..; make -j$(nproc)` | Correct paths: `stm32-data-reader/firmware/`. Docker build: `cd firmware && bash build.sh`. Native: `cmake -G "Unix Makefiles" -DCMAKE_TOOLCHAIN_FILE=../CMake/GNU-ARM-Toolchain.cmake ..` | `stm32-data-reader/firmware/build.sh`; `stm32-data-reader/CLAUDE.md` |

**File:** `raccoon-docs/documentation/content/06-firmware/motor-control.md`

| # | Wrong claim | Reality | Source of truth |
|---|-------------|---------|-----------------|
| F-057 | BEMF: 8-element buffer, 4 motors scanned in parallel; `bemfRawReadings[0] = adc_dma_bemf_buffer[3] - adc_dma_bemf_buffer[2]` | BEMF is now **round-robin, one motor per cycle**. ADC2 is reconfigured each cycle for 2 channels of `bemfCurrentMotor`. Buffer has 2 elements: `buf[1] - buf[0]`. | `stm32-data-reader/firmware/Firmware/src/Sensors/bemf.c:68-110,148` |

---

## P1 / P2 — Drift Backlog

Grouped by documentation section.

### 02-programming — Foundations

| # | Severity | File | Claim | Reality | Source |
|---|----------|------|-------|---------|--------|
| D-001 | P1 | `01-project-structure.md` | 2-digit mission naming in all YAML examples | Update every `M00`/`M01`/`M99` to `M000`/`M010`/`M999` | `toolchain/raccoon_cli/project_creation.py:29-30` |
| D-002 | P1 | `02-robot-definition.md` | `odometry: type: FusedOdometry` shown as a valid config block | Codegen ignores this block with a warning. Remove the section. | `toolchain/raccoon_cli/codegen/generators/robot_generator.py:77-80` |
| D-003 | P1 | `01-project-structure.md` | `from raccoon import (... FusedOdometry ...) as Imu` in generated `defs.py` sample | Actual generated imports use per-class `ImportSet.render()`. `FusedOdometry` is never imported. `IMU` is imported without alias. | `toolchain/raccoon_cli/codegen/generators/defs_generator.py:55-57` |
| D-004 | P2 | `01-project-structure.md` | Project scaffold shows `service/` directory in layout | Scaffold does not create a `service/` directory. Template dirs: `src/`, `src/missions/`, `src/steps/`, `src/hardware/`. | `toolchain/raccoon_cli/templates/project_scaffold/src/` |
| D-005 | P2 | `01-project-structure.md` | `raccoon create project` "generates the full directory layout" | Actually **clones `raccoon-example` repo** from GitHub and patches `raccoon.project.yml` and `pyproject.toml`. Requires internet + git. | `toolchain/raccoon_cli/project_creation.py:51-71,138-162` |
| D-006 | P2 | `00-overview.md` | Module map lists 19 modules; omits `libstp-arm`, `libstp-autotune`, `libstp-localization`, `libstp-map`, `libstp-sim`, `libstp-testing`, `libstp-threading`, `libstp-transport-core` | All 8 exist in `raccoon-lib/modules/`. | `raccoon-lib/modules/` (directory listing) |
| D-007 | P2 | `02-robot-definition.md` | Shutdown mission described as timer-only | Shutdown also runs unconditionally when all main missions complete normally. Code comment: `# Always run shutdown mission`. | `raccoon-lib/modules/libstp-robot/python/raccoon/robot/api.py:661-665` |

### 02-programming — Missions, Steps & Stop Conditions

| # | Severity | File | Claim | Reality | Source |
|---|----------|------|-------|---------|--------|
| D-008 | P1 | `03-missions.md` | Config file is `raccoon.project.yaml` (`.yaml`) | Correct extension is `.yml`. | `toolchain/raccoon_cli/templates/project_scaffold/raccoon.project.yml.jinja` |
| D-009 | P1 | `03-missions.md` | Shutdown mission comment: "Runs when timer expires" | Always runs — on timer expiry OR when all missions complete normally. | `raccoon-lib/modules/libstp-robot/python/raccoon/robot/api.py:661-667` |
| D-010 | P1 | `03a-synchronizing-robots.md` | `do_until_checkpoint(seconds, task)` — parameter names `seconds` and `task` | Actual parameters are `checkpoint` and `step`. Using `seconds=` or `task=` as keyword arguments raises `TypeError`. | `raccoon-lib/modules/libstp-timing/python/raccoon/step/timing/do_until_checkpoint_dsl.py:42` |
| D-011 | P2 | `04-steps.md` | `.on_anomaly(callback)` — only callback form documented | Also accepts a `Step` instance directly (e.g. `drive_forward(25).on_anomaly(play_sound())`). | `raccoon-lib/modules/libstp-step/python/raccoon/step/step_builder.py:41-65` |
| D-012 | P2 | `04a-stop-conditions.md` | `over_line(sensor)` has no parameters listed | Accepts `black_threshold: float = 0.7` and `white_threshold: float = 0.7`. | `raccoon-lib/modules/libstp-step/python/raccoon/step/condition.py:509-524` |

### 02-programming — Sensors, Drive & Odometry

| # | Severity | File | Claim | Reality | Source |
|---|----------|------|-------|---------|--------|
| D-013 | P1 | `06-sensors.md` | `follow_right_until_black()` described as "Follow line until right sensor sees black" | Stops when the **left** sensor sees black (`on_black(self.left, threshold=1.0)`). Method name is misleading. | `raccoon-lib/modules/libstp-motion/python/raccoon/step/motion/sensor_group.py:204` |
| D-014 | P2 | `08-odometry.md` | `HeadingReferenceService` sequence diagram shows service reading from IMU and executing turns | Service reads from `robot.odometry` (not IMU directly). Service never executes turns — it computes the required angle; `turn_to_heading_right/left()` perform the turn. | `raccoon-lib/modules/libstp-robot/python/raccoon/robot/heading_reference.py:22-40` |
| D-015 | P2 | `07-drive-system.md` | `distance_tolerance_m=0.005`, `angle_tolerance_rad=0.017` shown as example values | These are tuned robot-specific values, not library defaults. Defaults: `distance_tolerance_m=0.01`, `angle_tolerance_rad=0.035`. | `raccoon-lib/modules/libstp-motion/include/motion/motion_config.hpp:68-69` |
| D-016 | P2 | `07-drive-system.md` | `auto_tune()` implies a simple zero-argument function | `auto_tune()` accepts ~20 parameters, requires calibration board for BEMF phase, has `persist=True` by default (modifies `raccoon.project.yml`), and runs multiple phases each requiring user confirmation. | `raccoon-lib/modules/libstp-motion/python/raccoon/step/motion/auto_tune_dsl.py:522-550` |

### 02-programming — Servos, Calibration & Advanced

| # | Severity | File | Claim | Reality | Source |
|---|----------|------|-------|---------|--------|
| D-017 | P1 | `10-calibration.md` | Calibration values are smoothed with EMA before being written to YAML; `ema_alpha` controls convergence | `_update_yaml_calibration()` writes values directly without applying any EMA formula. The `ema_alpha` parameter is stored but never used. Aspirational, not implemented. | `raccoon-lib/modules/libstp-step/python/raccoon/step/calibration/calibrate_distance.py:130-158,251` |
| D-018 | P1 | `11-advanced.md` | Environment variable table for `deploy.sh`: `RPI_DIR` default `/home/pi/python-libs`, `BUILD_TYPE` default `Release` | `install.py` does not read `RPI_DIR`. `BUILD_TYPE` affects `build.sh` for CMake, not the Pi deployment step. The table conflates two different scripts. | `raccoon-lib/deploy.sh:7`; `raccoon-lib/install.py:134-135` |

### 02-programming — UI Steps & Configuration Reference

| # | Severity | File | Claim | Reality | Source |
|---|----------|------|-------|---------|--------|
| D-019 | P1 | `12-ui-steps.md` | `ChoiceScreen` returns `result.choice` — a string | `ChoiceScreen` is `UIScreen[str]`; returns a plain `str | None`. `.choice` attribute does not exist; raises `AttributeError`. | `raccoon-lib/modules/libstp-screen/python/raccoon/ui/screens/basic.py:170-246` |
| D-020 | P1 | `13-configuration-reference.md` | Calibration commands: `raccoon calibrate rpm`, `raccoon calibrate motors`, `raccoon calibrate sensors`, `raccoon calibrate characterize_drive` | Actual subcommands: `raccoon calibrate ticks`, `raccoon calibrate autotune`, `raccoon calibrate servos`, `raccoon calibrate step-response`. Listed commands do not exist. | `toolchain/raccoon_cli/commands/calibrate.py:947-989` |
| D-021 | P1 | `13-configuration-reference.md` | `MotorCalibration` has `ff.kS`, `ff.kV`, `ff.kA`, `bemf_scale`, `ticks_per_revolution` | C++ `MotorCalibration` struct has `ticks_to_rad`, `vel_lpf_alpha`, `bemf_offset`, `pid` (optional), `static_friction_pct`. No `ff` sub-object or `bemf_scale`. | `raccoon-lib/modules/libstp-foundation/include/foundation/motor.hpp:31-78` |
| D-022 | P1 | `13-configuration-reference.md` | `IRSensor.calibrationFactor: float` documented as a YAML key | `calibrationFactor` does not appear anywhere in the Python or C++ codebase. IR sensor calibrates via `whiteThreshold`/`blackThreshold` stored in `CalibrationStore`. | `raccoon-lib/modules/libstp-sensor-ir/include/IRSensor.hpp:1-69` |
| D-023 | P2 | `13-configuration-reference.md` | `physical.start_pose.theta_deg` default `90.0` | Actual code default is `0.0` when `start_pose` is absent. `90.0` is only a preset value in the scaffold template. | `toolchain/raccoon_cli/ide/sim/runner.py:125` |

### 02-programming — IMU & Motion Flow

| # | Severity | File | Claim | Reality | Source |
|---|----------|------|-------|---------|--------|
| D-024 | P1 | `14-imu.md` | IMU data rate "approximately **75 Hz**" | Hard ceiling of **50 Hz**. `DataPublisher.cpp` uses `kFiftyHzInterval{20}` ms for all IMU channels. | `stm32-data-reader/src/wombat/services/DataPublisher.cpp:26` |
| D-025 | P1 | `14-imu.md` | `imu.read()` gyro units: "in rad/s" | `imu.read()` returns gyro in **degrees/second**. Only `imu.get_angular_velocity()` multiplies by `π/180` and returns rad/s. | `raccoon-lib/modules/libstp-platforms/wombat/imu/src/MPU9250.cpp:30-53` |
| D-026 | P1 | `14-imu.md` | "`after_degrees()` reads the absolute IMU heading directly. Not affected by odometry resets." | Implementation reads from `robot.localization.get_pose().heading` (localization pose, not raw IMU). Raises `RuntimeError` if `robot.localization` is None. | `raccoon-lib/modules/libstp-step/python/raccoon/step/condition.py:369-377` |
| D-027 | P2 | `14-imu.md` | `world_z` applies world-frame correction; `body_z` returns raw body yaw | Both modes execute identically in code: `rate = g[2] * config.sign`. No quaternion rotation is applied for `WorldZ`. | `raccoon-lib/modules/libstp-hal/include/hal/IIMU.hpp:167-170` |

### 02-programming — Competition & Simulator

| # | Severity | File | Claim | Reality | Source |
|---|----------|------|-------|---------|--------|
| D-028 | P1 | `algorithms/line-following.md` | Single-sensor defaults: `kp=1.0, kd=0.3` | Both `FollowLine` and `FollowLineSingle` share the same defaults: `kp=0.4, kd=0.1`. No separate single-sensor gain set exists. | `raccoon-lib/modules/libstp-motion/python/raccoon/step/motion/line_follow.py:481-487` |
| D-029 | P1 | `algorithms/line-following.md` | Quick Start: `Defs.front.follow_right_edge(cm=50)` labelled "Two-sensor" | `follow_right_edge` calls `follow_line_single` with only `self.right` — it is a **single-sensor** call. | `raccoon-lib/modules/libstp-motion/python/raccoon/step/motion/sensor_group.py:179-191` |
| D-030 | P2 | `algorithms/lineup.md` | `forward_speed` documented as a user-accessible parameter | `forward_lineup_on_black` does not expose `forward_speed` — it hard-codes speed 1.0. Only the hidden internal `lineup()` helper exposes it. | `raccoon-lib/modules/libstp-motion/python/raccoon/step/motion/lineup/forward.py:218-219` |
| D-031 | P2 | `15-competition-ready.md` | Mission naming convention shows `M00SetupMission` / `M99ShutdownMission` | Scaffold naming convention is `M000SetupMission` / `M999ShutdownMission`. | `toolchain/raccoon_cli/project_creation.py:30` |
| D-032 | P2 | `16-simulator-testing.md` | Three pytest fixtures documented: `robot`, `scene`, `run_step` | Plugin also exports `project_info` (session-scoped) and `robot_sim_config` (function-scoped) as public fixtures. | `raccoon-lib/modules/libstp-testing/python/raccoon/testing/pytest_plugin.py:176-198` |

### 01-botui

| # | Severity | File | Claim | Reality | Source |
|---|----------|------|-------|---------|--------|
| D-033 | P1 | `_index.md` | Flutter `>= 3.35.0` required | `.fvmrc` pins Flutter `3.32.7`; pubspec SDK constraint is `^3.5.4` (Dart). | `botui/.fvmrc:2`; `botui/pubspec.yaml:7` |
| D-034 | P1 | `_index.md` | `RPI_HOST` default `192.168.4.1` | `install.py` defaults `RPI_HOST` to `192.168.68.110`. | `botui/install.py:9,58` |
| D-035 | P1 | `01-sensors-actors.md` | Graph views include Temperature and Battery as top-level categories | Temperature and Battery are in the `System` category (SystemHealthScreen). `SensorCategory` enum has no `temperature` or `battery` entry. | `botui/lib/features/sensors/domain/entities/sensor_category.dart:1-13` |
| D-036 | P1 | `03-settings.md` | Settings is a flat tile list: Wi-Fi, Power, Calibrate, Rotate, Hide UI, Status | Settings is a **two-tier hierarchy**: main screen shows Network, Camera, Display, System, App Status, Robot tiles. Power is under System; Calibrate/Rotate/Hide UI are under Display. | `botui/lib/features/settings/presentation/pages/settings_screen.dart:19-58` |
| D-037 | P1 | `03-settings.md` | "Rotate: 90°, 180°, 270°, and 360°" | Rotation options are `0°, 90°, 180°, 270°`. No 360° option; `0°` (reset to default) is missing from the list. | `botui/lib/features/settings/presentation/pages/screen_rotation_screen.dart:20-25` |
| D-038 | P1 | `03-settings.md` | "Hide UI hides the current user interface and displays the system logs" | `Hide UI` runs `systemctl stop flutter-ui` — stops the service entirely. Does not display logs. A confirmation dialog is required before stopping. | `botui/lib/features/settings/presentation/pages/display_settings_screen.dart:114-116` |

### 03-web-ide

| # | Severity | File | Claim | Reality | Source |
|---|----------|------|-------|---------|--------|
| D-039 | P1 | `07-running-a-mission.md` | "By default, runs execute in **Sim** mode — toggle **Sim** off to run on the real robot" | Actual model uses an IntelliJ-style run configuration system. No inline "Sim" toggle is visible; `showLegacySimulateToggle()` always returns `false`. | `toolchain/web-ide/src/app/project-view/flowchart/flowchart.ts:160-162`; `run-action-service.ts:23-31` |
| D-040 | P1 | `06-floating-panels.md` | "Three **floating** panels can be moved and repositioned on the canvas" | Panels are **docked tool panels**: Logs/Table/Arm in the bottom panel; Steps/Docs/Robot in the right panel. Only the Timing panel still has a drag offset. | `toolchain/web-ide/src/app/project-view/project-view.html:159-240` |
| D-041 | P1 | `04-step-library.md` | "Requires the device to be online. When offline, shows 'No cached steps yet.'" | Step index is served by the **local IDE backend** (not the Pi). Local project steps are indexed on the laptop and are available offline once indexed. | `toolchain/web-ide/src/app/services/http-service.ts:431-453` |
| D-042 | P1 | `09-advanced-internals.md` | "local backend, typically on port `3000`" | `raccoon web` defaults to port **4200**. `3000` is not found as a default anywhere. | `toolchain/raccoon_cli/commands/web.py:44` |
| D-043 | P2 | `02-mission-panel.md` | "SetupMission is always order -1" | Data model uses boolean flags `is_setup` and `is_shutdown`, not a fixed name or magic order -1. Any mission can be marked as setup/shutdown. | `toolchain/web-ide/src/app/entities/Mission.ts:7-8` |
| D-044 | P2 | `01-interface-overview.md` | "Top bar shows device name, IP address, and a live connection indicator (green/red)" | Navbar shows battery voltage/percent (not IP address) when connected. Polling is every 5 seconds. | `toolchain/web-ide/src/app/navbar/navbar.html:8-19` |
| D-045 | P2 | `05-settings-modal.md` (Map Tab section) | Table default dimensions: "200×100 cm" | Actual constants: `TABLE_WIDTH_CM = 93.08 * 2.54 ≈ 236.42 cm`, `TABLE_HEIGHT_CM = 41.70 * 2.54 ≈ 105.92 cm` (Botball game table in inches). | `toolchain/web-ide/src/app/editor-state/editor-state.ts:29-31` |

### 04-raccoon-cli

| # | Severity | File | Claim | Reality | Source |
|---|----------|------|-------|---------|--------|
| D-046 | P1 | `03-run.md` | "Checkpoint — saves another snapshot after the run" | No post-run checkpoint. Only a `SyncDirection.PULL` sync is performed after execution. | `toolchain/raccoon_cli/commands/run.py:737-742` |
| D-047 | P1 | `02-connect.md` | "Saves connection config to `config/connection.yml`" | Connection is saved to `raccoon.project.yml` (via `save_project_keys`) and `~/.raccoon/config.yml`. No `config/connection.yml` exists. | `toolchain/raccoon_cli/commands/connect.py:91-98`; `toolchain/raccoon_cli/client/connection.py:333-346` |
| D-048 | P1 | `06-connect-disconnect.md` | Defaults table: `--port PORT_NUMBER` default = `pi`; `--user USERNAME` default = `8421` | Defaults are **swapped**: `--port` default = `8421` (int); `--user` default = `pi` (string). | `toolchain/raccoon_cli/commands/connect.py:21-22` |
| D-049 | P1 | `01-create.md` | Step 2: "Renders the project scaffold templates into the directory" | `scaffold_project()` clones `https://github.com/htl-stp-ecer/raccoon-example` via `git clone --depth 1` and patches in-place. Local templates are not used. | `toolchain/raccoon_cli/project_creation.py:51-68,138-162` |
| D-050 | P1 | `_index.md` | Command table lists only 15 commands | 7 fully-implemented commands are missing: `raccoon checkpoint`, `raccoon reorder`, `raccoon lcm`, `raccoon migrate`, `raccoon validate`, `raccoon shell`, `raccoon doctor`. | `toolchain/raccoon_cli/cli.py:143-162` |
| D-051 | P1 | `07-versioning-and-upgrades.md`; `08-troubleshooting-and-recovery.md` | Both pages direct users to run `raccoon status` | `raccoon status` is not registered. Use `raccoon doctor`. | `toolchain/raccoon_cli/cli.py:143-162` |
| D-052 | P2 | `03-run.md` | Sync described only as rsync | On Windows, SFTP (Paramiko) is used. Backend selected at runtime: `RsyncSync` on Linux/macOS, `SftpSync` on Windows or when rsync is unavailable. | `toolchain/raccoon_cli/client/sftp_sync.py:507-518` |

### 06-firmware (additional P1/P2)

| # | Severity | File | Claim | Reality | Source |
|---|----------|------|-------|---------|--------|
| D-053 | P1 | `build-flash.md` | `PID_DEFAULT_I = 0.045f` | kI changed to **9.0** (dt-explicit per-second units). `9.0 = 0.045 × 200 Hz`. Using 0.045 in per-second units gives 200× too-small integral action. | `stm32-data-reader/firmware/Firmware/src/Actors/pid.c:8-10` |
| D-054 | P1 | `build-flash.md` | Default position PID: `kP=0.01, kI=0.0, kD=0.015` | Current defaults: `kP=1.0, kI=0.0, kD=0.0`. Derivative term removed. | `stm32-data-reader/firmware/Firmware/src/Actors/pid.c:19-22` |
| D-055 | P1 | `robot-services-and-systemd.md` | `raccoon-cam.service` documented as a shipped USB camera service | No such file exists anywhere in the repo. | `find stm32-data-reader raccoon-cam -name raccoon-cam.service` → no results |
| D-056 | P1 | `robot-services-and-systemd.md` | PrivateTmp rationale: "iceoryx2 service discovery uses `/tmp/iceoryx2/`" | Current service file comment (2026-06-02) says reason is `raccoon_ring` SHM files at `/dev/shm/raccoon_ring_*`. iceoryx2 was replaced. | `stm32-data-reader/systemd/stm32_data_reader.service:12-38` |
| D-057 | P1 | `spi-protocol.md` | Motor control modes table: 5 modes (OFF, PASSIVE_BRAKE, PWM, MAV, MTP) | A 6th mode: `MOT_MODE_CHASSIS (0b101)` — allows Pi to send body-frame chassis velocity; STM32 runs per-wheel MAV PID on-MCU. | `stm32-data-reader/shared/spi/pi_buffer.h:43-45` |
| D-058 | P1 | `spi-protocol.md` | `KinematicsConfig` layout table | Also includes `float bemf_offset[4]` field (per-motor BEMF zero-offset for drift correction) — part of live wire protocol. | `stm32-data-reader/shared/spi/pi_buffer.h:117-120` |
| D-059 | P1 | `motor-control.md` | MTP: "cascaded position + velocity control... outer loop is a PD controller on position error; inner loop is velocity PID" | MTP now uses a **sqrt deceleration curve** plus trapezoidal acceleration profile. `posPidControllers` is declared but no longer driven in MTP mode. | `stm32-data-reader/firmware/Firmware/src/Actors/motor.c:308-397` |
| D-060 | P1 | `motor-control.md` | Position reset is Pi-side via software offsets `positionOffsets_[port]` | Position reset is now **on-STM32** via `motorPositionReset` bitmask in `RxBuffer`. No `positionOffsets_` in `SpiReal`. | `stm32-data-reader/src/wombat/hardware/Spi.cpp:524-531` |
| D-061 | P1 | `data-pipeline.md` | Transport is "LCM UDP multicast" | Primary IPC is **`raccoon_ring` SHM** (`/dev/shm/raccoon_ring_*`). UDP multicast still used for loopback setup but SHM is the primary channel. | `stm32-data-reader/systemd/stm32_data_reader.service:12-38` |
| D-062 | P2 | `motor-control.md` | BEMF dead zone: "absolute value ≤ 8 are not accumulated" | Dead zone is now **±25 counts** post-offset-subtraction. `BEMF_DEADZONE 25.0f`. | `stm32-data-reader/firmware/Firmware/src/Sensors/bemf.c:33,166-167` |
| D-063 | P2 | `motor-control.md` | BEMF filter: "first-order IIR with α=0.2" | Now **two-stage**: median-of-3 pre-filter followed by IIR with α=0.2. | `stm32-data-reader/firmware/Firmware/src/Sensors/bemf.c:17-18,44-45,151-155` |
| D-064 | P2 | `motor-control.md` | `MTP_DONE_THRESHOLD = 50` ticks | `MTP_DONE_THRESHOLD` is **40** ticks. | `stm32-data-reader/firmware/Firmware/src/Actors/motor.c:17` |

### 05-api-reference — Quick Start

| # | Severity | File | Claim | Reality | Source |
|---|----------|------|-------|---------|--------|
| D-065 | P1 | `00-quick-start/_index.md` | "Runs code generation on the robot (`defs.py`, `robot.py`)" — Step 8 item 3 | Codegen runs **locally on the laptop** before sync. | `toolchain/raccoon_cli/commands/run.py:631` |
| D-066 | P1 | `00-quick-start/_index.md` | "Saves another checkpoint and pulls any updated files back" — Step 8 item 5 | No second checkpoint. Only a `SyncDirection.PULL` sync. | `toolchain/raccoon_cli/commands/run.py:737-742` |

---

## Uncovered Features — Docs to Write

Sorted by importance within each area. Source-of-truth pointers included.

### Area A: raccoon Python API (raccoon-lib)

| Priority | Feature | Source of Truth | Suggested Doc Location |
|----------|---------|----------------|------------------------|
| HIGH | `smooth_path()` / `SplinePath` (Catmull-Rom) — multi-segment path planner | `raccoon-lib/modules/libstp-motion/python/raccoon/step/motion/smooth_path.py`; `spline_path.py` | New `02-programming/21-smooth-path.md` |
| HIGH | `drive_arc_left()`, `drive_arc_right()`, `strafe_arc_left()`, `strafe_arc_right()`, `drive_arc_segment()` | `raccoon-lib/modules/libstp-motion/python/raccoon/step/motion/arc_dsl.py` | `02-programming/07-drive-system.md` new section |
| HIGH | `timeout()`, `timeout_or()` — wrap any step with a hard time limit | `raccoon-lib/modules/libstp-step/python/raccoon/step/timeout_dsl.py`; `timeout_or.py` | `02-programming/04-steps.md` control flow section |
| HIGH | `start_watchdog()`, `feed_watchdog()`, `stop_watchdog()` + `WatchdogManager` | `raccoon-lib/modules/libstp-step/python/raccoon/step/watchdog.py`; `watchdog_manager.py` | `02-programming/04-steps.md` or new `11a-watchdogs.md` |
| HIGH | `run_if_env()`, `run_unless_no_calibrate()`, `run_unless_no_checkpoints()`, `run_if_debug()`, `run_if_dev()` | `raccoon-lib/modules/libstp-step/python/raccoon/step/logic/run_if_env.py` | `02-programming/04-steps.md` or `11-advanced.md` |
| HIGH | `background()` / `wait_for_background()` — fire-and-forget async execution | `raccoon-lib/modules/libstp-step/python/raccoon/step/logic/background.py` | `02-programming/03-missions.md` control flow section |
| HIGH | Localization resync steps: `resync_at_start_pose()`, `find_line_resync()`, `align_to_wall_resync()` | `raccoon-lib/modules/libstp-motion/python/raccoon/step/motion/resync.py` | New `02-programming/22-localization-resync.md` |
| HIGH | `Localization` / `LocalizationConfig` Python API (7 tuneable parameters) | `raccoon-lib/modules/libstp-localization/include/localization/localization.hpp:47-57` | New `02-programming/22-localization-resync.md` |
| HIGH | `SetupMission` base class — `setup_time`, `pre_start_gate()` override, `setup_timer_context()` | `raccoon-lib/modules/libstp-mission/python/raccoon/mission/api.py:53-137` | `02-programming/03-missions.md` new "Setup Mission" section |
| HIGH | `drive_to_analog_target()` / `DriveToAnalogTarget` + `calibrate_analog_sensor()` | `raccoon-lib/modules/libstp-motion/python/raccoon/step/motion/drive_to_analog_target.py`; `raccoon-lib/modules/libstp-step/python/raccoon/step/calibration/calibrate_analog_sensor.py` | `02-programming/06-sensors.md` or `10-calibration.md` |
| HIGH | `CamSensor` full API — `isDetected()`, `getBlobX/Y/Width/Height/Area()`, `getConfidence()`, `getDetectedLabels()` | `raccoon-lib/modules/libstp-cam/include/CamSensor.hpp` | `02-programming/06-sensors.md` camera section |
| HIGH | `set_odometry_source()` / `OdometrySource` enum + `OdometrySource` switch API | `raccoon-lib/modules/libstp-motion/python/raccoon/step/motion/set_odometry_source.py`; `raccoon-lib/modules/libstp-hal/bindings/odometry.cpp:17-60` | `02-programming/08-odometry.md` |
| HIGH | `raccoon.testing.sim` full API — `SimRobotConfig`, `LineSensorMount`, `DistanceSensorMount`, `configure()`, `detach()`, `pose()`, `tick()`, `yaw_rate()` | `raccoon-lib/modules/libstp-testing/python/raccoon/testing/sim.py` | `02-programming/16-simulator-testing.md` |
| HIGH | Motor DSL steps catalogue: `motor_move_to()`, `motor_move_relative()`, `motor_dps()`, `set_motor_power()`, `set_motor_velocity()`, `set_motor_dps()`, `StopMode` enum | `raccoon-lib/modules/libstp-step/python/raccoon/step/motor/steps_dsl.py` | New `02-programming/09a-motor-steps.md` |
| HIGH | Individual `auto_tune_*` phase steps (`auto_tune_vel_lpf()`, `auto_tune_static_friction()`, etc.) | `raccoon-lib/modules/libstp-motion/python/raccoon/step/motion/auto_tune_dsl.py` | `02-programming/10-calibration.md` |
| HIGH | `calibrate_wait_for_light()` — interactive calibration for start-lamp sensor | `raccoon-lib/modules/libstp-step/python/raccoon/step/calibration/calibrate_wfl.py` | `02-programming/10-calibration.md` |
| HIGH | `--no-calibrate` flag / `is_no_calibrate()` — runtime flag that skips all calibration steps | `raccoon-lib/python/raccoon/no_calibrate.py` | `02-programming/10-calibration.md` |
| HIGH | Odometry architecture (platform-managed, not user-constructed) — replace entire `08-odometry.md` "Odometry Types" section | `raccoon-lib/modules/libstp-platforms/wombat/odometry/src/WombatOdometry.cpp`; `raccoon-lib/modules/libstp-hal/bindings/odometry.cpp` | `02-programming/08-odometry.md` |
| HIGH | `if_then(condition, then_step, else_step)` conditional branching | `raccoon-lib/modules/libstp-step/python/raccoon/step/logic/if_then_dsl.py` | `02-programming/04-steps.md` |
| HIGH | `robot.localization` auto-wiring contract — `LocalizationNotWiredError`, how to disable | `raccoon-lib/modules/libstp-robot/python/raccoon/robot/api.py:137-228` | `02-programming/02-robot-definition.md` |
| MED | `Mission.time_budget` per-mission watchdog in seconds | `raccoon-lib/modules/libstp-mission/python/raccoon/mission/api.py:27-30` | `02-programming/03-missions.md` |
| MED | `SensorGroup` additional methods: `lineup_on_white()`, `backward_lineup_on_black()`, `drive_until_white()`, etc. | `raccoon-lib/modules/libstp-motion/python/raccoon/step/motion/sensor_group.py:96-176` | `02-programming/06-sensors.md` |
| MED | `SensorGroup` constructor parameters: `threshold`, `speed`, `follow_speed`, `follow_kp`, `follow_ki`, `follow_kd` | `raccoon-lib/modules/libstp-motion/python/raccoon/step/motion/sensor_group.py:60-79` | `02-programming/06-sensors.md` |
| MED | `mark_heading_reference()` parameters: `origin_offset_deg` and `positive_direction` | `raccoon-lib/modules/libstp-motion/python/raccoon/step/motion/heading_reference_dsl.py:39-88` | `02-programming/08-odometry.md` |
| MED | `turn_to_heading_left()` and `turn_to_heading_right()` — replace removed `turn_to_heading()` | `raccoon-lib/modules/libstp-motion/python/raccoon/step/motion/heading_reference.py:179-236` | `02-programming/08-odometry.md` |
| MED | `imu.get_integrated_velocity()` / `imu.reset_integrated_velocity()` | `raccoon-lib/modules/libstp-hal/bindings/imu.cpp:56-63` | `02-programming/14-imu.md` |
| MED | `LateralFollowLine` / `LateralFollowLineSingle` (strafe-primary line following) | `raccoon-lib/modules/libstp-motion/python/raccoon/step/motion/line_follow.py:1117-1274` | `02-programming/algorithms/line-following.md` |
| MED | `set_speed_mode()` — toggle BEMF closed-loop vs open-loop per axis | `raccoon-lib/modules/libstp-motion/python/raccoon/step/motion/set_speed_mode.py` | `02-programming/07-drive-system.md` |
| MED | `after_forward_cm()` / `after_lateral_cm()` stop conditions | `raccoon-lib/modules/libstp-step/python/raccoon/step/condition.py:300-347` | `02-programming/04a-stop-conditions.md` |
| MED | `setup_timer` steps: `pause_setup_timer()`, `start_setup_timer()`, `resume_setup_timer()` | `raccoon-lib/modules/libstp-step/python/raccoon/step/setup_timer_dsl.py` | `02-programming/03-missions.md` |
| MED | `ChassisControlContext` bypass — Pi-side velocity PIDs are no-ops on real hardware | `raccoon-lib/modules/libstp-drive/src/drive.cpp:49-53` | `02-programming/19-motion-flow-and-kinematics.md` |
| MED | ArmPreset / ArmChain in YAML codegen — `type: ArmChain` | `raccoon-lib/modules/libstp-arm/python/raccoon/step/arm/__init__.py`; `toolchain/raccoon_cli/codegen/generators/arm_chain_generator.py` | `02-programming/02-robot-definition.md` or `20-arm-kinematics-and-codegen.md` |
| MED | `calibrate_sensors()` parameters: `calibration_time`, `allow_use_existing`, `calibration_sets` | `raccoon-lib/modules/libstp-step/python/raccoon/step/calibration/sensors/step_dsl.py:46-88` | `02-programming/10-calibration.md` |
| MED | `arm.to(x, y, z)` raises `NotImplementedError` at runtime | `raccoon-lib/modules/libstp-arm/python/raccoon/step/arm/preset.py` | `02-programming/20-arm-kinematics-and-codegen.md` |
| MED | `Platform.probe()` hardware health-check before missions; `LIBSTP_SKIP_PROBE=1` bypasses | `raccoon-lib/modules/libstp-robot/python/raccoon/robot/api.py:546-576` | `02-programming/02-robot-definition.md` |

### Area B: raccoon CLI (04-raccoon-cli)

| Priority | Feature | Source of Truth | Suggested Doc Location |
|----------|---------|----------------|------------------------|
| HIGH | `raccoon wizard` — full 7-step interactive walkthrough | `toolchain/raccoon_cli/commands/wizard.py:498` | New `04-raccoon-cli/wizard.md` |
| HIGH | `raccoon doctor` — system health check (SSH, git, tools, connection, package versions) | `toolchain/raccoon_cli/commands/doctor.py:295` | New `04-raccoon-cli/doctor.md` or section in `08-troubleshooting-and-recovery.md` |
| HIGH | `raccoon validate` + auto-validation behavior (pre-command, `--no-validate` bypass) | `toolchain/raccoon_cli/commands/validate.py`; `toolchain/raccoon_cli/cli.py:115-130` | New `04-raccoon-cli/validate.md` |
| HIGH | `raccoon checkpoint` group — list, show, restore, delete, clean (5 subcommands) | `toolchain/raccoon_cli/commands/checkpoint.py` | New `04-raccoon-cli/checkpoint.md` |
| HIGH | Run configurations (`run_configurations:` key, 3 builtins, all config fields) — CLI and Web-IDE integration | `toolchain/raccoon_cli/run_configurations.py:32`; `toolchain/web-ide/src/app/run-configurations-dialog/run-configurations-dialog.ts` | New `04-raccoon-cli/run-configurations.md` |
| HIGH | `raccoon migrate` — format_version lifecycle, `--target`, `--dry-run`, numbered scripts | `toolchain/raccoon_cli/commands/migrate.py:66-125` | Expand `04-raccoon-cli/07-versioning-and-upgrades.md` |
| HIGH | `raccoon-server` Pi daemon — `raccoon-server start`, `sudo raccoon-server install`, `server.yml` config | `toolchain/raccoon_cli/server/cli.py` | New `04-raccoon-cli/raccoon-server.md` |
| HIGH | `raccoon create project` clones GitHub (`htl-stp-ecer/raccoon-example`), not local templates; requires internet + git | `toolchain/raccoon_cli/project_creation.py:27,138-162` | `04-raccoon-cli/01-create.md` (fix step 2) |
| HIGH | `raccoon connect` saves to `raccoon.project.yml` + `~/.raccoon/config.yml`; no `config/connection.yml` | `toolchain/raccoon_cli/client/connection.py:333-346,364-396` | `04-raccoon-cli/02-connect.md` |
| MED | `raccoon reorder missions` — interactive TUI + non-interactive by-index; auto-renumbers to M010/M020 | `toolchain/raccoon_cli/commands/reorder_cmd.py` | Section in `04-raccoon-cli/01-create.md` or new page |
| MED | `raccoon lcm` — spy, record, playback, list, delete, status (6 subcommands) | `toolchain/raccoon_cli/commands/lcm.py` | New `04-raccoon-cli/lcm.md` |
| MED | `raccoon run --no-mN` flags — skip missions at specific order indices | `toolchain/raccoon_cli/commands/run.py:36,65-78` | `04-raccoon-cli/03-run.md` |
| MED | `raccoon run --record-localization` / `--record-hz` + localization replay workflow | `toolchain/raccoon_cli/run_recording.py:16` | New `03-web-ide/localization-replay.md`; `04-raccoon-cli/03-run.md` |
| MED | `raccoon shell` — opens interactive SSH session to Pi | `toolchain/raccoon_cli/commands/shell.py:43-57` | Section in `04-raccoon-cli/06-connect-disconnect.md` |
| MED | `raccoon completion` — bash/zsh/fish/PowerShell tab-completion install | `toolchain/raccoon_cli/commands/completion.py:265` | New section in quick-start |
| MED | SSH key auto-setup during `raccoon connect` — Ed25519 key generation, upload, verification | `toolchain/raccoon_cli/client/ssh_keys.py:184` | `04-raccoon-cli/02-connect.md` |
| MED | `raccoon calibrate step-response` — motor BEMF recording + matplotlib PNG plot | `toolchain/raccoon_cli/commands/calibrate.py:972` | Section in calibration page |

### Area C: Web IDE (03-web-ide)

| Priority | Feature | Source of Truth | Suggested Doc Location |
|----------|---------|----------------|------------------------|
| HIGH | Python Code Editor view — CodeMirror 6 center panel mode | `toolchain/web-ide/src/app/project-view/code-view/code-view.ts` | New `03-web-ide/10-code-editor.md` |
| HIGH | Run Configurations dialog (IntelliJ-style run targets in navbar dropdown) | `toolchain/web-ide/src/app/run-configurations-dialog/run-configurations-dialog.ts` | New `03-web-ide/07-run-configurations.md` |
| HIGH | Debug mode — bug-icon button, breakpoint support, `debugState: 'idle' \| 'running' \| 'paused'` | `toolchain/web-ide/src/app/navbar/navbar.html:126-148`; `flowchart-run-manager.ts:590-689` | Addition to `03-web-ide/07-running-a-mission.md` |
| HIGH | Localization Recording and Replay — `localization.jsonl` playback, particle visualization | `toolchain/web-ide/src/app/project-view/flowchart/table/replay/localization-replay.service.ts` | New `03-web-ide/localization-replay.md` |
| HIGH | Table Map v2 format with layers, transitions, `activeLayerId`; v1 auto-migration | `toolchain/web-ide/src/app/services/http-service.ts:56-125` | `03-web-ide/09-advanced-internals.md` or map page |
| HIGH | `RobotConfigPanel` right-side tool panel — sensors, rotation center, drivetrain (replaces missing "Robot Tab") | `toolchain/web-ide/src/app/project-view/robot-config-panel/robot-config-panel.ts:72` | New section in `03-web-ide/05-settings-modal.md` or standalone page |
| HIGH | Path planning A*/Catmull-Rom spline modes with `headingMode` option in Table Visualization | `toolchain/web-ide/src/app/project-view/flowchart/table/planning/planning-mode.service.ts:40` | `03-web-ide/06-floating-panels.md` |
| MED | Arm Visualizer Panel (THREE.js 3D arm rendering, FK/IK) — bottom tool strip | `toolchain/web-ide/src/app/project-view/arm-panel/arm-panel.ts` | New `03-web-ide/arm-panel.md` or addition to `06-floating-panels.md` |
| MED | Multi-project collision comparison tool on Projects List | `toolchain/web-ide/src/app/local-projects/project-collision-compare/project-collision-compare.ts` | `03-web-ide/08-projects-list.md` |
| MED | Step Docs Panel — shows docstrings for selected step in right tool area | `toolchain/web-ide/src/app/project-view/step-docs-panel/step-docs-panel.ts` | `03-web-ide/04-step-library.md` |
| MED | Run auto-opens Logs panel; run targets whole project in non-debug mode | `toolchain/web-ide/src/app/project-view/project-view.ts:120-124` | `03-web-ide/07-running-a-mission.md` |
| MED | Fast vs Real simulation modes — distinction affects table visualization | `toolchain/web-ide/src/app/project-view/flowchart/flowchart-run-manager.ts:624-631` | `03-web-ide/07-running-a-mission.md` |

### Area D: BotUI (01-botui)

| Priority | Feature | Source of Truth | Suggested Doc Location |
|----------|---------|----------------|------------------------|
| HIGH | Two-tier Settings hierarchy — full screen/tile map | `botui/lib/features/settings/presentation/pages/settings_screen.dart:19-58` | `01-botui/03-settings.md` complete rewrite |
| HIGH | App Status screen — component version display | `botui/lib/features/settings/presentation/pages/app_status_screen.dart` | `01-botui/03-settings.md` new section |
| HIGH | Advanced program launch options — `--dev` and `--no-calibrate` flags via "Advanced" overlay | `botui/lib/features/program/presentation/screens/program_screen.dart:122-317` | `01-botui/02-programs.md` |
| HIGH | `raccoon.project.yml` as primary project descriptor (takes priority over `project.json`) | `botui/lib/features/program/data/datasource/program_remote_data_source_impl.dart:48-81` | `01-botui/02-programs.md` |
| HIGH | Calibration Board tile — 10 dedicated sub-screens (BNO IMU, ICM IMU, Optical Flow/PAA, Odometry) | `botui/lib/features/calib_board/presentation/screens/` (10 screens) | New `01-botui/04-calibration-board.md` |
| HIGH | System Health screen — CPU %, RAM, Disk, CPU/IMU temperature, Battery voltage, Uptime | `botui/lib/features/sensors/presentation/screens/system_health_screen.dart` | `01-botui/01-sensors-actors.md` |
| HIGH | Motor shutdown guard — warning dialog blocks control when shutdown flags active | `botui/lib/features/sensors/presentation/screens/sensor_category_screen.dart:63-88` | `01-botui/01-sensors-actors.md` |
| HIGH | FVM (Flutter Version Management) as expected Flutter toolchain | `botui/build.sh:6-13`; `botui/.fvmrc` | `01-botui/_index.md` |
| MED | Program sync state — version chip ("v3", "NOT SYNCED") from `.raccoon/sync_state.json` | `botui/lib/features/program/domain/entities/sync_state.dart` | `01-botui/02-programs.md` |
| MED | Quaternion/Orientation 3D visualization screen (not a simple graph) | `botui/lib/features/sensors/presentation/screens/quaternion_screen.dart` | `01-botui/01-sensors-actors.md` |
| MED | Motor control: radial slider with Power/Velocity/Position modes; BRAKE/HOLD/OFF buttons; Reset Position | `botui/lib/features/sensors/presentation/screens/sensor_motor_screen.dart:252-310,315-435` | `01-botui/01-sensors-actors.md` |
| MED | `raccoon-transport` `.so` bridge build — `libraccoon_ring_bridge.so` cross-compiled by `build.sh` | `botui/build.sh:29-46` | `01-botui/_index.md` |

### Area E: Firmware (06-firmware)

| Priority | Feature | Source of Truth | Suggested Doc Location |
|----------|---------|----------------|------------------------|
| HIGH | `MOT_MODE_CHASSIS (0b101)` — complete on-MCU closed-loop chassis velocity mode | `stm32-data-reader/shared/spi/pi_buffer.h:43-45`; `motor.c:296-306` | `06-firmware/spi-protocol.md` motor modes table; `06-firmware/motor-control.md` |
| HIGH | BEMF round-robin architecture (one motor per 1250 µs cycle, ADC2 dynamically reconfigured) | `stm32-data-reader/firmware/Firmware/src/Sensors/bemf.h:10`; `bemf.c:69-110` | `06-firmware/motor-control.md` |
| HIGH | MotorWatchdog safety service — kills all motors/servos if heartbeat not received within 500 ms | `stm32-data-reader/src/wombat/services/MotorWatchdog.cpp` | `06-firmware/robot-services-and-systemd.md` |
| HIGH | `disableBemfOnStartup` configuration key — speed mode at boot | `stm32-data-reader/include/wombat/core/Configuration.h:44-46` | `06-firmware/spi-protocol.md` under Feature Flags |
| HIGH | `bemf_offset[4]` in `KinematicsConfig` — per-motor BEMF zero-offset for drift correction | `stm32-data-reader/shared/spi/pi_buffer.h:114-121` | `06-firmware/spi-protocol.md` |
| HIGH | dt-explicit `pid_update()` — takes `float dt` argument; gains in per-second units | `stm32-data-reader/firmware/Firmware/src/Actors/pid.h:24` | `06-firmware/motor-control.md` |
| MED | `chassisVelocity[3]` in `RxBuffer` — live wire protocol for `MOT_MODE_CHASSIS` | `stm32-data-reader/shared/spi/pi_buffer.h:196-200` | `06-firmware/spi-protocol.md` |
| MED | UartMonitor — forwards STM32 UART debug output; UART heartbeat is warn-only | `stm32-data-reader/src/wombat/services/UartMonitor.cpp` | `06-firmware/robot-services-and-systemd.md` |
| MED | Flash-based IMU calibration storage — `PI_BUFFER_UPDATE_SAVE_IMU_CAL` flag | `stm32-data-reader/firmware/Firmware/src/main.c:163-170` | `06-firmware/sensors.md` |
| MED | VDDA compensation via VREFINT (rank 8 ADC channel) — normalizes all ADC readings | `stm32-data-reader/firmware/Firmware/src/Sensors/adcPorts-batteryVoltage.c:11-21,77-85` | `06-firmware/sensors.md` |

---

## Delta vs 2026-05-28 Audit

### Fixed Since Previous Audit (2026-05-28)

| Previous finding | Status |
|-----------------|--------|
| TRANSFER_VERSION docs claimed 15 | **Partially fixed** — docs were updated to 19, but the live code is now 21. Docs are still wrong (F-052). |
| "Document YAML includes write semantics" | **FIXED** — `18-yaml-includes.md` is now accurate with no errors found. |
| Table map / `.ftmap` format undocumented | **Partially fixed** — `17-table-maps.md` now exists and is broadly accurate. v2 format with layers still undocumented. |
| Simulator testing barely documented | **Partially fixed** — `16-simulator-testing.md` exists but acknowledges its own API gaps. `raccoon.testing.sim` API is still uncovered. |

### Still Open From Previous Audit

| Previous finding | Current status |
|-----------------|----------------|
| `libstp` vs `raccoon` rename drift | **STILL OPEN** — `dsl_steps.json` entirely wrong; `libstp` imports in several doc files; `libstp` in wall-alignment usage example. |
| SPI protocol stale | **STILL OPEN** — now worse: version advanced from 19→21; `chassisVelocity`, `bemf_offset`, `MOT_MODE_CHASSIS` still undocumented. |
| UUID collision risk in docs examples | **Not verified in this audit** — out of scope for 2026-06-18 sub-agents. |
| CLI docs missing many commands | **STILL OPEN** — 7 registered commands still have no narrative page; `raccoon status` incorrectly listed. |
| Run configurations undocumented | **STILL OPEN** — no dedicated doc page; only in `99-command-reference.md`. |
| Project-owned services (`services:` in YAML) | **Not covered** — no agent audited this in 2026-06-18. |
| Camera stack has no setup docs | **STILL OPEN** — `raccoon-cam.service` referenced in firmware docs but does not exist in repo (D-055). |
| Systemd deployment underdocumented | **PARTIALLY OPEN** — `robot-services-and-systemd.md` exists but PrivateTmp rationale is stale (D-056); MotorWatchdog undocumented. |
| Localization replay / recording undocumented | **STILL OPEN** — `09-advanced-internals.md` acknowledges the gap; no user page exists. |
| Web IDE internals underdocumented | **STILL OPEN** — Settings Modal restructure is a new P0 (F-025 through F-030). |
| YAML include semantics underexplained | **FIXED** — `18-yaml-includes.md` is now clean. |

### New Issues (Not in 2026-05-28 Audit)

The following are newly discovered since the previous audit:

- **F-018/F-019** — `ConfirmScreen.result.confirmed` pattern raises `AttributeError` (bool return, not object).
- **F-020** — `odometry:` config block in `robot.yml` is silently ignored by codegen.
- **F-021** — `from raccoon import Stm32OdometryConfig` raises `ImportError` (14-imu.md).
- **F-023/F-024** — BotUI Programs page documents a non-existent "Calibrate" button with Aggressive/Standard modes.
- **F-025 through F-030** — Settings Modal docs describe 5 tabs; implementation has 2; Robot/Map/Start moved to separate panels.
- **F-030** — Flowchart toolbar described bears no resemblance to the actual UI after navbar reorganization.
- **F-031** — `raccoon status` listed as a valid command; is not registered.
- **F-057** — `MOT_MODE_CHASSIS` missing from motor control mode table.
- **D-024 through D-027** — IMU docs: 75 Hz (actually 50 Hz), gyro units wrong in `imu.read()`, `after_degrees()` source wrong, `world_z`/`body_z` identical in implementation.
- **D-027** — `imu.calibrate()` is a no-op (entire body commented out in `MPU9250.cpp:118-370`).
- **D-039** — Web IDE "Sim toggle" does not exist; replaced by IntelliJ-style run configurations.
- **D-045** — Table default dimensions documented as 200×100 cm; actual ~236×106 cm (Botball table spec).

---

## Recommended Action Plan

Actions are listed in priority order. A writer can execute them independently.

### Sprint 1 — Stop the Bleeding (P0 Fixes, ~2–3 days)

1. **Regenerate `data/dsl_steps.json`** from current source using `raccoon-lib/docs/generate_dsl_catalog.py`. This single action fixes F-036 through F-051 and restores the API reference. Verify 110 steps are present. Remove `drive_arc` and `turn_to_heading` entries; add `drive_arc_left/right` and `turn_to_heading_left/right`. Source: `raccoon-lib/docs/generate_dsl_catalog.py`.

2. **Fix mission numbering (2-digit → 3-digit) in all doc files.** Global find-replace: `M00` → `M000`, `M01` → `M010`, `M99` → `M999`, `m00` → `m000`, `m01` → `m010`, `m99` → `m999`. Verify regex `^[Mm](\d{3})` in `project_creation.py:29`. Affects: `01-project-structure.md`, `00a-first-robot-program.md`, `03-missions.md`, `15-competition-ready.md`, and the quick-start.

3. **Fix `SetupMission` vs `Mission` in all tutorial code examples.** Search for `class M\d+SetupMission(Mission)` and replace with `(SetupMission)`. Add import `from raccoon import SetupMission`. Affects: `00a-first-robot-program.md`, `03-missions.md`, and the quick-start skeleton.

4. **Replace the entire `08-odometry.md` "Odometry Types" section.** Remove `FusedOdometry`, `Stm32Odometry`, `FusedOdometryConfig`, and `turn_to_heading()`. Explain the platform-managed `IOdometry` architecture. Add `turn_to_heading_right(degrees)` and `turn_to_heading_left(degrees)` examples. Source: `raccoon-lib/modules/libstp-motion/python/raccoon/step/motion/heading_reference_dsl.py`.

5. **Fix the `ConfirmScreen` result type in `12-ui-steps.md`.** Both code examples (lines 100–106 and lines 573–580) use `result.confirmed`; change to use the plain `bool` return. Fix `ChoiceScreen` similarly (`result.choice` → plain `str`). Source: `raccoon-lib/modules/libstp-screen/python/raccoon/ui/screens/basic.py`.

6. **Fix firmware SPI protocol page.** Update `TRANSFER_VERSION` to 21. Add `chassisVelocity[3]` to `RxBuffer` table. Add `MOT_MODE_CHASSIS (0b101)` to the motor modes table. Add `bemf_offset[4]` to `KinematicsConfig`. Source: `stm32-data-reader/shared/spi/pi_buffer.h`.

7. **Fix all LCM channel names in `data-pipeline.md`.** Replace every `libstp/` prefix with `raccoon/` throughout. Source: `raccoon-transport/cpp/include/raccoon/Channels.h:37-197`.

8. **Fix `_index.md` for CLI**: Remove `raccoon status` from command overview table; add it as a note pointing to `raccoon doctor`. Add the 7 missing commands to the table.

9. **Fix `from libstp import *` in `algorithms/wall-alignment.md` and `11-advanced.md`** (both `from libstp import RobotService` and `import libstp.foundation as logging`). Replace with `raccoon` equivalents.

10. **Fix Settings Modal docs in `05-settings-modal.md`** — update to reflect 2-tab structure (Project, Keybindings only). Move Robot/Map/Start content to new sections describing `RobotConfigPanel` and `TableVisualizationPanel`.

### Sprint 2 — High-Value Coverage Gaps (~1 week)

11. **Write `04-raccoon-cli/run-configurations.md`** covering the 3 builtin presets (`default`, `dev`, `simulated`), all config fields, and the Web IDE dialog. Source: `toolchain/raccoon_cli/run_configurations.py:32`.

12. **Write `04-raccoon-cli/doctor.md`** (or section in `08-troubleshooting-and-recovery.md`). Source: `toolchain/raccoon_cli/commands/doctor.py:295`.

13. **Write `04-raccoon-cli/checkpoint.md`** covering all 5 subcommands. Source: `toolchain/raccoon_cli/commands/checkpoint.py`.

14. **Write `03-web-ide/10-code-editor.md`** for the Python code editor view. Source: `toolchain/web-ide/src/app/project-view/code-view/code-view.ts`.

15. **Rewrite `01-botui/03-settings.md`** to reflect the two-tier hierarchy (Display, System, Network, Camera, App Status, Robot). Remove description of non-existent Calibrate button. Fix rotation options (0°/90°/180°/270°). Fix "Hide UI" behavior. Source: `botui/lib/features/settings/presentation/pages/`.

16. **Fix BotUI Programs page** (`01-botui/02-programs.md`): Remove "Calibrate" button and calibration modes entirely; describe the "Advanced" overlay with `--no-calibrate` and `--dev` flags.

17. **Write `02-programming/22-localization-resync.md`** covering `Localization`, `LocalizationConfig`, and the three resync steps (`resync_at_start_pose`, `find_line_resync`, `align_to_wall_resync`). Source: `raccoon-lib/modules/libstp-localization/`; `raccoon-lib/modules/libstp-motion/python/raccoon/step/motion/resync.py`.

18. **Add `SetupMission` dedicated section to `03-missions.md`**: `setup_time`, `pre_start_gate()` override, `setup_timer_context()`, and the `TypeError` runtime enforcement. Source: `raccoon-lib/modules/libstp-mission/python/raccoon/mission/api.py:53-137`.

19. **Fix firmware build instructions** in `build-flash.md`: replace all `Firmware-Stp/` paths with `stm32-data-reader/firmware/`; describe Docker build (`bash build.sh`) and native CMake path. Update PID defaults (kI=9.0, position kP=1.0). Source: `stm32-data-reader/firmware/build.sh`.

20. **Fix the `odometry:` config reference** in `13-configuration-reference.md` — remove the entire `odometry:` section or replace with a note that it is ignored by codegen. Fix calibrate command names (rpm→ticks, motors→autotune, sensors→servos, characterize_drive→step-response). Fix `MotorCalibration` fields.

### Sprint 3 — Structural Coverage Gaps (~2 weeks)

21. Add control flow section to `04-steps.md`: `if_then()`, `background()`/`wait_for_background()`, `timeout()`/`timeout_or()`, `start_watchdog()`/`feed_watchdog()`/`stop_watchdog()`, `run_if_env` family.

22. Add arc motion section to `07-drive-system.md`: `drive_arc_left()`, `drive_arc_right()`, `drive_arc_segment()`, strafe arc variants.

23. Write `02-programming/21-smooth-path.md` for `smooth_path()` and `spline()`.

24. Add motor DSL step catalogue as new page or section: `motor_move_to()`, `motor_move_relative()`, `motor_dps()`, `StopMode` enum.

25. Expand `16-simulator-testing.md` with the `raccoon.testing.sim` API reference: `SimRobotConfig`, `LineSensorMount`, `DistanceSensorMount`, `configure()`, `detach()`, `pose()`, `tick()`, `yaw_rate()`.

26. Write `01-botui/04-calibration-board.md` covering all 10 calibration board screens.

27. Write `03-web-ide/07-run-configurations.md` covering run configuration editing in the Web IDE.

28. Write `03-web-ide/localization-replay.md` covering `--record-localization` workflow and replay panel.

29. Update `06-firmware/motor-control.md` BEMF section: round-robin architecture, dt-explicit PID, new dead-zone threshold, two-stage filter, MotorWatchdog.

30. Add `--no-calibrate` runtime flag to `10-calibration.md`; add `calibrate_wait_for_light()` and `calibrate_analog_sensor()` sections.

---

*Report generated: 2026-06-18. Source agent count: 16. Total findings: 66 P0, 53 P1/P2, 175 uncovered features.*
