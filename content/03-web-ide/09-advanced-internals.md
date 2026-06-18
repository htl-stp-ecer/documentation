---
title: "Advanced Internals"
author: "Docs Bot"
date: 2026-06-18
draft: false
weight: 10
description: "Technical internals of the Web IDE: backends, run configurations, simulation modes, maps, and replay."
---

# Advanced Internals

This page covers the parts of the Web IDE that matter when you need to debug behavior, understand how it talks to the robot, or keep the docs aligned with the actual application.

## Two backends, not one

The Web IDE talks to two different backend classes:

- A **local IDE backend**, default port **4200** (set by `raccoon web --port 4200`)
- **Device backends** running on robot Pis, typically on port **8421**

This is an intentional architecture decision, not an implementation accident.

The `raccoon web` command starts the integrated server (frontend + IDE backend) on port 4200. During Angular development (`npm start`) the frontend runs on port 4300 and the Angular dev proxy routes API calls to the backend on 4200.

The `HttpService` (`http-service.ts`) detects which port to use at runtime:

```typescript
// In development (npm start on port 4300), backend is on 4200.
// In production (raccoon web on port 4200), same-origin routing applies.
private defaultFrontendPort() {
  if (window.location.port === '4300') {
    return '4200';
  }
  return window.location.port || '';
}
```

The source of truth is:

- [web-ide/CLAUDE.md](/media/tobias/TobiasSSD/projects/Botball/raccoon/toolchain/web-ide/CLAUDE.md)

## Port and URL normalization

The application does not hardcode every URL at each call site. URL handling is centralized.

The main HTTP/WebSocket client is:

- [http-service.ts](/media/tobias/TobiasSSD/projects/Botball/raccoon/toolchain/web-ide/src/app/services/http-service.ts)

That service is responsible for:

- local vs device API base resolution (`localApi(path)` vs `deviceApi(path)`)
- converting HTTP URLs to WebSocket URLs for mission execution
- sending run options such as `record_localization` and `run_config`
- table map upload/download
- arm chain FK/IK endpoints

## Run configurations are first-class

The Web IDE has a dedicated run configuration editor. It mirrors the Python-side `RunConfiguration` dataclass and writes `run_configurations:` in `raccoon.project.yml`.

This is implemented in:

- [run-configurations-dialog.ts](/media/tobias/TobiasSSD/projects/Botball/raccoon/toolchain/web-ide/src/app/run-configurations-dialog/run-configurations-dialog.ts)

This means the docs site should treat run configurations as a shared platform concept, not just a CLI implementation detail. See [Run Configurations](../11-run-configurations/) for the full user-facing reference.

## Simulation modes

The flowchart run pipeline distinguishes between different simulation modes.

From the Web IDE code (`flowchart-run-manager.ts`):

```typescript
if (mode === 'debug') {
  simulate = 'fast';
} else if (target === 'simulated') {
  simulate = 'real';
  runMissionKey = null; // whole project
} else {
  simulate = false;
  runMissionKey = null; // whole project on real target
}
```

| Value | When used | What it does |
|-------|-----------|-------------|
| `'fast'` | Debug runs | Heuristic local simulator used for per-mission breakpoint debugging and planning previews. Cheap and instant; pose updates are approximate. |
| `'real'` | Normal simulated runs (config `target: simulated`) | Spawns the actual libstp simulator. Emits real pose and sensor state updates. Behaviorally accurate. |
| `false` | Real robot runs | No simulation; raccoon run executes on the connected Wombat. |

The user-facing entry points are:
- **Run button** with a `simulated` configuration → `simulate = 'real'`, whole project
- **Debug button** → `simulate = 'fast'`, focused mission only

Relevant implementation points:

- [flowchart.ts](/media/tobias/TobiasSSD/projects/Botball/raccoon/toolchain/web-ide/src/app/project-view/flowchart/flowchart.ts)
- [flowchart-run-manager.ts](/media/tobias/TobiasSSD/projects/Botball/raccoon/toolchain/web-ide/src/app/project-view/flowchart/flowchart-run-manager.ts)

## Localization recording and replay

The Web IDE can load replay runs backed by `localization.jsonl`.

This is not just a UI overlay. It depends on a recorder/player contract shared with `raccoon-lib`.

When a run with `record_localization: true` completes, the IDE backend emits a `run_recorded` WebSocket event. `LocalizationReplayService` receives this via its `requestAutoLoad()` method, which sets an `autoLoadRequest` signal. `ProjectView` has an `effect()` that watches this signal and automatically switches the bottom panel to Table Visualization and loads the recording:

```typescript
effect(() => {
  const req = this.replayService.autoLoadRequest();
  if (!req) return;
  this.replayService.clearAutoLoadRequest();
  this.activeBottomPanel.set('table');
  this.replayService.loadRun(req.projectUuid, req.runId).catch(console.error);
});
```

Pieces involved:

- Recorder format contract:
  [recording-format.md](/media/tobias/TobiasSSD/projects/Botball/raccoon/raccoon-lib/modules/libstp-localization/docs/recording-format.md)
- Replay loader/player:
  [localization-replay.service.ts](/media/tobias/TobiasSSD/projects/Botball/raccoon/toolchain/web-ide/src/app/project-view/flowchart/table/replay/localization-replay.service.ts)
- Run options that trigger recording:
  [http-service.ts](/media/tobias/TobiasSSD/projects/Botball/raccoon/toolchain/web-ide/src/app/services/http-service.ts)

See [Localization Replay](../12-localization-replay/) for the full user-facing workflow.

## Table maps in the Web IDE — v2 format

The `.ftmap` format is currently **version 2** with stacked layers and inter-layer transitions. Version 1 maps are accepted on read and automatically migrated.

### v2 data model

```typescript
interface TableMapFileV2 {
  format: 'flowchart-table-map';
  version: 2;
  table: { widthCm: number; heightCm: number };
  layers: TableMapLayer[];          // one or more stacked levels
  transitions: TableMapTransition[]; // ramps / portals connecting layers
  activeLayerId?: string;            // UI hint: which layer was last edited
}

interface TableMapLayer {
  id: string;
  name: string;
  zCm?: number;   // optional visual height (defaults to index * 10)
  lines: TableMapLine[];  // drawn lines and walls on this level
}

interface TableMapTransition {
  id: string;
  fromLayer: string;
  toLayer: string;
  from: TableMapTransitionEdge;  // edge geometry on the source layer
  to: TableMapTransitionEdge;    // corresponding edge on the target layer
  bidirectional?: boolean;       // default true
  costMultiplier?: number;       // path-planning cost weight, default 1
  widthCm?: number;              // ramp clearance width
}
```

### v1 → v2 automatic migration

`migrateTableMap()` in `http-service.ts` handles the conversion:

```typescript
// v1 → v2: flat lines[] wrapped into a single default 'ground' layer
const v1 = file as TableMapFileV1;
return {
  format: 'flowchart-table-map',
  version: 2,
  table,
  layers: [{ id: 'ground', name: 'Ground', zCm: 0, lines: v1.lines ?? [] }],
  transitions: [],
  activeLayerId: 'ground',
};
```

No manual action is required. When the IDE reads an old `.ftmap` file it silently upgrades it to v2 in memory. The file on disk is only updated when you explicitly save or upload the map.

### Map upload/download

The relevant client entry points are:

- [http-service.ts](/media/tobias/TobiasSSD/projects/Botball/raccoon/toolchain/web-ide/src/app/services/http-service.ts) — `getLocalTableMap`, `putLocalTableMap`
- [table-editor-view.ts](/media/tobias/TobiasSSD/projects/Botball/raccoon/toolchain/web-ide/src/app/project-view/flowchart/table/table-editor-view.ts)

The frontend normalizes accepted `.ftmap` shapes before sending them to the backend via `migrateTableMap()`. The resulting v2 object is what lands in `robot.physical.table_map` in `raccoon.project.yml`.

## Panel layout persistence

All panel widths and active panels are persisted to `localStorage` under these keys:

| Key | Description |
|-----|-------------|
| `webide-right-panel-width` | Width of the right tool panel in pixels |
| `webide-active-right-panel` | Which right panel is open (`steps`, `docs`, `robot`, or empty) |
| `webide-left-panel-width` | Width of the left (missions) panel |
| `webide-active-tool-panel` | Which left panel is open (`missions` or empty) |
| `webide-active-bottom-panel` | Which bottom panel is open (`logs`, `table`, `arm`, or empty) |
| `webide-bottom-panel-height` | Height of the bottom panel in pixels |

This means your last layout survives page reloads and browser restarts. If the layout becomes broken, clearing `localStorage` resets everything to defaults.

## Troubleshooting: local backend vs device backend routing errors

A generic `404 Not Found` from the IDE is almost always a routing error — the request went to the wrong backend.

- `localApi(path)` → IDE backend (laptop, port 4200): owns project files, missions, steps, type definitions, arm chain structure
- `deviceApi(path)` → Pi server (robot, port 8421): owns hardware — real-time execution, motor/servo commands, live sensor reads

**Symptom: 404 on arm `/command` route**
The `/command` endpoint for sending servo positions lives on the Pi server, not the IDE backend. Make sure the device base is set (connect to a Pi) before calling arm command routes.

**Symptom: 404 on `/api/v1/projects/...` routes**
These live on the IDE backend. If you see a 404 on a project route, check that:
1. `raccoon web` is running
2. The `localBackendPort` field on the Projects List page shows the correct port (default 4200)
3. The port input is saved (press Enter after typing)
