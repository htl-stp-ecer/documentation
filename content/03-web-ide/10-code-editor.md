---
title: "Python Code Editor"
author: "Raccoon Docs Team"
date: 2026-06-18
draft: false
weight: 13
---

## Overview

The center panel of the Web IDE can switch between two views:

- **Flow** — the visual flowchart editor (default)
- **Code** — a full Python source code editor backed by CodeMirror 6

Both views operate on the same mission. Switching between them at any time is non-destructive: the flowchart represents the mission's logical structure, and the code view shows (and lets you directly edit) the Python source file that is generated from or backing that mission.

## The flowchart and code relationship

The flowchart and the Python file are **two representations of the same mission**. The flowchart is the source of truth for missions you build visually:

- **Saving the flowchart** → IDE backend code-generates the `.py` file from the node graph (overwrites any manual edits)
- **Saving in the code editor** → saves the `.py` file directly (does not regenerate the flowchart)

This means the code view is intentionally a **power-user escape hatch**. Use it when you need to add things that have no flowchart equivalent: imports, helper functions, module-level constants, or complex expressions. After saving manual code edits, avoid re-saving from the flowchart view unless you want those edits overwritten.

---

## Opening the code editor

The center panel has a two-button tab bar at the top:

| Tab | Icon | Keyboard shortcut |
|-----|------|-------------------|
| Flow | Branch/share icon | None (click) |
| Code | `</>` code icon | None (click) |

Click **Code** to switch. The editor opens the Python source for the **currently selected mission** (the one highlighted in the left Mission panel). If no mission is selected the editor shows an empty state prompting you to select one.

Switching back to **Flow** does not discard unsaved edits — your changes remain until you explicitly save or reload.

---

## Editor features

The code editor is built on **CodeMirror 6** with a custom Raccoon warm-dark theme. It ships the following capabilities out of the box:

### Syntax and language support

- Full **Python** syntax highlighting
- **Bracket matching** — the matching bracket is highlighted when your cursor is adjacent to one
- **Auto-close brackets** — typing `(`, `[`, or `{` automatically inserts the closing counterpart
- **Code folding** — click the fold gutter (left of line numbers) to collapse functions and classes
- **Indent on input** — the editor auto-indents the next line after `:` in Python constructs

### Editing experience

- **4-space indentation** by default (Tab key inserts 4 spaces)
- **Line numbers** in the left gutter
- **Active line highlight** — the current line is lightly highlighted
- **Trailing whitespace highlight** — trailing spaces are rendered visibly so you can spot them
- **Selection match highlight** — when you select a word, all other occurrences are highlighted
- **Rectangular selection** — hold Alt and drag to create a column selection
- **Undo/redo** via Ctrl+Z / Ctrl+Shift+Z (standard CodeMirror history)
- **Search** via Ctrl+F (CodeMirror's built-in search panel)

### Autocomplete

The editor enables CodeMirror's default autocomplete. Trigger it manually with Ctrl+Space. Completions are based on the current document content (local completion); there is no server-side type inference in the code view.

### Built-in linter

A lightweight structural linter runs client-side with a 500 ms debounce. It currently checks for one class of error:

**Mixed tabs and spaces in indentation** — Python 3 forbids mixing; the linter flags any line where the leading whitespace contains both tab characters and spaces. Errors appear as red underlines and in the lint gutter on the left.

No network request is made for linting. The linter is purely local.

---

## Saving

The code editor tracks whether the current content differs from the last saved state ("dirty state"). The tab bar shows a dot indicator when there are unsaved changes.

To save:

- **Keyboard:** Ctrl+S (or Cmd+S on macOS)
- The editor intercepts the keydown at the document level, so focus does not need to be inside the editor

Saving sends the current source to the IDE backend via `PUT /api/v1/projects/{uuid}/missions/{name}/source`. On success the dirty indicator clears. On failure a toast notification appears.

> **Note:** Saving the code view saves the Python source file. It does not regenerate the flowchart. If you edit Python directly and then switch to the flowchart view, the flowchart may not reflect your code changes until the mission is reloaded or re-parsed.

---

## Keyboard reference

| Action | Shortcut |
|--------|----------|
| Save | Ctrl+S / Cmd+S |
| Undo | Ctrl+Z |
| Redo | Ctrl+Shift+Z |
| Find | Ctrl+F |
| Find next | Enter (in search panel) |
| Close search | Escape |
| Autocomplete | Ctrl+Space |
| Comment line | Ctrl+/ |
| Fold / unfold | Ctrl+Shift+[ / Ctrl+Shift+] |
| Select all | Ctrl+A |
| Indent selection | Tab |
| Dedent selection | Shift+Tab |

---

## When to use the code editor

The flowchart is the primary interface for most editing. Use the code editor when:

- You need to add **imports**, helper functions, or module-level constants that have no flowchart equivalent
- You want to write a complex expression that is easier to type than to configure via step parameters
- You are debugging a generated file and need to see the exact Python that will run
- You are copying code between projects or pasting from an external editor

Because the code and flowchart share the same source file, edits in one are visible to the other after saving and reloading. In normal use the flowchart code-generates into the Python file; if you edit the Python file directly, those edits may be overwritten the next time the flowchart is saved or code-gen runs. Treat direct code edits as intentional and permanent overrides of the generated logic.

---

## Cross-references

- [Flowchart Editor]({{< ref "03-flowchart-editor" >}}) — the primary editing surface
- [Architecture]({{< ref "0a-architecture" >}}) — how flowchart saves become Python files
