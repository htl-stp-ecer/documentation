---
title: "API Reference"
author: "Tobias Madlberger"
date: 2026-06-18
draft: false
weight: 6
---

# API Reference

Full auto-generated documentation for the `raccoon` library surface, built from source on every release.

## Available Steps

All steps available in the `raccoon` DSL, grouped by category. These are the building blocks you use to compose robot missions. The catalog currently covers approximately 110 public steps across motion, motor, servo, sensor, calibration, control-flow, timing, and watchdog categories.

[View Available Steps]({{< relref "01-available-steps" >}})

## Python API

Complete reference for all Python modules — motors, servos, sensors, motion steps, missions, calibration, and more.

<a href="/api/autoapi/index.html" class="api-link" target="_blank">Open Python API Reference</a>

> **Local development note:** The Python API reference at `/api/autoapi/` and the C++ reference at `/api/doxygen/` are populated from a release artifact (`raccoon-docs-*.zip`) that the CI workflow downloads from GitHub on each build. These paths do **not** exist after a fresh `git clone` — a local `hugo server -D` will produce broken links for those two buttons. The Available Steps catalog (`data/dsl_steps.json`) is committed and works locally.

## C++ API (Doxygen)

Low-level C++ class and function reference for the native library internals.

<a href="/api/doxygen/index.html" class="api-link" target="_blank">Open C++ API Reference</a>
