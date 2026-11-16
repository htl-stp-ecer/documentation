---
title: "Build System"
author: "Mario Scholze"
date: 2026-11-04
draft: false
weight: 20
description: "How every repository builds and deploys: one build.py, one deploy.py, results in ./builds/."
---

# Build System

Every repository builds and deploys the same way, so a local build and a CI build do not need separate build scripts.

| Page | What it covers |
|---|---|
| [Conventions](/07-build-and-contribute/02-build-system/00-conventions/) | The rules every repository follows: `build.py`, `deploy.py`, `builds/`, versions, Docker |
| [raccoon-lib](/07-build-and-contribute/02-build-system/01-raccoon-lib/) | The compiled library and the stubs cross compiled in Docker, what the CI still does with cibuildwheel |
| [raccoon-cli](/07-build-and-contribute/02-build-system/02-raccoon-cli/) | How to build and deploy the wheel |
| [raccoon-transport](/07-build-and-contribute/02-build-system/03-raccoon-transport/) | The wheel and contract assets in Docker, and where the contract is matched |
| [botui](/07-build-and-contribute/02-build-system/04-botui/) | The .deb built in Docker, and trying the UI on the PC |
| [stm32-data-reader](/07-build-and-contribute/02-build-system/05-stm32-data-reader/) | Reader and firmware cross compiled in Docker, the release is a .deb |
