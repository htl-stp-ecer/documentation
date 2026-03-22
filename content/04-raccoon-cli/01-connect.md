---
title: "connect"
author: "Tobias Madlberger"
date: 2026-03-22
draft: false
weight: 3
---

# raccoon connect

```bash
raccoon connect <IP>
```

Connects raccoon to your Wombat robot. Run this once after creating a project, and again any time the robot's IP address changes.

## What it does

1. Checks that the robot's API server is reachable at `<IP>:8421`
2. Attempts SSH key authentication
3. If that fails, offers to set up key authentication automatically:
   - Prompts for the Wombat's password
   - Generates an SSH key pair and copies the public key to the robot
   - Retrieves an API access token from the server
4. Saves the connection config to the project's `config/connection.yml`

After a successful connect, all other raccoon commands (`run`, `sync`, `codegen`, etc.) use the saved connection automatically.

## Default credentials

The Wombat ships with:
- **User:** `pi`
- **Password:** `raspberrypi`

> **Security:** Change the default password once your setup is complete.

## When to re-run

- First time setting up a project
- When the robot's IP address changes (common when switching between networks or connection modes)
- When SSH authentication stops working

## Troubleshooting

**"Connection refused" / API unreachable**
Make sure your laptop is on the same network as the robot and the IP shown in BotUI matches what you're using.

**SSH authentication keeps failing**
Run `raccoon disconnect` then `raccoon connect <IP>` again to redo the key setup.
