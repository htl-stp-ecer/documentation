---
title: "Connect to and update the robot"
author: "Tobias Madlberger, Mario Scholze"
date: 2026-11-15
draft: false
weight: 40
description: "Connect your laptop to the Wombat and keep both sides on the same versions."
---

# Connect to and update the robot

## Connect to the robot

```bash
raccoon connect my-robot.local     # replace "my-robot" with the hostname you set previously
```

> **For Windows Users:** Per default, Windows doesn't support mDNS properly. Instead of `my-robot.local`, you must use the robot's IP address instead.

`raccoon connect` first tries to log in with your SSH key. If the Wombat does not accept a key yet, it asks for the password **once**:

- **User:** `pi` (change it with `--user`)
- **Password:** `raspberrypi`

raccoon then creates an SSH key if you have none, installs it on the Wombat and reads the API key of `raccoon-server`. From here on, no password is needed. If the API key cannot be read, the command aborts and nothing is saved.

When it succeeds you see the robot's host name, address and version. The connection is saved in `~/.raccoon/config.yml` and, when you are inside a project, in `raccoon.project.yml`. `raccoon connect` also warns you if the laptop and the robot run different versions, or if the transport contract on the robot does not match its bundle (see `raccoon doctor`). `--no-save` skips saving, and `--port` changes the server port (default 8421).

> **Security:** Change the default password once your setup is complete.


## Update the robot

After connecting to the robot, run:

```bash
raccoon update
```

This checks both sides against the current bundle target and updates anything that's out of date.
