---
title: "Releases"
author: "Tobias Madlberger"
date: 2026-11-02
draft: false
weight: 7
description: "For maintainers: how components are released, how a bundle and an image are made, and how the transport contract is enforced in CI."
---

# Releases

This section is for people who **release** RaccoonOS, not for people who program robots.

| Page | What it covers |
|------|----------------|
| [Bundles and Create Bundle]({{< ref "00-bundles-and-create-bundle" >}}) | What a bundle is, the manual **Create Bundle** workflow, names, the gate, the image |
| [Who tells whom: dispatches and the bot]({{< ref "01-dispatch-map" >}}) | Every `repository_dispatch` between the repositories, and the Raccoon OS Bot |
| [Transport contract in CI]({{< ref "02-transport-contract-in-ci" >}}) | How the hash is computed and changed, the image build gates, the shared check specification |
| [Example project pins]({{< ref "03-example-pins" >}}) | How `raccoon-example` gets its `raccoon-cli` / `raccoon-library` pins |

Users: see [Transport contract]({{< ref "/04-raccoon-cli/20-transport-contract" >}}) and [update]({{< ref "/04-raccoon-cli/04-update" >}}).
