---
title: "Build and Contribute"
author: "Mario Scholze"
date: 2026-11-16
draft: false
weight: 70
description: "Build RaccoonOS components yourself, deploy a local build to a robot, understand releases and CI, and contribute."
---

# Build and Contribute

This section is for people who are willing to contribute to RaccoonOS and/or build the individual components on thair own machine. 

| Page | What it covers |
|------|----------------|
| [Contributing]({{< ref "/07-build-and-contribute/01-contributing.md" >}}) | The repositories, how to get a change in, how to run tests, how to write docs |
| [Build System]({{< ref "/07-build-and-contribute/02-build-system/_index.md" >}}) | The rules every repository follows (`build.py`, `deploy.py`, `builds/`) and one page per repository |

## The short version

Every repository builds and deploys the same way:

```bash
python3 build.py                       # builds inside Docker, result in ./builds/
python3 deploy.py --host <pi-address>  # installs that local build on a robot
```

A local build has the version `0.0`. A deployed local build marks the component as `dev` in `/etc/raccoon-bundle.json`, so the version check is skipped for it. Releases are installed on a robot by `raccoon update` and never by `deploy.py`.

Details and the exceptions per repository are in [Build System → Conventions]({{< ref "/07-build-and-contribute/02-build-system/00-conventions.md" >}}).
