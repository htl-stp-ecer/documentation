---
title: "Build System"
author: "marios271"
date: 2026-11-04
draft: false
weight: 8
description: "Work in progress: how every repository builds and deploys. One build.py, one deploy.py, results in ./builds/. To be cleaned up and merged into the other sections."
---

# Build System

> **Work in progress.** This section collects everything about the build-system refactor in one place. It will be cleaned up and merged into the other sections later. The refactor lives on the branch `refactor/build-system` in each repository and is **not merged** anywhere yet.

Goal: every repository builds and deploys the same way, so a local build and a CI build are the same thing.

| Page | What it covers |
|---|---|
| [Conventions](00-conventions) | The rules every repository follows: `build.py`, `deploy.py`, `builds/`, versions, Docker |
| [raccoon-cli](01-raccoon-cli) | The first repository converted: what changed, how to build, deploy and test a local build |
| [botui](02-botui) | The second repository: the .deb is built in Docker |
| [raccoon-transport](03-raccoon-transport) | The wheel and contract assets in Docker, and where the contract is matched |
| [Status and open points](04-status-and-open) | What is done, what is planned per repository, what breaks when |
