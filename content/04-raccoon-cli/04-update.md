---
title: "update"
author: "Tobias Madlberger"
date: 2026-03-22
draft: false
weight: 5
---

# raccoon update

```bash
raccoon update
```

Updates raccoon on both your laptop and the robot to the latest release.

## What it does

1. Checks the current version on your laptop and on the connected robot
2. Fetches the latest release from GitHub
3. Downloads and installs updated packages on both sides automatically

## Requirements

The [GitHub CLI (`gh`)](https://cli.github.com/) must be installed and authenticated, as the raccoon repository is currently private.

Install `gh`:
```bash
# macOS
brew install gh

# Ubuntu / Debian
sudo apt install gh
```

Authenticate:
```bash
gh auth login
```

## When to run

- After first connecting to a new robot (to ensure both sides match)
- When you see a version mismatch warning from `raccoon run`
- Before a competition to make sure you're on the latest stable release
