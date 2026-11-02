---
title: "Example project pins"
author: "Tobias Madlberger"
date: 2026-11-02
draft: false
weight: 4
description: "How raccoon-example keeps the raccoon-cli and raccoon-library pins of its template branches in sync with a bundle."
---

# Example project pins

The template branches of `raccoon-example` (`differential`, `mecanum`) pin `raccoon-cli` and `raccoon-library` exactly in `pyproject.toml`. Every new project created from a template starts with those pins.

## How they move

Only **Create Bundle** moves them: it sends `bundle-released` (bundle name, CLI tag, library tag) to `raccoon-example`, and `bump-raccoon.yml` there:

1. strips the `v` from the tags and waits until both versions are on PyPI (up to 10 minutes),
2. sets **both** pins to exactly those versions in each template branch, also when they are *older* than the current pins — the bundle is the tested truth,
3. opens (or updates) **one pull request per template branch** on `bump/raccoon-pins-<branch>`; title and text name the bundle and show was/now,
4. closes the superseded per-package pull requests (`bump/raccoon-cli-<branch>`, `bump/raccoon-library-<branch>`) and deletes their branches.

A second bundle updates the open pull requests. If the pins already match, a leftover pull request is closed instead of staying open.

By hand: Actions → **Bump raccoon pins** with `cli_version` and `lib_version`; empty means the newest on PyPI.

The workflow lives on `main` on purpose: `repository_dispatch` only runs workflows from the default branch, and anything under `.github/` in a template branch would be copied into every new project. The pin rewriting is a tested script, `scripts/bump_pins.py`.

Pull requests are opened by the Raccoon OS Bot so that checks run on them. **You merge them**; try the template with the new versions first.
