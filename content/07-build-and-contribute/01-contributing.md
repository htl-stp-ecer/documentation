---
title: "Contributing"
author: "Mario Scholze"
date: 2026-11-16
draft: false
weight: 10
description: "Where the code lives, how to build and test it, and how to get a change into RaccoonOS."
---

# Contributing

RaccoonOS is open source and lives in several repositories in the [htl-stp-ecer](https://github.com/htl-stp-ecer) GitHub organization.

## The repositories

| Repository | What is in it | Tests |
|------------|---------------|-------|
| `raccoon-lib` | The robot library (C++20, Python bindings), steps, missions | `pytest tests/` and `ctest` |
| `raccoon-cli` | The `raccoon` CLI, `raccoon-server`, the WebIDE | `pytest tests/` |
| `raccoon-transport` | Messages, channels, shared-memory transport, contract | `integration_tests/`, `python3 -m unittest scripts/test_contract.py` |
| `stm32-data-reader` | The Pi service for the STM32, and the STM32 firmware | `python3 build.py --test` |
| `botui` | The Flutter UI on the robot | `flutter analyze`, `flutter test` |
| `raccoon-cam` | The camera service | `pytest` |
| `raccoon-image` | Builds the SD card image from a bundle | `tests/` |
| `documentation` | This documentation (Hugo) | `hugo server -D` |

Every repository has a `README` with the build commands and a `CONTRIBUTING.md` where it needs one.

## Getting a change in

1. Work on a feature branch. `main` holds the released state and receives changes through pull requests.
2. Build and test locally. Every repository builds with `python3 build.py` in Docker (see [Build System]({{< ref "/07-build-and-contribute/02-build-system/_index.md" >}})).
3. To try a change on a real robot, use `python3 deploy.py --host <pi>`, which installs your local build.
4. If you change a message, a channel or the ring layout in `raccoon-transport`, regenerate the contract with `python3 scripts/contract.py --write` and commit it. Otherwise CI fails, see [Transport]({{< ref "/06-advanced/transport/_index.md" >}}).
5. Open a pull request. CI builds the change in the same Docker setup.

Two rules to know:

- **Transport pin:** in `botui`, `stm32-data-reader` and `raccoon-lib`, a pull request to `main` fails the check `pin-gate` unless the `raccoon-transport` submodule points at a released tag. The message layouts and the ring format are compiled into every component, so a commit without a release cannot be matched against the others.
- **Merging to `main` in `raccoon-transport` is a release.** CI numbers and publishes it and opens pull requests that move the submodule in the three components.

## Writing documentation

The documentation is a Hugo site. The folders under `content/` are the top-level sections of the sidebar, and the numeric prefixes set their order. `CONTRIBUTING.md` in the documentation repository has the style rules, the front matter and the shortcodes. Two things to know:

- The [Steps Reference]({{< ref "/02-steps-reference/_index.md" >}}) is generated from `raccoon-lib` (`data/dsl_steps.json`). Do not edit the catalog by hand; fix the docstring of the step in the library instead.
- When a page moves, fix the `ref` links that point to it. Use the full path from `content/`.
