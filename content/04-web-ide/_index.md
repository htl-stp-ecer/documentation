---
title: "Web IDE"
author: "Tobias Madlberger"
date: 2026-06-18
draft: false
weight: 40
aliases:
  - /03-web-ide/
---

# Web IDE

The Web IDE is a browser-based visual environment for building missions, configuring your robot's physical layout, and running/debugging programs. It runs locally on your laptop and connects to your robot over the network.

## Mental model

Three things need to be in your head before anything else makes sense:

1. **Two backends.** The Web IDE talks to a local IDE backend (your laptop, port 4200) for everything file-related, and to the Pi server (your robot, port 8421) for hardware. They are not interchangeable. A 404 error almost always means the request landed on the wrong one.

2. **The flowchart generates Python.** When you save a flowchart, the local IDE backend's code generator converts your node graph into a `.py` mission file on disk. That file is what `raccoon run` actually executes.

3. **Step indexing is local.** The Step Library is served by the laptop backend, not the robot. Steps are available offline once indexed.

See [Web IDE Architecture]({{< ref "/06-advanced/web-ide-internals/02-architecture.md" >}}) for the full diagram and data-flow explanation.

## Reading order

New to the Web IDE? Start here:

1. [Architecture]({{< ref "/06-advanced/web-ide-internals/02-architecture.md" >}}) — understand the two-backend model and the flowchart-to-Python loop before touching anything else
2. [Starting the Web IDE]({{< ref "/04-web-ide/00-starting-the-web-ide.md" >}}) — `raccoon web` and what the URL means
3. [Interface Overview]({{< ref "/04-web-ide/01-interface-overview.md" >}}) — learn the panel layout
4. [Flowchart Editor]({{< ref "/04-web-ide/03-flowchart-editor.md" >}}) — add and connect steps
5. [Step Library]({{< ref "/04-web-ide/04-step-library.md" >}}) — find and drag steps
6. [Running a Mission]({{< ref "/04-web-ide/07-running-a-mission.md" >}}) — run configurations and the run/debug/stop flow

## All pages

| Page | Description |
|------|-------------|
| [Architecture]({{< ref "/06-advanced/web-ide-internals/02-architecture.md" >}}) | Two-backend model, flowchart-to-Python data flow, what runs locally vs on the robot |
| [Starting the Web IDE]({{< ref "/04-web-ide/00-starting-the-web-ide.md" >}}) | How to launch the Web IDE locally |
| [Interface Overview]({{< ref "/04-web-ide/01-interface-overview.md" >}}) | Tool-stripe layout, center tabs, top bar, and panel persistence |
| [Mission Panel (Left)]({{< ref "/04-web-ide/02-mission-panel.md" >}}) | Mission list, setup/shutdown flags, rename, and ordering |
| [Flowchart Editor (Center)]({{< ref "/04-web-ide/03-flowchart-editor.md" >}}) | Node editing, keyboard shortcuts, and where toolbar controls actually live |
| [Step Library and Step Docs (Right)]({{< ref "/04-web-ide/04-step-library.md" >}}) | Step search, grouping, drag-and-drop, and inline documentation panel |
| [Settings, Robot Config, and Map Editing]({{< ref "/04-web-ide/05-settings-modal.md" >}}) | Settings Modal (Project + Keybindings tabs), Robot Config Panel, map editor, start pose |
| [Tool Panels (Bottom and Right)]({{< ref "/04-web-ide/06-floating-panels.md" >}}) | Logs, Table Visualization, path planning, Arm Visualizer, and Timing panel |
| [Running a Mission]({{< ref "/04-web-ide/07-running-a-mission.md" >}}) | Run configurations, start/stop/debug flow |
| [Projects List]({{< ref "/04-web-ide/08-projects-list.md" >}}) | Navigate back to the projects overview |
| [Advanced Internals]({{< ref "/06-advanced/web-ide-internals/01-advanced-internals.md" >}}) | Technical internals: backends, run configurations, simulation modes, maps, and replay |
| [Python Code Editor]({{< ref "/04-web-ide/10-code-editor.md" >}}) | Full CodeMirror 6 Python editor embedded in the center panel |
| [Run Configurations]({{< ref "/04-web-ide/11-run-configurations.md" >}}) | Named bundles of run flags stored in `raccoon.project.yml` |
| [Localization Replay]({{< ref "/04-web-ide/12-localization-replay.md" >}}) | Frame-by-frame playback of recorded localization runs in the Table Visualization panel |
| [Arm Visualizer Panel]({{< ref "/04-web-ide/13-arm-panel.md" >}}) | 3D joint inspector and IK controller for robotic arm chains |
