---
title: "Who tells whom: dispatches and the bot"
author: "Tobias Madlberger"
date: 2026-11-02
draft: false
weight: 2
description: "Every repository_dispatch between the RaccoonOS repositories and the Raccoon OS Bot that sends them."
---

# Who tells whom: dispatches and the bot

The repositories notify each other with `repository_dispatch`. Every such call, and every push or pull request made by a workflow into another repository, goes through the **Raccoon OS Bot** (a GitHub App), never through a personal access token.

## Map

| Sender | Event | Receiver | Effect |
|--------|-------|----------|--------|
| raccoon-transport (release) | `transport-released` | raccoon-lib, stm32-data-reader, botui | Pull request that moves the transport submodule, then the pin gate |
| raccoon-cli, raccoon-lib, botui, stm32-data-reader (release) | `component-released` | raccoon-image | `bundle.yml` rewrites `bundles/dev.json` |
| raccoon-lib (release) | `library-release` | documentation | The docs site rebuilds |
| **Create Bundle** | workflow dispatch of `image.yml` | raccoon-image | Builds the image of the new bundle (only with Build image) |
| **Create Bundle** | `bundle-released` | raccoon-example | Moves both pins in every template branch |

Gone: `cli-released` and `lib-released` (CLI and library to the example project). Releases of a single component no longer move the example pins; only a bundle does.

Payload formats are not uniform (botui and the STM reader send a leading `v`, CLI and library do not). Create Bundle and the example workflow normalise it themselves.

## The bot

- **App** installed in: raccoon-example, raccoon-image, raccoon-transport, stm32-data-reader, raccoon-cli, raccoon-lib, botui, documentation. Permissions: *Actions: write*, *Contents: write*, *Pull requests: write*.
- **Credentials:** organisation secret `BOT_PRIVATE_KEY` and organisation variable `BOT_APP_ID`, each shared with the repositories above that send something. A workflow creates a short-lived token with `actions/create-github-app-token`, limited to the repositories it needs.
- Dispatches after a release are **non-fatal**: the release is already published, so a failed dispatch is a warning and never keeps the PyPI upload from running.
- `GH_PAT` still exists only for checking out private submodules in a few release workflows.
- `raccoon-image` has no branch protection on `main`; the bot pushes new files under `bundles/` there.
