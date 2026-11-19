---
title: "disconnect"
author: "Tobias Madlberger, Mario Scholze"
date: 2026-11-16
draft: false
weight: 2
description: "Drop the active connection to the robot."
---

# raccoon disconnect

```bash
raccoon disconnect
```

Removes the active connection and clears the session state. It does **not** delete the saved address from `config/connection.yml` or `~/.raccoon/config.yml`; it only drops the in-memory session.

To connect again, see [connect]({{< ref "/03-raccoon-cli/01-connect.md" >}}).
