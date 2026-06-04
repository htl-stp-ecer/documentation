---
title: "Advanced Internals"
author: "Docs Bot"
date: 2026-05-28
draft: false
weight: 9
description: "Technical internals of the Web IDE: backends, run configurations, simulation modes, maps, and replay."
---

# Advanced Internals

This page covers the parts of the Web IDE that matter when you need to debug behavior, understand how it talks to the robot, or keep the docs aligned with the actual application.

## Two backends, not one

The Web IDE talks to two different backend classes:

- a local backend, typically on port `3000`
- device backends running on robot Pis, typically on port `8421`

This is an intentional architecture decision, not an implementation accident.

The source of truth is:

- [web-ide/CLAUDE.md](/media/tobias/TobiasSSD/projects/Botball/raccoon/toolchain/web-ide/CLAUDE.md)

## Port and URL normalization

The application does not hardcode every URL at each call site. URL handling is centralized.

The main HTTP/WebSocket client is:

- [http-service.ts](/media/tobias/TobiasSSD/projects/Botball/raccoon/toolchain/web-ide/src/app/services/http-service.ts)

That service is responsible for:

- local vs device API base resolution
- converting HTTP URLs to WebSocket URLs for mission execution
- sending run options such as `record_localization` and `run_config`
- table map upload/download

## Run configurations are first-class

The Web IDE has a dedicated run configuration editor. It mirrors the Python-side `RunConfiguration` dataclass and writes `run_configurations:` in `raccoon.project.yml`.

This is implemented in:

- [run-configurations-dialog.ts](/media/tobias/TobiasSSD/projects/Botball/raccoon/toolchain/web-ide/src/app/run-configurations-dialog/run-configurations-dialog.ts)

This means the docs site should treat run configurations as a shared platform concept, not just a CLI implementation detail.

## Simulation modes

The flowchart run pipeline distinguishes between different simulation modes.

From the Web IDE code:

- `'fast'`
  heuristic simulator used for cheap planning-style previews
- `'real'`
  spawns the actual libstp simulator and renders real pose/state updates

Relevant implementation points:

- [flowchart.ts](/media/tobias/TobiasSSD/projects/Botball/raccoon/toolchain/web-ide/src/app/project-view/flowchart/flowchart.ts)
- [flowchart-run-manager.ts](/media/tobias/TobiasSSD/projects/Botball/raccoon/toolchain/web-ide/src/app/project-view/flowchart/flowchart-run-manager.ts)

## Localization recording and replay

The Web IDE can load replay runs backed by `localization.jsonl`.

This is not just a UI overlay. It depends on a recorder/player contract shared with `raccoon-lib`.

Pieces involved:

- recorder format contract:
  [recording-format.md](/media/tobias/TobiasSSD/projects/Botball/raccoon/raccoon-lib/modules/libstp-localization/docs/recording-format.md)
- replay loader/player:
  [localization-replay.service.ts](/media/tobias/TobiasSSD/projects/Botball/raccoon/toolchain/web-ide/src/app/project-view/flowchart/table/replay/localization-replay.service.ts)
- run options that trigger recording:
  [http-service.ts](/media/tobias/TobiasSSD/projects/Botball/raccoon/toolchain/web-ide/src/app/services/http-service.ts)

## Table maps in the Web IDE

The Web IDE owns map editing and upload/download behavior on the frontend side.

The relevant client entry points are:

- [http-service.ts](/media/tobias/TobiasSSD/projects/Botball/raccoon/toolchain/web-ide/src/app/services/http-service.ts)
- [table-editor-view.ts](/media/tobias/TobiasSSD/projects/Botball/raccoon/toolchain/web-ide/src/app/project-view/flowchart/table/table-editor-view.ts)

The frontend normalizes accepted `.ftmap` shapes before sending them to the backend.

## What the docs site still needs

This page covers the architecture, but the docs site still lacks:

- a full page for run configurations shared between CLI and Web IDE
- a page for localization replay workflow and failure modes
- a page for map editing, upload, and how `.ftmap` reaches `robot.physical.table_map`
- troubleshooting guidance for “local backend vs device backend” routing errors

