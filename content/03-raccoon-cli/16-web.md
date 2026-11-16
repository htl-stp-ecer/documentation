---
title: "web"
author: "Tobias Madlberger, Mario Scholze"
date: 2026-11-16
draft: false
weight: 16
description: "Start the WebIDE on your laptop."
---

# raccoon web

```bash
raccoon web
raccoon web -p 8080
raccoon web --no-open
```

Starts the [WebIDE]({{< ref "/04-web-ide/_index.md" >}}) on your laptop and opens it in the browser. The server runs until you press Ctrl+C.

## Options

| Option | Default | Description |
|--------|---------|-------------|
| `-p, --port PORT` | `4200` | Port to serve on |
| `--no-open` | off | Do not open the browser automatically |

## Inside or outside a project

- **Inside a project folder** (it contains `raccoon.project.yml` with a `uuid`): the browser opens directly on that project at `http://localhost:<port>/WebIDE/projects/<uuid>`. The folder above the project is used as the project root, so your other projects show up in the list as well.
- **Anywhere else:** the browser opens the project list at `http://localhost:<port>/WebIDE/`, using the current folder as the project root.

The server listens on all network interfaces (`0.0.0.0`), so other devices in your network can open the same address.

## Errors

| Message | Cause |
|---------|-------|
| `Web IDE files not found` | The WebIDE was not built when raccoon was installed. Make sure Node.js is installed and reinstall |
| `Port <n> is already in use` | Something else uses the port. Pick another one with `-p` |

`web` does not validate the project first. For how to use the IDE, see [Starting the WebIDE]({{< ref "/04-web-ide/00-starting-the-web-ide.md" >}}).
