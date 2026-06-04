# RaccoonOS Docs Audit Report

Date: 2026-05-28

This is a repo-local, source-linked audit of where the documentation site under
`raccoon/raccoon-docs/documentation/content/` does not match the shipped
behavior in this monorepo (toolchain/CLI, library, firmware bridge, and
competition bots).

The goal is to turn “docs are stale” into a concrete backlog with pointers to
the current source of truth.

## Scope

Audited code + artifacts:

- CLI/toolchain: `raccoon/toolchain/raccoon_cli/**`
- Library: `raccoon/raccoon-lib/**`
- Firmware bridge + STM32: `raccoon/stm32-data-reader/**`
- Camera service: `raccoon/raccoon-cam/**`
- Real usage (competition bots): `competition/Ecer2026/**`

Audited docs:

- Docs site content: `raccoon/raccoon-docs/documentation/content/**`

## Executive Summary (Highest-Impact Gaps)

### P0: Actively Misleading / Breaks Users

1. `libstp` vs `raccoon` rename drift
   - Docs teach `from libstp import *` and use “LibSTP” branding in many pages.
   - Reality: `libstp` is now a compatibility shim with an explicit removal
     warning; the primary import surface is `raccoon`.
   - Source of truth: `raccoon/raccoon-lib/python/libstp_compat/libstp/__init__.py`

2. SPI protocol and firmware bridge docs are stale vs implementation
   - Docs claim `TRANSFER_VERSION` 15 and describe fields/flags that don’t
     match the actual shared header.
   - Reality: `TRANSFER_VERSION` is 19, `updates` bits differ, and the buffer
     contains additional fields (e.g. `motorPositionReset`, `featureFlags`).
   - Source of truth: `raccoon/stm32-data-reader/shared/spi/pi_buffer.h`
   - Also undocumented: `stm32-data-reader` auto-reflashes firmware on protocol
     mismatch (actual behavior in code).
   - Source of truth: `raccoon/stm32-data-reader/src/wombat/hardware/Spi.cpp`

3. UUID copy/paste collisions encouraged by docs and present in real projects
   - Docs include a “real project” example with a specific UUID that also
     appears in actual competition bots, and at least two bots share the same
     UUID.
   - Collision impact: remote deploy isolation and routing uses UUID; collisions
     lead to cross-project interference.
   - Example bots with duplicate UUID:
     - `competition/Ecer2026/clawbot/raccoon.project.yml`
     - `competition/Ecer2026/packingbot/raccoon.project.yml`
   - Docs example:
     - `raccoon/raccoon-docs/documentation/content/02-programming/01-project-structure.md`

### P1: Major Missing Knowledge Areas

1. CLI docs incomplete: many shipped commands have no docs pages
   - Docs cover: `create`, `connect`, `run`, `update`, `list` (plus a redundant
     “connect-disconnect” page).
   - CLI actually ships additional top-level commands: `sync`, `status`,
     `wizard`, `codegen`, `calibrate`, `logs`, `lcm`, `checkpoint`, `remove`,
     `reorder`, `doctor`, `validate`, `migrate`, `shell`, `web`, etc.
   - Source of truth: `raccoon/toolchain/raccoon_cli/cli.py`
   - Each command’s options/subcommands live under:
     `raccoon/toolchain/raccoon_cli/commands/*.py`

2. Run configurations are real and used, but docs don’t mention them
   - Projects ship `config/run-configurations.yml` and `raccoon run dev` is a
     first-class behavior.
   - Source of truth:
     - `raccoon/toolchain/raccoon_cli/run_configurations.py`
     - `raccoon/toolchain/raccoon_cli/commands/run.py`
     - Examples in bots:
       - `competition/Ecer2026/drumbot/config/run-configurations.yml`
       - `competition/Ecer2026/clawbot/config/run-configurations.yml`

3. Project-owned services (daemons) exist and are used, but not documented
   - Projects can declare `services:` in `raccoon.project.yml`; `raccoon run`
     deploys them as systemd units; `raccoon logs services` inspects them.
   - Source of truth:
     - `raccoon/toolchain/raccoon_cli/project_services.py`
     - `raccoon/toolchain/raccoon_cli/commands/logs.py` (`logs services ...`)
     - Example:
       - `competition/Ecer2026/drumbot/config/services.yml`

4. Camera stack is referenced but there is no “camera setup” docs page
   - Docs mention camera depends on `raccoon-cam` + `object-detector` but link
     to nonexistent setup documentation.
   - Source of truth for `raccoon-cam`:
     - systemd unit: `raccoon/raccoon-cam/raccoon-cam.service`
     - behavior/config channels: `raccoon/raccoon-cam/src/main.cpp`

5. Systemd reality (what runs on the robot) isn’t represented in docs
   - `stm32_data_reader` + loopback multicast unit are shipped in-tree but
     `content/06-firmware` doesn’t document how to enable/start/debug them.
   - Source of truth:
     - `raccoon/stm32-data-reader/systemd/stm32_data_reader.service`
     - `raccoon/stm32-data-reader/systemd/lcm-loopback-multicast.service`
   - BotUI also ships a unit:
     - `raccoon/botui/systemd/flutter-ui.service`

6. Simulator and test harness are shipped but barely documented
   - `raccoon-lib` ships a simulator module (`libstp-sim`) and a pytest plugin
     that exposes `robot`, `scene`, and `run_step` fixtures.
   - The docs site does not currently teach:
     - how the sim-backed test harness works
     - that it requires a `DRIVER_BUNDLE=mock` build
     - how scenes are resolved from `<project>/scenes/` and bundled package scenes
     - how to structure tests around `use_scene(...)` and `run_step(...)`
   - Source of truth:
     - `raccoon/raccoon-lib/modules/libstp-testing/python/raccoon/testing/pytest_plugin.py`
     - `raccoon/raccoon-lib/modules/libstp-testing/python/raccoon/testing/sim.py`
     - `raccoon/raccoon-lib/scenes/README.md`

7. Table map / `.ftmap` format is a real contract, but the docs barely cover it
   - The robot library, simulator, and Web IDE all depend on the same map
     model (`WorldMap`, `MapSegment`) and `.ftmap` file format.
   - Missing docs:
     - what `.ftmap` stores
     - coordinate conventions / Y-axis flip at load time
     - how `robot.physical.table_map` relates to the on-disk format
     - how bundled scenes and Web IDE maps fit together
   - Source of truth:
     - `raccoon/raccoon-lib/modules/libstp-map/include/libstp/map/WorldMap.hpp`
     - `raccoon/raccoon-lib/modules/libstp-map/bindings/map.cpp`
     - `raccoon/raccoon-lib/scenes/README.md`
     - `raccoon/toolchain/web-ide/src/app/services/http-service.ts`

8. Localization replay / recording format is documented in code, not in the site
   - The Web IDE replay panel consumes `localization.jsonl` files written by
     the localization recorder, but the docs site does not explain the format
     or its operational flow.
   - Source of truth:
     - `raccoon/raccoon-lib/modules/libstp-localization/docs/recording-format.md`
     - `raccoon/toolchain/web-ide/src/app/project-view/flowchart/table/replay/localization-replay.service.ts`

9. Web IDE internals and advanced workflows are undocumented
   - The Web IDE is not just “a UI”: it has two backends (local + device),
     URL/port normalization, WebSocket mission execution, run configuration
     editing, table map upload, and localization replay support.
   - `content/03-web-ide/*` is mostly user-click docs and does not document:
     - the two backend model and port behavior
     - run configurations UI and YAML persistence
     - “fast” vs “real” simulation modes
     - localization replay plumbing
   - Source of truth:
     - `raccoon/toolchain/web-ide/CLAUDE.md`
     - `raccoon/toolchain/web-ide/src/app/services/http-service.ts`
     - `raccoon/toolchain/web-ide/src/app/project-view/flowchart/flowchart-run-manager.ts`
     - `raccoon/toolchain/web-ide/src/app/run-configurations-dialog/run-configurations-dialog.ts`

10. Upgrade/versioning behavior is more nuanced than the current docs suggest
   - The current docs reduce upgrades to “latest release on laptop + robot”.
   - Actual behavior is bundle-driven, distinguishes “ahead of bundle” from
     “behind bundle”, and treats project `format_version` separately from
     package versions.
   - Source of truth:
     - `raccoon/toolchain/raccoon_cli/commands/update.py`
     - `raccoon/toolchain/raccoon_cli/version_checker.py`
     - `raccoon/toolchain/raccoon_cli/commands/migrate.py`
     - `raccoon/raccoon-lib/python/raccoon/__init__.py`

11. YAML include semantics are underexplained at the code-ownership level
   - Current docs mention `!include` and `!include-merge`, but not the write
     semantics that tooling depends on:
     - recursive resolution at any depth
     - merged keys owning values in separate physical files
     - write-back preserving tags and targeting the owning file
   - Source of truth:
     - `raccoon/raccoon-lib/python/raccoon/project_yaml.py`

### P2: Competition Bot “Reality Drift” That Docs Don’t Catch

1. Mission registry consistency failures (config ↔ files ↔ imports)
   - Example: ConeBot references and imports a mission module that is not
     present under `src/missions/`.
   - Example: PackingBot contains many mission files but only exposes a small
     subset in `config/missions.yml`.
   - Missing doc content: explicit “consistency rules”, recommended workflow
     for WIP missions, and “how to recover” when config and filesystem drift.

2. `raccoon run --local` is real workflow (scaffolded/used) but not documented
   - Example: `competition/Ecer2026/clawbot/run.sh` runs `raccoon run --local`.
   - Source of truth: `raccoon/toolchain/raccoon_cli/commands/run.py`

3. Stop-condition misuse in real code should be explicitly warned against
   - Example: a bot uses `>` between stop conditions, which is almost
     certainly incorrect / unintended Python behavior.
   - Missing doc content: “valid operators” + “common foot-guns” section.

## Concrete Mismatches (Docs vs Code)

### Firmware/SPI Protocol

Docs claim:

- `TRANSFER_VERSION` is 15 and `updates` has a parity bit
  - `raccoon/raccoon-docs/documentation/content/06-firmware/spi-protocol.md`

Code reality:

- `TRANSFER_VERSION` is 19
  - `raccoon/stm32-data-reader/shared/spi/pi_buffer.h`
- `updates` is a bitmask and bit `0x80` is `PI_BUFFER_UPDATE_FEATURE_FLAGS`
  - `raccoon/stm32-data-reader/shared/spi/pi_buffer.h`
- Auto-reflash on mismatch exists
  - `raccoon/stm32-data-reader/src/wombat/hardware/Spi.cpp`

### Firmware Flashing / Deploy Workflow

Docs describe SWD/DFU flows:

- `raccoon/raccoon-docs/documentation/content/06-firmware/build-flash.md`

Repo-shipped integration uses Pi-side UART bootloader flashing:

- `raccoon/stm32-data-reader/firmware/flashFiles/flash_wombat.sh`
- `raccoon/stm32-data-reader/firmware/flashFiles/reset_coprocessor.sh`

### stm32-data-reader binary naming

Docs use `stm32-data-reader` (dash), but shipped units run `stm32_data_reader`
(underscore):

- systemd unit: `raccoon/stm32-data-reader/systemd/stm32_data_reader.service`

## Missing Docs Pages (Recommended New/Updated Pages)

This is the minimum set to stop bleeding knowledge.

### CLI (`content/04-raccoon-cli/`)

Add pages for commands that exist in `raccoon/toolchain/raccoon_cli/cli.py` but
have no corresponding docs page:

- `codegen` (options like `--only`, `--output-dir`, `--no-format`)
  - truth: `raccoon/toolchain/raccoon_cli/commands/codegen.py`
- `sync` (push/pull, delete/update/verbose, checkpoint behavior, verification)
  - truth: `raccoon/toolchain/raccoon_cli/commands/sync_cmd.py`
- `status` (connection, versions, mismatch warnings)
  - truth: `raccoon/toolchain/raccoon_cli/commands/status.py`
- `wizard` (what it edits, validation rules, how it chooses defaults)
  - truth: `raccoon/toolchain/raccoon_cli/commands/wizard.py`
- `calibrate` (subcommands and what keys it writes)
  - truth: `raccoon/toolchain/raccoon_cli/commands/calibrate.py`
- `logs` (local vs remote, run detection, filtering, services)
  - truth: `raccoon/toolchain/raccoon_cli/commands/logs.py`
- `lcm` (spy/record/playback/list, formats)
  - truth: `raccoon/toolchain/raccoon_cli/commands/lcm.py`
- `checkpoint`
  - truth: `raccoon/toolchain/raccoon_cli/commands/checkpoint.py`
- `remove` (mission/project)
  - truth: `raccoon/toolchain/raccoon_cli/commands/remove_cmd.py`
- `reorder`
  - truth: `raccoon/toolchain/raccoon_cli/commands/reorder_cmd.py`
- `doctor`
  - truth: `raccoon/toolchain/raccoon_cli/commands/doctor.py`
- `validate`
  - truth: `raccoon/toolchain/raccoon_cli/commands/validate.py`
- `migrate` (format_version migrations)
  - truth: `raccoon/toolchain/raccoon_cli/commands/migrate.py`
- `shell`
  - truth: `raccoon/toolchain/raccoon_cli/commands/shell.py`
- `web`
  - truth: `raccoon/toolchain/raccoon_cli/commands/web.py`

Also update `run` docs to mention:

- `--local`
- `--record-localization` / `--record-hz`
- `raccoon run <run_configuration_name>` behavior
- `--no-mN` skipping missions
  - truth: `raccoon/toolchain/raccoon_cli/commands/run.py`

### Programming / Library (`content/02-programming/`)

1. Decide and codify the canonical import surface
   - If `raccoon` is canonical: update all samples and terminology to match.
   - If `libstp` is still supported: docs must say it’s legacy and explain the
     timeline/compat.
   - truth: `raccoon/raccoon-lib/python/libstp_compat/libstp/__init__.py`

2. Add docs for public API that is exported but not explained
   - truth export list: `raccoon/raccoon-lib/python/raccoon/__init__.py`

3. Add docs for runtime flags that materially change robot behavior
   - `LIBSTP_NO_CALIBRATE`, `LIBSTP_NO_CHECKPOINTS`
   - truth: `raccoon/raccoon-lib/python/raccoon/no_calibrate.py`,
     `raccoon/raccoon-lib/python/raccoon/no_checkpoints.py`

4. Add docs for testing plugin/fixtures
   - truth: `raccoon/raccoon-lib/modules/libstp-testing/python/raccoon/testing/pytest_plugin.py`

### Firmware/Robot Runtime (`content/06-firmware/`)

1. Update SPI protocol page to match shared header (TRANSFER_VERSION, flags,
   buffer layout, mismatch behavior).
   - truth: `raccoon/stm32-data-reader/shared/spi/pi_buffer.h`
2. Add a “Robot-side deployment” page for stm32-data-reader:
   - systemd units, enable/start/journalctl, and why the unit hardening is set
     the way it is.
   - truth:
     - `raccoon/stm32-data-reader/deploy.sh`
     - `raccoon/stm32-data-reader/install.py`
     - `raccoon/stm32-data-reader/systemd/*.service`
3. Document the actual flashing path used here (Pi-side UART bootloader),
   and clearly separate it from alternative “developer bench” methods.
   - truth: `raccoon/stm32-data-reader/firmware/flashFiles/*.sh`

### Camera Setup (New Section/Page)

Add a page that explains:

- What `raccoon-cam` does, how it is started (systemd), where its config lives
  (`./cam-config.yml` relative to service working dir), and what LCM channels
  control it (config + stream enable + detections + frames).
- How BotUI/Web-IDE are expected to interact with it.

Truth:

- `raccoon/raccoon-cam/src/main.cpp`
- `raccoon/raccoon-cam/raccoon-cam.service`

### Services/Daemons (New Section/Page)

Add a page explaining `services:`:

- schema, `module` vs `command`, `after_sync` semantics, `watch`, env vars,
  `required_for_run`, and how to debug via `raccoon logs services`.

Truth:

- `raccoon/toolchain/raccoon_cli/project_services.py`
- `raccoon/toolchain/raccoon_cli/commands/logs.py`

## Deeper Audit Methodology (to reach “document EVERYTHING”)

The above is a starting backlog. To get to “document everything” without
missing hidden features again, the audit should be systematic:

1. Generate an authoritative surface inventory from code
   - CLI: parse Click decorators in `raccoon/toolchain/raccoon_cli/commands/`
     and emit a machine-readable command tree (command, help text, flags,
     args, subcommands).
   - Project schema: parse and document keys from:
     - `raccoon/toolchain/raccoon_cli/run_configurations.py`
     - `raccoon/toolchain/raccoon_cli/project_services.py`
     - `raccoon/raccoon-lib/python/raccoon/project_yaml.py` (include loader)
   - Firmware bridge: derive buffer docs directly from
     `shared/spi/pi_buffer.h` (so docs update whenever the header changes).

2. Build a “docs coverage matrix”
   - Rows: features/public entrypoints (commands, config keys, services, systemd
     units, protocols, LCM channels, Python public exports).
   - Columns: docs pages that cover them.
   - Output: gaps are explicit and reviewable.

3. Extract real-world patterns from competition bots
   - Identify patterns that should be first-class docs topics:
     - mission naming conventions (M000/M010/M999)
     - WIP mission strategy (files exist but not registered)
     - use of `run-configurations.yml`
     - project-owned daemons + vision pipelines
   - Use bots as “living examples” and update docs to match, or update bots
     to match docs (pick one and enforce it).

4. Add doc guardrails to prevent regressions
   - CI check that fails when:
     - CLI command tree changes but docs command pages aren’t updated
     - `TRANSFER_VERSION` in docs doesn’t match `pi_buffer.h`
     - docs contain duplicate UUID examples or reuse a real UUID

## Next

If you tell me what “everything” includes for you (examples: every CLI option,
every config key including hidden ones, every LCM channel and type, every systemd
service, every troubleshooting mode), I can turn this into:

- a tracked backlog file (checkboxes + owners)
- and a script-backed coverage matrix so we can prove completeness over time.
