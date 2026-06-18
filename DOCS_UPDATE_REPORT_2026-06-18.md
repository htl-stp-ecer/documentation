# RaccoonOS Docs Update — Acceptance Report 2026-06-18

**Date:** 2026-06-18
**Reviewer:** QA/acceptance swarm (automated re-verification)
**Scope:** All changes made by the docs-update swarm on 2026-06-18, re-verified against live source code.

---

## Summary

The swarm delivered a large-scale docs update: `data/dsl_steps.json` was regenerated from scratch, 36 new content pages were created, and a number of existing pages were corrected. Most P0 issues from the audit are resolved. Several 2-digit mission numbering errors and two `M00SetupMission(Mission)` base-class mistakes survive in existing pages and are catalogued below.

---

## What Changed Per Area

### data/dsl_steps.json
Completely regenerated from the live `raccoon` codebase. Now has 110 entries (was 70), all module paths use `raccoon.*` (zero `libstp.*` paths remain). Sample verified: `raccoon.step.calibration.calibrate_dsl`.

### 02-programming — Python API
Existing pages corrected:
- `01-project-structure.md`: odometry architecture updated; `FusedOdometry`/`Stm32Odometry` now described as implementation-internal (not user-imported), with explanatory note.
- `08-odometry.md`: `turn_to_heading()` removal called out prominently; `set_odometry_source()` / `OdometrySource` documented; odometry platform-managed architecture documented.
- `05-api-reference/01-available-steps.md`: deprecation notice for `drive_arc()` and `turn_to_heading()` added.

New pages created (all have valid front matter, `draft: false`, dated 2026-06-18):
- `03a-synchronizing-robots.md` — checkpoint-based multi-robot synchronization
- `04a-stop-conditions.md` — stop-condition API reference
- `09a-motor-steps.md` — full motor DSL steps catalogue
- `12-ui-steps.md` — UIScreen, UIText, wait_for_button, setup timer steps
- `13-configuration-reference.md` — complete YAML configuration reference
- `14-imu.md` — IMU API
- `15-competition-ready.md` — competition readiness checklist
- `16-simulator-testing.md` — `raccoon.testing.sim` full API + pytest fixtures
- `17-table-maps.md` — `.ftmap` runtime/IDE contract and coordinate conventions
- `18-yaml-includes.md` — YAML include system
- `19-motion-flow-and-kinematics.md` — motion flow and kinematics
- `20-arm-kinematics-and-codegen.md` — arm chain codegen
- `21-smooth-path.md` — `smooth_path()` / Catmull-Rom path planner
- `22-localization-resync.md` — `resync_at_start_pose()`, `LocalizationNotWiredError`, auto-wiring
- `algorithms/_index.md` + `ir-calibration.md`, `line-following.md`, `lineup.md`, `wait-for-light.md`, `wall-alignment.md`

### 01-botui
Existing pages corrected/extended:
- `01-sensors-actors.md`: System Health screen documented (CPU, RAM, Disk, temps, battery, uptime); motor shutdown guard dialog documented.
- `02-programs.md`: Advanced launch overlay (`--dev`, `--no-calibrate` flags) documented; `raccoon.project.yml` vs `project.json` priority documented.
- `_index.md`: FVM (Flutter Version Management) toolchain documented, version pinned to 3.32.7 per `botui/.fvmrc`.

New pages:
- `04-calibration-board.md` — 10 sub-screens for BNO IMU, ICM IMU, Optical Flow/PAA, and Odometry calibration.

### 03-web-ide
New pages:
- `10-code-editor.md` — CodeMirror 6 Python code editor
- `11-run-configurations.md` — Run Configurations dialog
- `12-localization-replay.md` — `localization.jsonl` recording and playback
- `13-arm-panel.md` — THREE.js arm visualizer panel
- `09-advanced-internals.md` updated: Table Map v2 format with layers/transitions/`activeLayerId` and v1 auto-migration documented.
- `06-floating-panels.md` updated: A* and Catmull-Rom spline path planning modes documented.
- `07-running-a-mission.md` updated: debug mode (`debugState: idle/running/paused`), fast vs real simulation modes documented.
- `05-settings-modal.md` updated: `RobotConfigPanel` (sensors, rotation center, drivetrain) documented.

### 04-raccoon-cli
New pages:
- `09-sync.md` — raccoon sync
- `10-logs.md` — raccoon logs
- `11-doctor.md` — full raccoon doctor reference; explicitly states `raccoon status` was never registered
- `12-checkpoint.md` — checkpoint group (list/show/restore/delete/clean)
- `13-run-configurations.md` — run_configurations YAML key and 3 built-in targets
- `14-wizard.md` — 7-step wizard walkthrough
- `15-validate.md` — raccoon validate and auto-validation behavior
- `16-raccoon-server.md` — Pi daemon: `raccoon-server start`, `sudo raccoon-server install`, subcommands
- `17-lcm.md` — LCM spy/record/playback
- `18-reorder.md` — raccoon reorder missions
- `19-completion.md` — shell tab-completion install
- `07-versioning-and-upgrades.md` expanded: `raccoon migrate`, `format_version`, `--target`, `--dry-run` documented.
- `01-create.md` corrected: clones from GitHub (`htl-stp-ecer/raccoon-example`), internet required.

### 06-firmware
New pages:
- `motor-control.md` — BEMF round-robin architecture (1250 µs, one motor/cycle, ADC2 dynamic reconfiguration), `MOT_MODE_CHASSIS`, dt-explicit `pid_update()`
- `spi-protocol.md` — full SPI wire protocol, `TRANSFER_VERSION 21`, all motor modes including `MOT_MODE_CHASSIS (0b101)`
- `data-pipeline.md` — LCM channel table with `raccoon/` prefix
- `robot-services-and-systemd.md` — `stm32_data_reader.service`, MotorWatchdog safety service, UartMonitor
- `sensors.md` — firmware-side sensors
- `build-flash.md` — updated to reference `TRANSFER_VERSION` bump procedure
- `architecture.md` — updated

---

## P0 Re-Verification Results

### P0-1: Mission numbering is 3-digit everywhere
**FAIL — partial.**

Source (`project_creation.py:29,104,108`) uses `^[Mm](\d{3})`, generates `M{n:03d}`, reserved 0 and 999.
The scaffold template (`m000_setup_mission.py`) correctly uses `M000SetupMission`.

Docs correctly showing 3-digit: `01-project-structure.md`, `03-missions.md` (setup/most examples), `00a-first-robot-program.md`, `02-robot-definition.md`, `15-competition-ready.md`.

**Stray 2-digit occurrences still present (not fixed by swarm):**

| File | Line | Issue |
|------|------|-------|
| `04-raccoon-cli/01-create.md` | 107-211 | All user-facing examples use `M01`, `M02`, `M03` (should be `M010`, `M020`, `M030`); note at line 198 says `M00` is reserved (should say `M000`) |
| `02-programming/03-missions.md` | 22,43,512,534-536 | `M01DriveToConeMission`, `M02CollectConeMission`, `M03CollectBotguyMission` (2-digit) |
| `02-programming/03-missions.md` | 538 | `M99ShutdownMission` (should be `M999ShutdownMission`) |
| `02-programming/03a-synchronizing-robots.md` | 89,105 | `M01CrossCenterMission`, `M01DropCubeMission` |
| `02-programming/05-custom-steps.md` | 40,275 | `M02CollectMission`, `m01_mission.py` |
| `02-programming/algorithms/wall-alignment.md` | 125 | `M02AlignOnBackWall` |

### P0-2: No `from libstp import` / `import libstp` in code fences
**PASS.** Zero occurrences found. The word `libstp` still appears in prose as a module/simulator label (e.g. "libstp simulator"), which is an internal-naming artifact but not an import instruction.

### P0-3: Setup missions subclass `SetupMission`
**PARTIAL FAIL — two residual errors.**

`03-missions.md` and `02-robot-definition.md` correctly document `SetupMission`. Scaffold template correctly uses `SetupMission`. But two pages show `class M00SetupMission(Mission)` (wrong base class AND wrong number):

| File | Line | Wrong code |
|------|------|-----------|
| `02-programming/09-servos.md` | 344 | `class M00SetupMission(Mission):` |
| `02-programming/10-calibration.md` | 215 | `class M00SetupMission(Mission):` |

### P0-4: Odometry pages no longer reference `FusedOdometry`/`Stm32Odometry`/`turn_to_heading(`
**PASS.**
- `08-odometry.md` line 127: explicit tombstone note that `turn_to_heading()` does not exist; `turn_to_heading_left/right` shown instead.
- `01-project-structure.md` lines 254/262: `FusedOdometry`/`Stm32Odometry` mentioned only inside a note explaining they are no longer user-visible (correct framing).
- `05-api-reference/01-available-steps.md` line 35: deprecation notice with correct replacements.
- No code fence instructs users to import or instantiate these types.

### P0-5: Firmware — `TRANSFER_VERSION` shown as 21; LCM channels use `raccoon/`; `MOT_MODE_CHASSIS` present
**PASS.**
- Source confirms: `stm32-data-reader/shared/spi/pi_buffer.h:16` `#define TRANSFER_VERSION 21`.
- `06-firmware/spi-protocol.md` line 38: `#define TRANSFER_VERSION 21`. Match confirmed.
- `06-firmware/data-pipeline.md` lines 97-123: all channels use `raccoon/` prefix; prose at line 73 explicitly states the old `libstp/` prefix is obsolete.
- `MOT_MODE_CHASSIS` documented in `spi-protocol.md` (lines 161, 176, 215, 250-267) and `motor-control.md` (line 265+).

### P0-6: `raccoon status` not presented as a valid command
**PASS.**
- `04-raccoon-cli/11-doctor.md` lines 164-166: states `raccoon status` was never shipped; `raccoon doctor` is the replacement.
- `07-versioning-and-upgrades.md` line 128: "Note: `raccoon status` is not a registered CLI command."
- `08-troubleshooting-and-recovery.md` line 40: same explicit note.
- CLI source (`cli.py:37`): confirms `doctor` is registered; `status` is absent.

### P0-7: `data/dsl_steps.json` has 110 entries, all `raccoon` module paths
**PASS.**
- Entry count: 110 (verified via Python).
- Non-raccoon entries: 0.
- Sample module path: `raccoon.step.calibration.calibrate_dsl`.

### P0-8: Spot-check 5-8 new pages — front matter and key claims match source
**PASS for all 8 checked.**

| Page | Front matter | Key claim vs source |
|------|-------------|---------------------|
| `02-programming/14-imu.md` | title, author, date 2026-06-18, draft:false | present |
| `02-programming/16-simulator-testing.md` | present; description included | `raccoon.testing.sim` documented; deprecation shim at `raccoon.step.sim` noted |
| `02-programming/21-smooth-path.md` | present | Catmull-Rom smooth path documented |
| `04-raccoon-cli/11-doctor.md` | present | `raccoon doctor` correctly described; `raccoon status` tombstoned |
| `04-raccoon-cli/16-raccoon-server.md` | present | `raccoon-server start`, `sudo raccoon-server install` shown; `server.yml` noted |
| `06-firmware/motor-control.md` | present | BEMF round-robin: 1250 µs interval, one motor per cycle, ADC2 dynamic reconfiguration — matches `bemf.h`/`bemf.c` |
| `06-firmware/spi-protocol.md` | present | `TRANSFER_VERSION 21` matches source; `MOT_MODE_CHASSIS 0b101` present |
| `06-firmware/data-pipeline.md` | present | All `raccoon/` LCM channels match `DataPublisher` description |

---

## HIGH-Priority Uncovered Features — Coverage Status

All 35 HIGH items from the audit Uncovered Features table were checked.

### Now covered (new page or new section)
- `smooth_path()` / `SplinePath` → `21-smooth-path.md`
- `drive_arc_left/right`, `strafe_arc_left/right` → `07-drive-system.md` new sections
- `timeout()`, `timeout_or()` → `03-missions.md` + `04-steps.md` reference
- `start_watchdog()`, `feed_watchdog()`, `stop_watchdog()` → `03-missions.md`
- `run_if_env()` family → `03-missions.md`
- `background()` / `wait_for_background()` → `03-missions.md`
- Localization resync steps → `22-localization-resync.md`
- `LocalizationConfig` / `LocalizationNotWiredError` → `22-localization-resync.md`
- `SetupMission` base class, `setup_time`, `pre_start_gate()` → `03-missions.md`
- `drive_to_analog_target()` / `calibrate_analog_sensor()` → `06-sensors.md` + `10-calibration.md`
- `CamSensor` full API → `06-sensors.md`
- `set_odometry_source()` / `OdometrySource` → `08-odometry.md`
- `raccoon.testing.sim` full API → `16-simulator-testing.md`
- Motor DSL steps catalogue → `09a-motor-steps.md`
- Individual `auto_tune_*` phases → `07-drive-system.md` + `10-calibration.md`
- `if_then()` → `03-missions.md`
- `robot.localization` auto-wiring, `LocalizationNotWiredError` → `22-localization-resync.md`
- `raccoon wizard` → `14-wizard.md`
- `raccoon doctor` → `11-doctor.md`
- `raccoon validate` → `15-validate.md`
- `raccoon checkpoint` group → `12-checkpoint.md`
- Run configurations → `13-run-configurations.md` (CLI) + `11-run-configurations.md` (Web IDE)
- `raccoon migrate` → `07-versioning-and-upgrades.md` expanded
- `raccoon-server` Pi daemon → `16-raccoon-server.md`
- `raccoon create project` from GitHub → `01-create.md` corrected
- Python Code Editor (CodeMirror 6) → `10-code-editor.md`
- Run Configurations dialog → `11-run-configurations.md`
- Debug mode / breakpoints → `07-running-a-mission.md` updated
- Localization Recording and Replay → `12-localization-replay.md`
- Table Map v2 format → `09-advanced-internals.md` updated
- `RobotConfigPanel` → `05-settings-modal.md` updated
- A*/Catmull-Rom path planning → `06-floating-panels.md` updated
- BotUI Advanced launch flags, Settings hierarchy, App Status, `raccoon.project.yml` priority, Calibration Board, System Health, Motor shutdown guard, FVM → all addressed in updated `01-botui/` pages
- `MOT_MODE_CHASSIS` → `spi-protocol.md` + `motor-control.md`
- BEMF round-robin → `motor-control.md`

### Still missing HIGH items (not yet covered)

1. **`raccoon connect` saves to `raccoon.project.yml`, not `config/connection.yml`** — `02-connect.md` line 24 still describes the save path as `config/connection.yml`. Source (`connection.py:334-335`) writes directly to `raccoon.project.yml`. This is a P0-class factual error that survived the update.

2. **`calibrate_wait_for_light()` and `--no-calibrate` / `is_no_calibrate()`** — the audit listed both as HIGH. Neither appears in any current doc page. `10-calibration.md` does not mention `calibrate_wait_for_light()` or the `--no-calibrate` runtime flag from `raccoon/no_calibrate.py`.

3. **`disableBemfOnStartup` configuration key** — listed as HIGH firmware item; not found in any doc page.

4. **`bemf_offset[4]` in `KinematicsConfig`** — listed as HIGH firmware item; not found in any doc page.

5. **`dt`-explicit `pid_update()` (gains in per-second units)** — listed as HIGH firmware item. Not found in `motor-control.md`.

---

## Remaining Gaps — Summary

| Severity | Count | Description |
|----------|-------|-------------|
| P0 (wrong base class) | 2 | `09-servos.md:344`, `10-calibration.md:215` — `M00SetupMission(Mission)` should be `M000SetupMission(SetupMission)` |
| P0 (wrong numbering in 01-create.md) | ~12 occurrences | All user-facing create-mission examples show `M01`/`M02`/`M03` (should be `M010`/`M020`/`M030`); `M00` note should say `M000`; `M99` should say `M999` |
| P0 (wrong numbering in other pages) | ~7 occurrences | `03-missions.md` (M01, M02, M03, M99), `03a-synchronizing-robots.md` (M01), `05-custom-steps.md` (M02, m01), `algorithms/wall-alignment.md` (M02) |
| P1 (wrong save path) | 1 | `02-connect.md` says connection saved to `config/connection.yml`; source saves to `raccoon.project.yml` |
| Missing HIGH coverage | 5 | `calibrate_wait_for_light()`, `is_no_calibrate()`, `disableBemfOnStartup`, `bemf_offset[4]`, `pid_update()` dt argument |

---

## New Pages Created (36 total)

```
content/01-botui/04-calibration-board.md
content/02-programming/03a-synchronizing-robots.md
content/02-programming/04a-stop-conditions.md
content/02-programming/09a-motor-steps.md
content/02-programming/12-ui-steps.md
content/02-programming/13-configuration-reference.md
content/02-programming/14-imu.md
content/02-programming/15-competition-ready.md
content/02-programming/16-simulator-testing.md
content/02-programming/17-table-maps.md
content/02-programming/18-yaml-includes.md
content/02-programming/19-motion-flow-and-kinematics.md
content/02-programming/20-arm-kinematics-and-codegen.md
content/02-programming/21-smooth-path.md
content/02-programming/22-localization-resync.md
content/02-programming/algorithms/_index.md
content/02-programming/algorithms/ir-calibration.md
content/02-programming/algorithms/line-following.md
content/02-programming/algorithms/lineup.md
content/02-programming/algorithms/wait-for-light.md
content/02-programming/algorithms/wall-alignment.md
content/03-web-ide/10-code-editor.md
content/03-web-ide/11-run-configurations.md
content/03-web-ide/12-localization-replay.md
content/03-web-ide/13-arm-panel.md
content/04-raccoon-cli/09-sync.md
content/04-raccoon-cli/10-logs.md
content/04-raccoon-cli/11-doctor.md
content/04-raccoon-cli/12-checkpoint.md
content/04-raccoon-cli/13-run-configurations.md
content/04-raccoon-cli/14-wizard.md
content/04-raccoon-cli/15-validate.md
content/04-raccoon-cli/16-raccoon-server.md
content/04-raccoon-cli/17-lcm.md
content/04-raccoon-cli/18-reorder.md
content/04-raccoon-cli/19-completion.md
```
