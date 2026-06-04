---
title: "Simulator And Testing"
author: "Docs Bot"
date: 2026-05-28
draft: false
weight: 16
description: "How the raccoon simulator, bundled scenes, and pytest fixtures actually work."
---

# Simulator And Testing

The raccoon stack ships a real simulator and a real pytest integration layer. It is not just a design toy in the Web IDE.

This page covers the parts that matter when you want to write tests against robot code instead of only running on hardware.

## What exists

There are three distinct layers:

- `libstp-sim`
  C++ simulator module used by the Python bindings and test harness.
- `raccoon.testing.sim`
  High-level Python API for attaching a scene and reading simulated state.
- `raccoon.testing.pytest_plugin`
  Auto-loaded pytest plugin that exposes fixtures for project tests.

Source of truth:

- [pytest_plugin.py](/media/tobias/TobiasSSD/projects/Botball/raccoon/raccoon-lib/modules/libstp-testing/python/raccoon/testing/pytest_plugin.py)
- [sim.py](/media/tobias/TobiasSSD/projects/Botball/raccoon/raccoon-lib/modules/libstp-testing/python/raccoon/testing/sim.py)
- [scenes/README.md](/media/tobias/TobiasSSD/projects/Botball/raccoon/raccoon-lib/scenes/README.md)

## Build requirement

Sim-backed tests only work when `raccoon` was built with the mock driver bundle.

The plugin checks this explicitly. If the installed wheel was not built with mock support, the simulator fixtures are skipped with a clear message.

The required build mode is:

```bash
pip install -e . --config-settings=cmake.define.DRIVER_BUNDLE=mock
```

That requirement comes from the plugin and sim wrapper:

- [pytest_plugin.py](/media/tobias/TobiasSSD/projects/Botball/raccoon/raccoon-lib/modules/libstp-testing/python/raccoon/testing/pytest_plugin.py)
- [sim.py](/media/tobias/TobiasSSD/projects/Botball/raccoon/raccoon-lib/modules/libstp-testing/python/raccoon/testing/sim.py)

## Pytest fixtures

The plugin exposes three main fixtures:

- `robot`
  Instantiates the generated `src.hardware.robot.Robot` class for the current project.
- `scene`
  Attaches a simulation scene for the duration of a test.
- `run_step`
  Synchronous wrapper around `await step.run_step(robot)` with a timeout.

Typical pattern:

```python
from raccoon import drive_forward
from raccoon.testing.sim import pose


def test_drives_30cm(robot, scene, run_step):
    scene("empty_table.ftmap", start=(20, 50, 0))
    run_step(drive_forward(cm=30), robot)
    assert pose().x > 45
```

## Scene resolution

Scene names are resolved in this order:

1. absolute path
2. `<project>/scenes/<name>`
3. bundled package scenes shipped with `raccoon`

That means project-local scenes override bundled reference scenes.

Bundled scene names are installed from:

- [scenes/](/media/tobias/TobiasSSD/projects/Botball/raccoon/raccoon-lib/scenes/README.md)

## Bundled reference scenes

The shipped package includes reusable `.ftmap` scenes such as:

- `empty_table.ftmap`
- `single_line.ftmap`
- `wall_box.ftmap`

These are useful for:

- drive/turn smoke tests
- lineup tests
- collision tests
- path planner and localization tests

## Test structure expectations

The pytest plugin expects toolchain-generated project layout:

- `raccoon.project.yml` at the project root
- `src/hardware/robot.py`
- `src/hardware/defs.py`

If those files are missing, imports fail by design. The plugin does not try to guess alternative layouts.

## What should be documented next

This page is only the foundation. The docs site still needs:

- a dedicated simulator API reference page for `raccoon.testing.sim`
- a cookbook of common test patterns
- a section mapping existing test files in `raccoon-lib/tests/python/sim/` to the behaviors they validate
- a page explaining how the Web IDE “real simulator” mode relates to `libstp-sim`

