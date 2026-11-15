---
title: "Contributing"
author: "Mario Scholze"
date: 2026-11-15
draft: false
weight: 5
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

1. Work on the `dev` branch or on a feature branch from it. `main` holds the released state and receives changes through pull requests.
2. Build and test locally. Every repository builds with `python3 build.py` in Docker, see [Build System]({{< ref "/07-build-and-contribute/build-system/_index.md" >}}).
3. To try a change on a real robot, `python3 deploy.py --host <pi>` installs your local build.
4. If you change a message, a channel or the ring layout in `raccoon-transport`, regenerate the contract with `python3 scripts/contract.py --write` and commit it. Otherwise CI fails, see [Transport]({{< ref "/06-advanced/transport/_index.md" >}}).
5. Open a pull request. CI builds the change in the same Docker setup.

## Writing documentation

The documentation is a Hugo site. The folders under `content/` are the top-level sections of the sidebar, and the numeric prefixes set their order. `CONTRIBUTING.md` in the documentation repository has the style rules, the front matter and the shortcodes. Two things to know:

- The [Steps Reference]({{< ref "/02-steps-reference/_index.md" >}}) is generated from `raccoon-lib` (`data/dsl_steps.json`). Do not edit the catalog by hand; fix the docstring of the step in the library instead.
- A page that moves needs an `aliases:` entry with its old URL in the front matter, so old links keep working.
