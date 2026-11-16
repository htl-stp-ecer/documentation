---
title: "shell"
author: "Tobias Madlberger, Mario Scholze"
date: 2026-11-16
draft: false
weight: 3
description: "Open an interactive SSH shell on the robot."
---

# raccoon shell

```bash
raccoon shell
```

Opens an interactive SSH session on the connected Pi by replacing the current process. You get a normal shell on the Pi, which is useful for looking at logs or running processes.

`raccoon shell` finds the address in this order:

1. The active session, if you ran `raccoon connect` earlier.
2. `connection.pi_address` in the project's `raccoon.project.yml`.
3. The first known Pi in `~/.raccoon/config.yml`.

If no address is found it prints an error and exits.

```bash
raccoon connect 192.168.4.1
raccoon shell
pi@raspberrypi:~ $ tail -f /var/log/raccoon/server.log
pi@raspberrypi:~ $ exit
```

`raccoon shell` calls `ssh` from your PATH. `raccoon doctor` tells you if it is missing.

The address comes from the saved connection, see [connect]({{< ref "/03-raccoon-cli/01-connect.md" >}}).
