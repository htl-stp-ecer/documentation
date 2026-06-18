---
title: "Starting the Web IDE"
author: "Tobias Madlberger"
date: 2026-06-18
draft: false
weight: 3
---

## Starting the Web IDE

From inside your project folder:

```bash
raccoon web
```

This starts the **local IDE backend** (a FastAPI server) and serves the pre-built Angular frontend as static files, then opens your browser automatically. The URL will look like:

```
http://localhost:4200/WebIDE/projects/<your-project-uuid>
```

When `raccoon web` is run inside a directory that contains `raccoon.project.yml`, it detects the project UUID and opens the browser directly to that project. When run from a parent directory, it opens the projects list at `/WebIDE/` and you pick a project from there.

## Options

```bash
raccoon web -p 8080      # serve on a different port
raccoon web --no-open    # start the server but don't open the browser
```

## What "raccoon web" starts

`raccoon web` starts **one process** that serves both the Angular frontend and the IDE backend API from the same port:

- `GET /WebIDE/...` — serves the pre-built Angular app (static files)
- `GET/POST/PUT/DELETE /api/v1/...` — IDE backend API (project files, missions, steps, IK/FK)
- `WebSocket /ws/...` — live run output and simulation pose events

The Pi server on the robot is **separate** — it is not started by `raccoon web`. The Web IDE connects to it at `robot-ip:8421` when you issue real-robot run commands. See [Architecture]({{< ref "0a-architecture" >}}) for the full two-backend diagram.

## Troubleshooting startup

**Port already in use**

```
Error: Port 4200 is already in use. Try a different port with -p.
```

Another process (perhaps a previous `raccoon web`) is holding port 4200. Either kill that process or use `-p 8080`.

**Web IDE files not found**

This means the Angular frontend was not bundled during installation. Reinstall with `pip install .` from the toolchain directory (requires Node.js).

**Browser opens to the projects list instead of your project**

Run `raccoon web` from *inside* the project directory (the folder containing `raccoon.project.yml`), not from a parent.
