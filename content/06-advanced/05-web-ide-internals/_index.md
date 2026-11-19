---
title: "WebIDE Internals"
author: "Mario Scholze"
date: 2026-11-15
draft: false
weight: 40
description: "How the WebIDE is built: the backend inside raccoon-cli and the Angular frontend."
---

# WebIDE Internals

This section is for people who work on the WebIDE itself. To **use** it, see the [WebIDE]({{< ref "/04-web-ide/_index.md" >}}) section.

The WebIDE starts with `raccoon web`. Its backend lives in `raccoon-cli` (`raccoon_cli/ide`) and serves a frontend that is built from `web-ide/` in the same repository. Both use the same project operations as the command line, so the CLI and the WebIDE always agree.

| Page | What it covers |
|------|----------------|
| [Architecture]({{< ref "/06-advanced/05-web-ide-internals/02-architecture.md" >}}) | The three tiers, how a flowchart edit becomes Python, running and debugging a mission, key source locations |
| [Advanced Internals]({{< ref "/06-advanced/05-web-ide-internals/01-advanced-internals.md" >}}) | The two backends (local and on the robot), URL handling, run configurations, simulation modes, localization replay, table map format, panel layout |
