---
title: "Raccoon CLI"
author: "Florian Schwanzer"
date: 2026-04-08
draft: false
weight: 1
---

# connect & disconnect

These two commands are responsible for connecting to the wombat and removing the existing saved connection.

## connect


```bash
raccoon connect [OPTIONS] ADDRESS
```

Connect to an wombat via his IP-Address or hostname.

| Option                   | Description                         | Default value |
|--------------------------|-------------------------------------|---------------|
| `-p, --port PORT_NUMBER` | `Pi server port`                    | pi            |
| `-u, --user USERNAME`    | `SSH username`                      | 8421          |
| `--save / --no-save`     | `Save connection to project config` | save          |



### Examples

```bash
raccoon connect 192.168.4.1 #Connect to Wombat with default credentials to 192.168.4.1
raccoon connect -u fox1 --port 8222 192.168.4.1 #Connect to Wombat with custom port and user
```

## disconnect 

Removes the current connection state and disconnects active connection to wombat.

```bash
raccoon disconnect
```

